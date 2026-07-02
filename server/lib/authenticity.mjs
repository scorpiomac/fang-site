import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";
import { readJson, writeJson, ensureFile } from "./jsonStore.mjs";
import { withFileLock } from "./fileLock.mjs";
import { sendRaw } from "./mailer.mjs";
import { updateOrder } from "./orders.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CERTS_FILE = path.join(path.resolve(__dirname, "../../data"), "authenticityCertificates.json");

ensureFile(CERTS_FILE, { items: {} });

function load() {
  return readJson(CERTS_FILE, { items: {} });
}

function save(data) {
  writeJson(CERTS_FILE, data);
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function generateCertId() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const hex = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `FANG-CERT-${stamp}-${hex}`;
}

export function resolvePublicBaseUrl(settings, fallback = "") {
  const fromSettings = settings?.brand?.siteUrl?.trim();
  if (fromSettings) return fromSettings.replace(/\/$/, "");
  const fromEnv = process.env.FANG_CORS_ORIGIN?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return fallback.replace(/\/$/, "");
}

export function certificateVerifyUrl(certId, baseUrl) {
  return `${baseUrl.replace(/\/$/, "")}/api/store/authenticity/${encodeURIComponent(certId)}/view`;
}

export function getCertificate(certId) {
  return load().items[certId] ?? null;
}

export function listCertificatesForOrder(orderId) {
  const data = load();
  return Object.values(data.items).filter((c) => c.orderId === orderId);
}

/**
 * Crée un certificat par ligne de commande (pièce FANG authentique).
 */
export function issueCertificatesForOrder(order, { baseUrl } = {}) {
  if (!order?.id || !Array.isArray(order.lines) || order.lines.length === 0) {
    return { certificates: [], error: "Commande sans lignes." };
  }

  return withFileLock(CERTS_FILE, () => {
    const data = load();
    const existing = Object.values(data.items).filter((c) => c.orderId === order.id);
    if (existing.length > 0) {
      return { certificates: existing, alreadyIssued: true };
    }

    const issuedAt = new Date().toISOString();
    const certificates = [];

    for (let i = 0; i < order.lines.length; i++) {
      const line = order.lines[i];
      const id = generateCertId();
      const cert = {
        id,
        orderId: order.id,
        lineIndex: i,
        productKey: line.productKey ?? line.productId ?? null,
        slug: line.slug ?? null,
        title: line.title ?? line.name ?? "Pièce FANG",
        variationLabel: line.variationLabel ?? "Pièce",
        size: line.size ?? "—",
        qty: Number(line.qty) || 1,
        chapterLabel: line.chapterLabel ?? null,
        characterName: line.characterName ?? null,
        customerName: order.customer?.name ?? "",
        issuedAt,
        verifyUrl: baseUrl ? certificateVerifyUrl(id, baseUrl) : null,
      };
      data.items[id] = cert;
      certificates.push(cert);
    }

    save(data);
    return { certificates };
  });
}

export async function qrDataUrl(text, size = 220) {
  return QRCode.toDataURL(text, {
    width: size,
    margin: 1,
    color: { dark: "#0d0b09", light: "#f2ebe3" },
    errorCorrectionLevel: "M",
  });
}

export function renderCertificateHtml(cert, settings, { qrDataUrl: qrSrc, embedded = false } = {}) {
  const e = escapeHtml;
  const brand = settings?.brand?.name ?? "FANG";
  const date = new Date(cert.issuedAt).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const pieceMeta = [
    cert.characterName,
    cert.chapterLabel,
    cert.variationLabel !== "Pièce" ? cert.variationLabel : null,
    cert.size ? `Taille ${cert.size}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const bodyStyle = embedded
    ? "margin:0;padding:0;background:transparent;"
    : "margin:0;padding:32px 16px;background:#0d0b09;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:Georgia,'Times New Roman',serif;";

  const printBtn = embedded
    ? ""
    : `<button class="cert-print" onclick="window.print()">Imprimer / Enregistrer PDF</button>`;

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Certificat d'authenticité — ${e(cert.id)}</title>
<style>
* { box-sizing: border-box; }
body { ${bodyStyle} color: #f2ebe3; }
.cert-print {
  position: fixed; top: 16px; right: 16px; z-index: 10;
  padding: 10px 18px; border: 1px solid rgba(201,166,107,.45);
  background: rgba(13,11,9,.85); color: #f2ebe3; cursor: pointer;
  font-size: 11px; letter-spacing: .14em; text-transform: uppercase;
}
.cert {
  width: min(640px, 100%);
  border: 1px solid rgba(201,166,107,.35);
  border-radius: 4px;
  background:
    radial-gradient(120% 80% at 0% 0%, rgba(201,166,107,.12), transparent 55%),
    linear-gradient(165deg, #151210 0%, #0d0b09 100%);
  box-shadow: 0 40px 100px rgba(0,0,0,.55);
  overflow: hidden;
}
.cert__inner { padding: 40px 36px 32px; }
.cert__eyebrow {
  margin: 0 0 8px; font-size: 10px; letter-spacing: .32em;
  text-transform: uppercase; color: #c9a66b;
}
.cert__title {
  margin: 0 0 6px; font-size: clamp(1.6rem, 4vw, 2rem);
  font-weight: 400; letter-spacing: .04em;
}
.cert__subtitle { margin: 0 0 28px; color: rgba(242,235,227,.55); font-size: .92rem; }
.cert__grid {
  display: grid; grid-template-columns: 1fr auto; gap: 24px; align-items: start;
}
.cert__piece { margin: 0 0 10px; font-size: 1.35rem; line-height: 1.25; }
.cert__meta { margin: 0; color: rgba(242,235,227,.62); font-size: .88rem; line-height: 1.5; }
.cert__id {
  margin: 18px 0 0; padding-top: 16px; border-top: 1px solid rgba(242,235,227,.1);
  font-size: .78rem; letter-spacing: .08em; color: rgba(242,235,227,.45);
}
.cert__qr {
  width: 132px; height: 132px; padding: 8px;
  background: #f2ebe3; border-radius: 4px;
  border: 1px solid rgba(201,166,107,.5);
}
.cert__qr img { width: 100%; height: 100%; display: block; }
.cert__qr-label {
  margin: 8px 0 0; font-size: 9px; letter-spacing: .18em;
  text-transform: uppercase; text-align: center; color: rgba(242,235,227,.4);
}
.cert__footer {
  padding: 14px 36px 18px; border-top: 1px solid rgba(201,166,107,.18);
  font-size: .72rem; color: rgba(242,235,227,.38); line-height: 1.5;
}
.cert__seal {
  display: inline-block; margin-top: 20px; padding: 6px 14px;
  border: 1px solid rgba(201,166,107,.45); color: #c9a66b;
  font-size: 10px; letter-spacing: .22em; text-transform: uppercase;
}
@media print {
  body { background: #fff; padding: 0; }
  .cert-print { display: none; }
  .cert { box-shadow: none; border-color: #ccc; color: #111; background: #fff; }
  .cert__subtitle, .cert__meta, .cert__id, .cert__footer, .cert__qr-label { color: #555; }
}
</style>
</head>
<body>
${printBtn}
<article class="cert">
  <div class="cert__inner">
    <p class="cert__eyebrow">${e(brand)} · Dakar</p>
    <h1 class="cert__title">Certificat d'authenticité</h1>
    <p class="cert__subtitle">Pièce originale produite à l'atelier — vérifiable en ligne</p>
    <div class="cert__grid">
      <div>
        <p class="cert__piece">${e(cert.title)}</p>
        ${pieceMeta ? `<p class="cert__meta">${e(pieceMeta)}</p>` : ""}
        <p class="cert__meta">Commande <strong>${e(cert.orderId)}</strong><br>Émis le ${e(date)}<br>Porteur : ${e(cert.customerName || "—")}</p>
        <span class="cert__seal">Authenticité garantie</span>
        <p class="cert__id">N° ${e(cert.id)}</p>
      </div>
      <div>
        <div class="cert__qr">${qrSrc ? `<img src="${qrSrc}" alt="QR code de vérification" />` : ""}</div>
        <p class="cert__qr-label">Scanner pour vérifier</p>
      </div>
    </div>
  </div>
  <div class="cert__footer">
    Ce certificat atteste que la pièce décrite est une création authentique ${e(brand)}.
    Conservez-le avec votre commande. En cas de revente, le QR permet de confirmer l'origine atelier.
  </div>
</article>
</body>
</html>`;
}

function renderCertificatesEmailHtml(order, certificates, settings, qrByCertId) {
  const e = escapeHtml;
  const brand = settings?.brand?.name ?? "FANG";
  const cards = certificates
    .map((cert) => {
      const qr = qrByCertId[cert.id] ?? "";
      const url = cert.verifyUrl ?? "";
      return `
      <div style="margin:0 0 28px;padding:24px;border:1px solid #3d3428;border-radius:6px;background:linear-gradient(160deg,#1a1612,#0d0b09);color:#f2ebe3;">
        <p style="margin:0 0 6px;font-size:10px;letter-spacing:.28em;text-transform:uppercase;color:#c9a66b;">${e(brand)}</p>
        <h2 style="margin:0 0 12px;font-size:20px;font-weight:400;">${e(cert.title)}</h2>
        <p style="margin:0 0 16px;font-size:13px;color:rgba(242,235,227,.65);">
          ${e(cert.variationLabel !== "Pièce" ? cert.variationLabel + " · " : "")}Taille ${e(cert.size)}<br>
          N° ${e(cert.id)}
        </p>
        <table cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="padding-right:16px;vertical-align:top;">
            ${qr ? `<img src="${qr}" width="120" height="120" alt="QR" style="display:block;background:#f2ebe3;padding:6px;border-radius:4px;" />` : ""}
          </td>
          <td style="vertical-align:middle;font-size:13px;color:rgba(242,235,227,.7);">
            Scannez le QR code ou ouvrez le lien pour vérifier l'authenticité de votre pièce.
            ${url ? `<br><br><a href="${e(url)}" style="color:#c9a66b;">Voir le certificat en ligne →</a>` : ""}
          </td>
        </tr></table>
      </div>`;
    })
    .join("");

  return `<!doctype html>
<html lang="fr"><body style="margin:0;padding:24px;background:#0d0b09;font-family:Georgia,serif;">
<div style="max-width:560px;margin:0 auto;color:#f2ebe3;">
  <p style="margin:0 0 8px;font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:#c9a66b;">${e(brand)}</p>
  <h1 style="margin:0 0 12px;font-size:26px;font-weight:400;">Vos certificats d'authenticité</h1>
  <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:rgba(242,235,227,.7);">
    Bonjour ${e(order.customer?.name ?? "")},<br><br>
    Votre commande <strong>${e(order.id)}</strong> est finalisée. Voici le(s) certificat(s) attestant l'authenticité de votre(vos) pièce(s) FANG.
  </p>
  ${cards}
  <p style="margin:0;font-size:12px;color:rgba(242,235,227,.45);">
    Conservez cet e-mail. L'équipe ${e(brand)} — ${e(settings.contact?.email ?? "")}
  </p>
</div>
</body></html>`;
}

/**
 * Émet et envoie les certificats (idempotent par commande).
 * Déclenché quand la commande est payée ou livrée.
 */
export async function sendOrderAuthenticityCertificates(order, settings, baseUrl) {
  if (!order?.customer?.email) return { ok: false, skipped: true, reason: "Pas d'e-mail client" };
  if (order.status === "cancelled") return { ok: false, skipped: true, reason: "Commande annulée" };
  if (order.authenticity?.sentAt) {
    return { ok: true, alreadySent: true, certificates: listCertificatesForOrder(order.id) };
  }

  const publicBase = resolvePublicBaseUrl(settings, baseUrl);
  const { certificates, alreadyIssued, error } = issueCertificatesForOrder(order, {
    baseUrl: publicBase,
  });
  if (error) return { ok: false, error };
  if (!certificates?.length) return { ok: false, error: "Aucun certificat généré" };

  const qrByCertId = {};
  for (const cert of certificates) {
    const url = cert.verifyUrl ?? certificateVerifyUrl(cert.id, publicBase || "https://fang.tickets-place.net");
    qrByCertId[cert.id] = await qrDataUrl(url, 240);
    if (!cert.verifyUrl) {
      cert.verifyUrl = url;
    }
  }

  const brand = settings?.brand?.name ?? "FANG";
  const subject =
    certificates.length === 1
      ? `${brand} — Certificat d'authenticité · ${certificates[0].title}`
      : `${brand} — Vos certificats d'authenticité · commande ${order.id}`;

  const html = renderCertificatesEmailHtml(order, certificates, settings, qrByCertId);
  const text = `Bonjour ${order.customer.name},\n\nVotre commande ${order.id} est finalisée. Consultez vos certificats d'authenticité FANG dans la version HTML de cet e-mail.\n\n${certificates.map((c) => `• ${c.title} — ${c.verifyUrl}`).join("\n")}\n\n— ${brand}`;

  const mail = await sendRaw({
    to: order.customer.email,
    subject,
    text,
    html,
  });

  if (!mail.ok) return mail;

  updateOrder(order.id, {
    authenticity: {
      sentAt: new Date().toISOString(),
      certificateIds: certificates.map((c) => c.id),
    },
  });

  return { ok: true, certificates, alreadyIssued };
}

export async function buildCertificatePage(cert, settings) {
  const base = cert.verifyUrl ?? certificateVerifyUrl(cert.id, resolvePublicBaseUrl(settings));
  const qrSrc = await qrDataUrl(base, 260);
  return renderCertificateHtml(cert, settings, { qrDataUrl: qrSrc });
}
