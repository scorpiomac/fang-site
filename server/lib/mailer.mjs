import nodemailer from "nodemailer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJson, writeJson, ensureFile } from "./jsonStore.mjs";
import { getSettings } from "./settings.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_FILE = path.join(path.resolve(__dirname, "../../data"), "mailTemplates.json");

const DEFAULT_TEMPLATES = {
  order_confirmation: {
    label: "Confirmation de commande",
    subject: "Votre commande {{brand}} {{orderId}} est confirmée",
    body: `Bonjour {{customerName}},

Merci d'avoir choisi {{brand}}.

Votre commande {{orderId}} a bien été enregistrée et sera traitée par l'atelier.

Récapitulatif :
{{orderSummary}}

Sous-total : {{subtotal}}
Livraison : {{shipping}}
{{taxLine}}{{discountLine}}Total : {{total}}

Méthode de paiement choisie : {{paymentLabel}}
{{paymentInstructions}}

Délai de production estimé : {{leadTime}}

Vous pouvez suivre votre commande à tout moment depuis votre espace client.

À très vite,
L'équipe {{brand}} — {{contactEmail}}`,
  },
  order_status_change: {
    label: "Changement de statut de commande",
    subject: "Mise à jour de votre commande {{orderId}}",
    body: `Bonjour {{customerName}},

Votre commande {{orderId}} est désormais : {{statusLabel}}.

{{statusBody}}

Total : {{total}}

L'équipe {{brand}}`,
  },
  customer_welcome: {
    label: "Bienvenue (création de compte)",
    subject: "Bienvenue chez {{brand}}",
    body: `Bonjour {{customerName}},

Votre compte {{brand}} est créé. Vous pouvez désormais suivre vos commandes et accéder à votre profil ici : {{accountUrl}}

À très vite,
L'équipe {{brand}}`,
  },
  password_reset: {
    label: "Mot de passe oublié",
    subject: "Réinitialisation de votre mot de passe",
    body: `Bonjour {{customerName}},

Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien suivant (valable 30 minutes) :

{{resetUrl}}

Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.

— {{brand}}`,
  },
  admin_new_order: {
    label: "Notification admin (nouvelle commande)",
    subject: "[{{brand}}] Nouvelle commande {{orderId}} — {{total}}",
    body: `Nouvelle commande sur le site :

ID : {{orderId}}
Client : {{customerName}} ({{customerEmail}}, {{customerPhone}})
Ville : {{customerCity}}, {{customerCountry}}
Total : {{total}}
Paiement : {{paymentLabel}}

{{orderSummary}}

Voir dans l'admin : {{adminOrderUrl}}`,
  },
  contact_message: {
    label: "Message de contact (admin)",
    subject: "[{{brand}}] Nouveau message — {{contactName}}",
    body: `De : {{contactName}} <{{contactEmail}}>
Téléphone : {{contactPhone}}

{{contactMessage}}`,
  },
};

ensureFile(TEMPLATES_FILE, DEFAULT_TEMPLATES);

export function getTemplates() {
  const stored = readJson(TEMPLATES_FILE, {});
  const merged = { ...DEFAULT_TEMPLATES };
  for (const key of Object.keys(DEFAULT_TEMPLATES)) {
    merged[key] = { ...DEFAULT_TEMPLATES[key], ...(stored[key] ?? {}) };
  }
  return merged;
}

export function updateTemplate(id, patch) {
  const templates = getTemplates();
  if (!templates[id]) return null;
  templates[id] = { ...templates[id], ...patch };
  writeJson(TEMPLATES_FILE, templates);
  return templates[id];
}

export function interpolate(template, vars) {
  return String(template ?? "").replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
    const path = String(key).split(".");
    let value = vars;
    for (const p of path) {
      if (value == null) return "";
      value = value[p];
    }
    return value == null ? "" : String(value);
  });
}

let cachedTransport = null;
let cachedConfig = null;

function buildTransport() {
  const host = process.env.FANG_SMTP_HOST;
  const port = Number(process.env.FANG_SMTP_PORT ?? 587);
  const user = process.env.FANG_SMTP_USER;
  const pass = process.env.FANG_SMTP_PASS;
  const secure = String(process.env.FANG_SMTP_SECURE ?? "false") === "true";

  const config = { host, port, user, secure };
  const sig = JSON.stringify(config);
  if (cachedTransport && cachedConfig === sig) return cachedTransport;

  if (!host || !user || !pass) {
    // Mode "logger" : pas de SMTP configuré → on log seulement
    cachedTransport = {
      isStub: true,
      async sendMail(opts) {
        console.log("[mailer:stub] would send", {
          to: opts.to,
          subject: opts.subject,
        });
        return { messageId: "stub", accepted: [opts.to] };
      },
      async verify() {
        return false;
      },
    };
    cachedConfig = sig;
    return cachedTransport;
  }
  cachedTransport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
  cachedConfig = sig;
  return cachedTransport;
}

export function isSmtpConfigured() {
  return Boolean(
    process.env.FANG_SMTP_HOST && process.env.FANG_SMTP_USER && process.env.FANG_SMTP_PASS
  );
}

export async function verifyMailer() {
  const t = buildTransport();
  if (t.isStub) return { ok: false, reason: "SMTP non configuré (.env)" };
  try {
    await t.verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Envoie un e-mail à partir d'un template.
 * @param {string} templateId - ID du template (clé)
 * @param {string|string[]} to - Destinataire(s)
 * @param {object} vars - Variables d'interpolation
 */
export async function sendTemplate(templateId, to, vars = {}) {
  const settings = getSettings();
  const templates = getTemplates();
  const template = templates[templateId];
  if (!template) return { ok: false, error: `Template ${templateId} introuvable` };

  const subject = interpolate(template.subject, vars);
  const text = interpolate(template.body, vars);
  const from = settings.mail.from || "FANG <no-reply@fang.studio>";

  try {
    const transport = buildTransport();
    const recipients = Array.isArray(to) ? to.join(", ") : to;
    await transport.sendMail({ from, to: recipients, subject, text });
    return { ok: true };
  } catch (err) {
    console.error("[mailer] send error:", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function sendRaw({ to, subject, text, html }) {
  const settings = getSettings();
  const from = settings.mail.from || "FANG <no-reply@fang.studio>";
  try {
    const transport = buildTransport();
    await transport.sendMail({ from, to, subject, text, html });
    return { ok: true };
  } catch (err) {
    console.error("[mailer] sendRaw error:", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Envoie une notification admin si activée
 */
export async function notifyAdmins(templateId, vars = {}) {
  const settings = getSettings();
  if (!settings.mail.notifyAdmins) return { ok: false, skipped: true };
  const recipients = (settings.mail.adminRecipients || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (recipients.length === 0) return { ok: false, skipped: true };
  return sendTemplate(templateId, recipients, vars);
}

export const DEFAULT_MAIL_TEMPLATES = DEFAULT_TEMPLATES;
