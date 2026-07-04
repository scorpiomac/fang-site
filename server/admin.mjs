#!/usr/bin/env node
/**
 * Serveur FANG — backoffice + boutique (commandes, promos)
 * Variables : voir .env.example
 */
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import rateLimit from "express-rate-limit";
import { readJson, writeJson, ensureFile } from "./lib/jsonStore.mjs";
import {
  initUsers,
  authenticate,
  createSession,
  revokeSession,
  revokeUserSessions,
  sessionMiddleware,
  changeUserPassword,
  requireCommerce,
  requireUserManagement,
  toPublicUser,
} from "./lib/auth.mjs";
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserByEmail,
  getUserById,
  resetUserPassword,
  USER_ROLES,
} from "./lib/users.mjs";
import {
  createOrder,
  listOrders,
  getOrder,
  updateOrder,
  orderStats,
  listOrdersForCustomer,
  getCustomerOrder,
  getCustomerOrderSummary,
  trackGuestOrder,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
} from "./lib/orders.mjs";
import {
  registerCustomer,
  updateCustomerProfile,
  changeCustomerPassword,
  resetCustomerPassword,
  getCustomerByEmail,
  getCustomerById,
  toPublicCustomer,
  listCustomers,
  listAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getDefaultShippingAddress,
} from "./lib/customers.mjs";
import {
  createResetToken,
  consumeResetToken,
  peekResetToken,
} from "./lib/passwordReset.mjs";
import {
  listWishlist,
  addWishlist,
  removeWishlist,
} from "./lib/wishlists.mjs";
import {
  listReviewsForProduct,
  listAllReviews,
  createReview,
  moderateReview,
  deleteReview,
  getProductRatingSummary,
  getAllRatings,
} from "./lib/reviews.mjs";
import {
  listPages,
  getPage,
  updatePage,
} from "./lib/pages.mjs";
import { recordAudit, listAudit } from "./lib/audit.mjs";
import {
  createBackup,
  listBackups,
  restoreBackup,
  scheduleDailyBackup,
} from "./lib/backup.mjs";
import {
  listOnlineProviders,
  createPaymentIntent,
  getIntent,
  markIntentPaid,
  verifyWebhookSignature,
} from "./lib/payments.mjs";
import {
  generateRefCommand,
  savePending,
  getPending,
  appendIpnLog,
  markProcessed,
  purgePending,
} from "./lib/checkoutPending.mjs";
import {
  paytechConfig,
  requestPaytechToken,
  verifyPaytechIpn,
  paytechAmountMatches,
  paytechTargetForMethod,
} from "./lib/paytech.mjs";
import {
  paydunyaConfig,
  createPaydunyaInvoice,
  confirmPaydunyaInvoice,
  verifyPaydunyaHash,
  paydunyaAmountMatches,
  PAYDUNYA_CHANNEL_MAP,
  PAYDUNYA_MIN_CHECKOUT_AMOUNT,
} from "./lib/paydunya.mjs";
import {
  activeCheckoutProvider,
  paymentProvidersStatus,
} from "./lib/checkoutGateway.mjs";
import {
  CMS_SCHEMA,
  getCmsPublished,
  getCmsDraft,
  getCmsState,
  updateCmsSection,
  publishCms,
  revertCmsDraft,
  createPreviewToken,
  isValidPreviewToken,
} from "./lib/cms.mjs";
import {
  authenticateCustomer,
  createCustomerSession,
  revokeCustomerSession,
  customerSessionMiddleware,
  validateCustomerSession,
} from "./lib/customerAuth.mjs";
import {
  validatePromo,
  incrementPromoUsage,
  listPromos,
  createPromo,
  updatePromo,
  deletePromo,
} from "./lib/promos.mjs";
import {
  getSettings,
  updateSettings,
  getPublicSettings,
} from "./lib/settings.mjs";
import {
  listZones,
  matchZone,
  quoteShipping,
  getZone,
  createZone,
  updateZone,
  deleteZone,
} from "./lib/shipping.mjs";
import {
  getAllStock,
  getStockForProduct,
  getStockQty,
  setStock,
  setStockQty,
  reserveStock,
  getStockSummary,
} from "./lib/stock.mjs";
import {
  getTemplates as getMailTemplates,
  updateTemplate as updateMailTemplate,
  verifyMailer,
  sendTemplate,
  sendRaw,
  notifyAdmins,
  isSmtpConfigured,
} from "./lib/mailer.mjs";

initUsers();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CATALOG_FILE = path.join(ROOT, "src/content/atelierCatalog.json");
const PRODUCTS_OVERRIDES_FILE = path.join(ROOT, "src/content/productsOverrides.json");
const SITE_OVERRIDES_FILE = path.join(ROOT, "src/content/siteOverrides.json");
const PUBLIC_ROOT = path.join(ROOT, "public");
const MEDIA_ROOT = path.join(ROOT, "public/collection/s01");
const LIBRARY_ROOT = path.join(ROOT, "public/medias/library");
const PORT = Number(process.env.FANG_ADMIN_PORT ?? 5170);
const CORS_ORIGIN = process.env.FANG_CORS_ORIGIN ?? "http://localhost:5173";

const IMG_RE = /\.(jpe?g|png|webp)$/i;

const app = express();

// Trust X-Forwarded-* headers en prod (reverse proxy / load balancer)
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Sécurité : helmet (CSP, HSTS, X-Frame-Options, etc.)
const isProd = process.env.NODE_ENV === "production";
app.use(
  helmet({
    contentSecurityPolicy: isProd
      ? {
          useDefaults: true,
          directives: {
            "default-src": ["'self'"],
            "img-src": ["'self'", "data:", "blob:", "https:"],
            "media-src": ["'self'", "blob:", "https:"],
            "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
            "connect-src": ["'self'"],
            "frame-ancestors": ["'none'"],
          },
        }
      : false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    hsts: isProd ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  })
);

// Compression gzip
app.use(compression());

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));

const RATE_LIMIT_DISABLED = process.env.FANG_DISABLE_RATE_LIMIT === "1";
const noopLimiter = (_req, _res, next) => next();

const loginLimiter = RATE_LIMIT_DISABLED
  ? noopLimiter
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 12,
      message: { error: "Trop de tentatives. Réessayez dans 15 minutes." },
    });
const storeLimiter = RATE_LIMIT_DISABLED
  ? noopLimiter
  : rateLimit({
      windowMs: 60 * 1000,
      max: 40,
      message: { error: "Trop de requêtes. Réessayez dans un instant." },
    });

/* ───────── SEO : robots.txt + sitemap.xml ───────── */
function getPublicBaseUrl(req) {
  const settings = getSettings();
  if (settings.brand?.siteUrl) return String(settings.brand.siteUrl).replace(/\/$/, "");
  const proto = req.headers["x-forwarded-proto"] ?? "http";
  return `${proto}://${req.headers.host}`;
}

app.get("/robots.txt", (req, res) => {
  const base = getPublicBaseUrl(req);
  const settings = getSettings();
  const blocked = settings.maintenance?.enabled ? "Disallow: /\n" : "";
  res.type("text/plain").send(
    `User-agent: *\n` +
      (blocked || "Allow: /\nDisallow: /admin\nDisallow: /compte\nDisallow: /commande\n") +
      `Sitemap: ${base}/sitemap.xml\n`
  );
});

app.get("/sitemap.xml", (req, res) => {
  const base = getPublicBaseUrl(req);
  const urls = [
    { loc: "/", priority: 1.0 },
    { loc: "/boutique", priority: 0.9 },
    { loc: "/collection", priority: 0.8 },
    { loc: "/contact", priority: 0.5 },
  ];

  // Pages éditoriales activées
  try {
    for (const page of listPages()) {
      if (page.enabled !== false) {
        urls.push({ loc: `/pages/${page.slug}`, priority: 0.4 });
      }
    }
  } catch {
    /* ignore */
  }

  // Produits (lus depuis src/content/shop.ts via export généré) — sinon depuis data/products.json si présent
  try {
    const productsFile = path.resolve(process.cwd(), "data", "products.json");
    if (fs.existsSync(productsFile)) {
      const products = JSON.parse(fs.readFileSync(productsFile, "utf8"));
      if (Array.isArray(products)) {
        for (const p of products) {
          if (p?.slug) urls.push({ loc: `/boutique/${p.slug}`, priority: 0.7 });
        }
      }
    }
  } catch {
    /* ignore */
  }

  const now = new Date().toISOString();
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (u) =>
          `  <url><loc>${base}${u.loc}</loc><lastmod>${now}</lastmod><priority>${u.priority.toFixed(
            1
          )}</priority></url>`
      )
      .join("\n") +
    `\n</urlset>\n`;
  res.type("application/xml").send(body);
});

/* ───────── Paiements en ligne — PayTech / PayDunya ─────────
 * Principe : le panier est sauvé en pending (CHK-...).
 * La commande FANG n'est créée qu'après confirmation IPN/callback.
 * Idempotence garantie par checkoutPending.markProcessed + lock fichier.
 */

app.get("/api/store/payments/providers", (_req, res) => {
  res.json({ providers: listOnlineProviders() });
});

app.get("/api/admin/payments/status", sessionMiddleware, requireCommerce, (_req, res) => {
  res.json(paymentProvidersStatus());
});

/**
 * Démarre un checkout en ligne.
 *
 * Logique : on crée IMMÉDIATEMENT la commande FANG avec status="pending"
 * et paymentStatus="pending". Le pending (CHK-...) sert uniquement de
 * registre ref→orderId pour retrouver la commande au callback IPN.
 * Au callback : on passe en status="confirmed" + paymentStatus="paid" et
 * on envoie les e-mails de confirmation.
 *
 * Avantage : toutes les tentatives sont tracées en admin (commandes en attente).
 * Le stock est réservé à la création (atomique). Si le paiement échoue,
 * l'admin peut annuler la commande pour rendre le stock.
 */
app.post("/api/store/checkout/start", storeLimiter, async (req, res) => {
  const customerToken =
    req.header("authorization")?.replace(/^Bearer\s+/i, "") ??
    req.header("x-customer-token") ??
    "";
  const customerAuth = validateCustomerSession(customerToken);

  const built = buildPendingPayload(req.body, customerAuth);
  if (built.error) return res.status(built.status).json({ error: built.error });
  const { pendingPayload, settings } = built;

  const provider = activeCheckoutProvider();
  const allowSimulated =
    process.env.CHECKOUT_ALLOW_SIMULATED_PAYMENT === "true" ||
    settings.checkout?.allowSimulated === true;

  if (!provider && !allowSimulated) {
    return res.status(503).json({
      error:
        "Aucune passerelle de paiement en ligne n'est configurée. Activez PayTech ou PayDunya dans les réglages.",
    });
  }

  const ref = generateRefCommand();
  const effectiveProvider = provider ?? "simulated";

  /* 1) Création immédiate de la commande en status pending */
  const finalizeRes = await finalizeOrderFromPending(pendingPayload, {
    status: "pending",
    paymentStatus: "pending",
    paymentMethod: effectiveProvider,
    payment: {
      provider: effectiveProvider,
      ref,
      initiatedAt: new Date().toISOString(),
      status: "initiated",
    },
    sendConfirmation: false,
  });
  if (finalizeRes.error) {
    return res.status(409).json({ error: finalizeRes.error });
  }
  const order = finalizeRes.order;

  /* 2) Enregistrement du pending (ref → orderId) */
  savePending(ref, {
    ...pendingPayload,
    provider: effectiveProvider,
    orderId: order.id,
  });

  recordAudit("payment.initiated", {
    target: { type: "order", id: order.id },
    meta: { provider: effectiveProvider, ref },
    ip: req.ip,
  });

  /* 3) Mode simulé (dev) : confirmation immédiate */
  if (!provider && allowSimulated) {
    const confirmed = updateOrder(order.id, {
      status: "confirmed",
      paymentStatus: "paid",
      paymentMethod: "simulated",
      payment: { confirmedAt: new Date().toISOString(), source: "simulated" },
    });
    markProcessed(ref, order.id, { simulated: true });
    // Envoi des e-mails de confirmation
    Promise.allSettled([
      sendTemplate("order_confirmation", pendingPayload.customer.email, orderMailVars(confirmed, settings)),
      notifyAdmins("admin_new_order", orderMailVars(confirmed, settings)),
    ]).catch(() => {});
    recordAudit("payment.simulated", {
      target: { type: "order", id: order.id },
      ip: req.ip,
    });
    return res.json({ provider: "simulated", order: confirmed, ref });
  }

  /* 4) PayTech (popup) */
  if (provider === "paytech") {
    return res.json({
      provider: "paytech",
      ref,
      orderId: order.id,
      mode: "popup",
      ipnUrl: paytechConfig().ipnUrl,
      env: paytechConfig().env,
    });
  }

  /* 5) PayDunya (redirect) */
  if (provider === "paydunya") {
    if (Number(pendingPayload.totalXof) < (settings.checkout?.minOnlineAmount ?? PAYDUNYA_MIN_CHECKOUT_AMOUNT)) {
      return res.status(400).json({
        error: `Montant minimum pour PayDunya : ${
          settings.checkout?.minOnlineAmount ?? PAYDUNYA_MIN_CHECKOUT_AMOUNT
        } FCFA.`,
      });
    }
    const items = (pendingPayload.lines ?? []).map((l) => ({
      name: l.title ?? l.name ?? "Article",
      quantity: l.qty ?? 1,
      unit_price: l.priceXof ?? 0,
      total_price: (l.priceXof ?? 0) * (l.qty ?? 1),
      description: [l.variationLabel, l.size].filter(Boolean).join(" · "),
    }));
    const channel = PAYDUNYA_CHANNEL_MAP[pendingPayload.paymentMethod] ?? null;
    const invoice = await createPaydunyaInvoice({
      refCommand: ref,
      amountXof: pendingPayload.totalXof,
      items,
      customer: pendingPayload.customer,
      channel,
    });
    if (invoice.error) {
      appendIpnLog(ref, { event: "invoice.error", message: invoice.error });
      // Marque la commande comme échec d'initialisation paiement (pas annulation : l'admin décide)
      updateOrder(order.id, {
        payment: { lastError: invoice.error, lastErrorAt: new Date().toISOString() },
      });
      return res.status(502).json({ error: invoice.error });
    }
    appendIpnLog(ref, { event: "invoice.created", token: invoice.token });
    return res.json({
      provider: "paydunya",
      ref,
      orderId: order.id,
      mode: "redirect",
      redirectUrl: invoice.redirectUrl,
      token: invoice.token,
    });
  }

  return res.status(500).json({ error: "Provider inconnu." });
});

/* ─── PayTech : génération du token (Web SDK requestTokenUrl) ─── */
app.post("/api/store/checkout/paytech/token", storeLimiter, async (req, res) => {
  const { ref } = req.body ?? {};
  if (!ref) return res.status(400).json({ error: "ref manquant" });
  const pending = getPending(ref);
  if (!pending) return res.status(404).json({ error: "Pending introuvable ou expiré" });
  if (pending.isProcessed) {
    return res.status(409).json({ error: "Pending déjà traité", orderId: pending.orderId });
  }

  const token = await requestPaytechToken({
    refCommand: ref,
    amountXof: pending.totalXof,
    itemName: `Commande FANG ${ref}`,
    customerName: pending.customer?.name,
    customerEmail: pending.customer?.email,
    customerPhone: pending.customer?.phone,
    targetPayment: paytechTargetForMethod(pending.paymentMethod),
  });

  if (token.error) {
    appendIpnLog(ref, { event: "token.error", message: token.error });
    return res.status(502).json({ error: token.error });
  }
  appendIpnLog(ref, { event: "token.created", token: token.token });
  res.json({ token: token.token, redirectUrl: token.redirectUrl });
});

/* ─── PayTech : IPN serveur (sale_complete) ─── */
app.post("/api/store/checkout/paytech/ipn", express.urlencoded({ extended: true }), async (req, res) => {
  // PayTech envoie en application/x-www-form-urlencoded, fallback JSON
  const body = req.body && Object.keys(req.body).length ? req.body : {};
  const ref = body.ref_command;
  if (!ref) return res.status(400).json({ error: "ref_command manquant" });

  const pending = getPending(ref);
  if (!pending) {
    appendIpnLog(ref, { event: "ipn.no_pending" });
    return res.status(200).json({ ok: false, reason: "no_pending" });
  }

  const verif = verifyPaytechIpn(body);
  appendIpnLog(ref, { event: "ipn.received", type: body.type_event, verif });
  if (!verif.ok) {
    return res.status(401).json({ error: verif.reason || "Signature invalide" });
  }

  if (!paytechAmountMatches(pending.totalXof, body)) {
    appendIpnLog(ref, {
      event: "ipn.amount_mismatch",
      expected: pending.totalXof,
      received: body.item_price,
    });
    return res.status(400).json({ error: "Montant IPN incohérent" });
  }

  if (body.type_event !== "sale_complete") {
    return res.json({ ok: true, ignored: body.type_event });
  }

  if (!pending.orderId) {
    appendIpnLog(ref, { event: "ipn.no_order" });
    return res.status(404).json({ error: "Commande associée introuvable" });
  }

  // Idempotence : pending déjà traité ?
  if (pending.isProcessed) {
    return res.json({ ok: true, alreadyProcessed: true, orderId: pending.orderId });
  }

  const result = confirmPaidOrder(pending.orderId, {
    provider: "paytech",
    ref,
    gatewayMeta: { type_event: body.type_event, token: body.token, payment_method: body.payment_method },
  });
  if (result.error) {
    appendIpnLog(ref, { event: "ipn.confirm_error", error: result.error });
    return res.status(500).json({ error: result.error });
  }

  markProcessed(ref, pending.orderId, { provider: "paytech", token: body.token });
  recordAudit("payment.completed", {
    target: { type: "order", id: pending.orderId },
    meta: { provider: "paytech", ref },
    ip: req.ip,
  });
  appendIpnLog(ref, { event: "ipn.confirmed", orderId: pending.orderId });
  res.json({ ok: true, orderId: pending.orderId });
});

/* ─── PayTech : return acheteur (avec finalisation de secours si IPN lente) ─── */
app.get("/api/store/checkout/paytech/return", async (req, res) => {
  const ref = typeof req.query.ref === "string" ? req.query.ref : null;
  if (!ref) return res.redirect("/commande?paytech=error");
  const pending = getPending(ref);
  if (!pending) return res.redirect("/commande?paytech=expired");
  if (pending.isProcessed) {
    return res.redirect(`/compte/commandes/${pending.orderId}?paytech=ok`);
  }
  // L'IPN peut traîner ; on garde l'acheteur en attente sur la page checkout.
  res.redirect(`/commande?paytech=pending&ref=${encodeURIComponent(ref)}`);
});

app.get("/api/store/checkout/paytech/cancel", (req, res) => {
  const ref = typeof req.query.ref === "string" ? req.query.ref : null;
  if (ref) appendIpnLog(ref, { event: "cancel" });
  res.redirect("/commande?paytech=cancel");
});

/* ─── PayDunya : callback IPN ─── */
app.post("/api/store/checkout/paydunya/callback", async (req, res) => {
  const body = req.body ?? {};
  const ref =
    body?.custom_data?.ref_command ??
    body?.invoice?.custom_data?.ref_command ??
    body?.token ??
    null;

  if (!ref) {
    return res.status(400).json({ error: "ref_command manquant" });
  }

  const pending = getPending(ref);
  if (!pending) {
    appendIpnLog(ref, { event: "callback.no_pending" });
    return res.status(200).json({ ok: false, reason: "no_pending" });
  }

  const verif = verifyPaydunyaHash(body);
  appendIpnLog(ref, { event: "callback.received", status: body.status, verif });
  if (!verif.ok) {
    return res.status(401).json({ error: verif.reason || "Hash invalide" });
  }

  if (!paydunyaAmountMatches(pending.totalXof, body)) {
    appendIpnLog(ref, {
      event: "callback.amount_mismatch",
      expected: pending.totalXof,
      received: body?.invoice?.total_amount,
    });
    return res.status(400).json({ error: "Montant IPN incohérent" });
  }

  const status = String(body.status ?? "").toLowerCase();
  if (status !== "completed") {
    return res.json({ ok: true, ignored: status });
  }

  if (!pending.orderId) {
    appendIpnLog(ref, { event: "callback.no_order" });
    return res.status(404).json({ error: "Commande associée introuvable" });
  }

  if (pending.isProcessed) {
    return res.json({ ok: true, alreadyProcessed: true, orderId: pending.orderId });
  }

  const result = confirmPaidOrder(pending.orderId, {
    provider: "paydunya",
    ref,
    gatewayMeta: { status, token: body.token, customer: body.customer },
  });
  if (result.error) {
    appendIpnLog(ref, { event: "callback.confirm_error", error: result.error });
    return res.status(500).json({ error: result.error });
  }

  markProcessed(ref, pending.orderId, { provider: "paydunya", token: body.token });
  recordAudit("payment.completed", {
    target: { type: "order", id: pending.orderId },
    meta: { provider: "paydunya", ref },
    ip: req.ip,
  });
  appendIpnLog(ref, { event: "callback.confirmed", orderId: pending.orderId });
  res.json({ ok: true, orderId: pending.orderId });
});

/* ─── PayDunya : return acheteur + confirmation API de secours ─── */
app.get("/api/store/checkout/paydunya/return", async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : null;
  if (!token) return res.redirect("/commande?paydunya=error");

  // On essaie de retrouver le ref via les pending (champ token ajouté dans gatewayMeta)
  // mais à défaut, on confirme directement via l'API PayDunya.
  const confirm = await confirmPaydunyaInvoice(token);
  if (confirm.error) {
    return res.redirect(`/commande?paydunya=pending&token=${encodeURIComponent(token)}`);
  }

  const ref = confirm?.invoice?.custom_data?.ref_command ?? null;
  if (!ref) return res.redirect("/commande?paydunya=pending");

  const pending = getPending(ref);
  if (pending && pending.isProcessed) {
    return res.redirect(`/compte/commandes/${pending.orderId}?paydunya=ok`);
  }

  const statusStr = String(confirm.status ?? "").toLowerCase();
  if (statusStr === "completed" && pending?.orderId) {
    if (paydunyaAmountMatches(pending.totalXof, confirm)) {
      const result = confirmPaidOrder(pending.orderId, {
        provider: "paydunya",
        ref,
        gatewayMeta: { token, source: "return", confirm },
      });
      if (!result.error) {
        markProcessed(ref, pending.orderId, { provider: "paydunya", source: "return" });
        return res.redirect(`/compte/commandes/${pending.orderId}?paydunya=ok`);
      }
    }
  }
  res.redirect(`/commande?paydunya=pending&ref=${encodeURIComponent(ref)}`);
});

app.get("/api/store/checkout/paydunya/cancel", (req, res) => {
  res.redirect("/commande?paydunya=cancel");
});

/* ─── Status d'un pending (pour polling côté client) ─── */
app.get("/api/store/checkout/pending/:ref", (req, res) => {
  const pending = getPending(req.params.ref);
  if (!pending) return res.status(404).json({ error: "Pending introuvable ou expiré" });
  // Indicateur de paiement effectif (on regarde la commande)
  const order = pending.orderId ? getOrder(pending.orderId) : null;
  res.json({
    ref: pending.ref,
    provider: pending.provider,
    isProcessed: Boolean(pending.isProcessed),
    orderId: pending.orderId,
    totalXof: pending.totalXof,
    expiresAt: pending.expiresAt,
    paymentStatus: order?.paymentStatus ?? null,
    orderStatus: order?.status ?? null,
  });
});

app.post("/api/store/payments/intent", storeLimiter, (req, res) => {
  const { orderId, provider, amountXof, customer } = req.body ?? {};
  if (!orderId || !provider || !amountXof) {
    return res.status(400).json({ error: "Paramètres manquants (orderId, provider, amountXof)" });
  }
  const order = getOrder(orderId);
  if (!order) return res.status(404).json({ error: "Commande introuvable" });
  if (order.totalXof !== Number(amountXof)) {
    return res.status(400).json({ error: "Montant incohérent" });
  }
  const result = createPaymentIntent({ orderId, provider, amountXof: Number(amountXof), customer });
  if (result.error) return res.status(400).json(result);
  res.json({ intent: result.intent });
});

/* Webhook générique : POST /api/payments/webhook/:provider
   Signature HMAC SHA256 dans header X-Fang-Signature.
   Body JSON minimal : { intentId, status, meta? } */
app.post(
  "/api/payments/webhook/:provider",
  express.raw({ type: "application/json", limit: "1mb" }),
  (req, res) => {
    const provider = req.params.provider;
    const signature = req.header("x-fang-signature") ?? "";
    const rawBody = req.body instanceof Buffer ? req.body : Buffer.from(JSON.stringify(req.body ?? {}));
    if (!verifyWebhookSignature(provider, rawBody, signature)) {
      return res.status(401).json({ error: "Signature invalide" });
    }
    let payload;
    try {
      payload = JSON.parse(rawBody.toString("utf8"));
    } catch {
      return res.status(400).json({ error: "JSON invalide" });
    }
    const { intentId, status, meta } = payload ?? {};
    if (!intentId) return res.status(400).json({ error: "intentId requis" });

    const intent = getIntent(intentId);
    if (!intent) return res.status(404).json({ error: "Intent introuvable" });

    if (status === "paid" || status === "succeeded") {
      markIntentPaid(intentId, meta);
      // Marquer la commande comme payée
      updateOrder(intent.orderId, { paymentStatus: "paid", paymentMethod: provider });
      recordAudit("payment.paid", {
        target: { type: "order", id: intent.orderId },
        meta: { provider, intentId },
        ip: req.ip,
      });
    }

    res.json({ ok: true });
  }
);

/* ───────── Boutique publique ───────── */
app.get("/api/store/settings", (_req, res) => {
  res.json({ settings: getPublicSettings() });
});

/* ───────── CMS éditorial (lecture publique) ───────── */
app.get("/api/store/cms", (req, res) => {
  const previewToken = req.query.preview;
  if (typeof previewToken === "string" && isValidPreviewToken(previewToken)) {
    return res.json({ content: getCmsDraft(), mode: "draft" });
  }
  res.json({ content: getCmsPublished(), mode: "published" });
});

app.get("/api/store/products/:slug/reviews", (req, res) => {
  const reviews = listReviewsForProduct(req.params.slug, { onlyApproved: true }).map((r) => ({
    id: r.id,
    customerName: r.customerName,
    rating: r.rating,
    title: r.title,
    body: r.body,
    createdAt: r.createdAt,
  }));
  res.json({ reviews, summary: getProductRatingSummary(req.params.slug) });
});

app.post("/api/store/products/:slug/reviews", storeLimiter, (req, res) => {
  const customerToken =
    req.header("authorization")?.replace(/^Bearer\s+/i, "") ??
    req.header("x-customer-token") ??
    "";
  const customerAuth = validateCustomerSession(customerToken);
  const body = req.body ?? {};
  const result = createReview({
    productSlug: req.params.slug,
    customerId: customerAuth?.customer?.id ?? null,
    customerName: body.customerName ?? customerAuth?.customer?.name,
    rating: body.rating,
    title: body.title,
    body: body.body,
  });
  if (result.error) return res.status(400).json({ error: result.error });
  res.status(201).json({
    review: { id: result.review.id, status: result.review.status },
    message: "Avis envoyé. Il sera publié après modération.",
  });
});

app.get("/api/store/ratings", (_req, res) => {
  res.json({ ratings: getAllRatings() });
});

/* ─── Pages publiques (CGV, FAQ, etc.) ─── */
app.get("/api/store/pages", (_req, res) => {
  const settings = getSettings();
  const pages = listPages()
    .filter((p) => p.enabled !== false)
    .map((p) => ({
      ...p,
      // Interpoler quelques variables utiles (legalName, address...)
      intro: p.intro,
      body: String(p.body)
        .replace(/\{\{legalName\}\}/g, settings.brand.legalName ?? "")
        .replace(/\{\{address\}\}/g, settings.brand.address ?? "")
        .replace(/\{\{contactEmail\}\}/g, settings.contact.email ?? "")
        .replace(/\{\{contactPhone\}\}/g, settings.contact.phone ?? ""),
    }));
  res.json({ pages });
});

app.get("/api/store/pages/:slug", (req, res) => {
  const settings = getSettings();
  const page = getPage(req.params.slug);
  if (!page || page.enabled === false) {
    return res.status(404).json({ error: "Page introuvable." });
  }
  res.json({
    page: {
      ...page,
      body: String(page.body)
        .replace(/\{\{legalName\}\}/g, settings.brand.legalName ?? "")
        .replace(/\{\{address\}\}/g, settings.brand.address ?? "")
        .replace(/\{\{contactEmail\}\}/g, settings.contact.email ?? "")
        .replace(/\{\{contactPhone\}\}/g, settings.contact.phone ?? ""),
    },
  });
});

/* ─── Formulaire de contact ─── */
app.post("/api/store/contact", storeLimiter, async (req, res) => {
  const { name, email, phone, message } = req.body ?? {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Nom, e-mail et message requis." });
  }
  const settings = getSettings();
  const vars = {
    brand: settings.brand.name,
    contactName: String(name).slice(0, 100),
    contactEmail: String(email).slice(0, 150),
    contactPhone: String(phone ?? "").slice(0, 50),
    contactMessage: String(message).slice(0, 4000),
  };
  // Notifier les admins
  await notifyAdmins("contact_message", vars).catch(() => {});
  res.json({ ok: true, message: "Votre message a été envoyé. Nous vous répondrons sous 24-48h." });
});

/* ─── Newsletter (stub : on stocke les e-mails dans data/newsletter.json) ─── */
app.post("/api/store/newsletter/subscribe", storeLimiter, (req, res) => {
  const { email } = req.body ?? {};
  if (!email || !String(email).includes("@")) {
    return res.status(400).json({ error: "E-mail invalide" });
  }
  try {
    const file = path.resolve(process.cwd(), "data", "newsletter.json");
    let list = [];
    if (fs.existsSync(file)) {
      list = JSON.parse(fs.readFileSync(file, "utf8"));
    }
    const normalized = String(email).trim().toLowerCase();
    if (!list.includes(normalized)) {
      list.push(normalized);
      fs.writeFileSync(file, JSON.stringify(list, null, 2));
    }
  } catch (err) {
    console.warn("[newsletter] write error", err);
  }
  res.json({ ok: true });
});

app.get("/api/store/stock", (_req, res) => {
  // expose disponibilité simple : par produit/variation/taille
  const items = getAllStock();
  const flat = {};
  for (const [key, entry] of Object.entries(items)) {
    if (!entry?.trackInventory) continue;
    flat[key] = entry.variations ?? {};
  }
  res.json({ stock: flat });
});

app.get("/api/store/shipping/zones", (_req, res) => {
  const zones = listZones().map((z) => ({
    id: z.id,
    name: z.name,
    etaDays: z.etaDays,
    priceXof: z.priceXof,
    freeAboveXof: z.freeAboveXof,
    countries: z.countries,
  }));
  res.json({ zones });
});

app.post("/api/store/shipping/quote", storeLimiter, (req, res) => {
  const { zoneId, country, city, subtotalXof } = req.body ?? {};
  const quote = quoteShipping({
    zoneId,
    country,
    city,
    subtotalXof: Number(subtotalXof) || 0,
  });
  res.json(quote);
});

app.post("/api/store/promo/validate", storeLimiter, (req, res) => {
  const { code, subtotalXof } = req.body ?? {};
  if (!code || typeof subtotalXof !== "number") {
    return res.status(400).json({ error: "code et subtotalXof requis" });
  }
  const result = validatePromo(code, subtotalXof);
  if (!result.valid) return res.status(400).json(result);
  res.json(result);
});

app.post("/api/store/orders", storeLimiter, (req, res) => {
  const {
    customer,
    lines,
    subtotalXof,
    discountXof,
    totalXof,
    promoCode,
    notes,
    shippingZoneId,
    paymentMethod,
  } = req.body ?? {};
  if (!customer?.name || !customer?.email || !customer?.phone) {
    return res.status(400).json({ error: "Coordonnées client incomplètes." });
  }
  if (!Array.isArray(lines) || lines.length === 0) {
    return res.status(400).json({ error: "Panier vide." });
  }
  if (typeof subtotalXof !== "number" || typeof totalXof !== "number") {
    return res.status(400).json({ error: "Montants invalides." });
  }

  const settings = getSettings();
  let promoDiscount = 0;
  if (promoCode) {
    const check = validatePromo(promoCode, subtotalXof);
    if (!check.valid) return res.status(400).json({ error: check.error });
    if (check.discountXof !== (discountXof ?? 0)) {
      return res.status(400).json({ error: "Montant remise incohérent. Réessayez." });
    }
    promoDiscount = check.discountXof;
  }

  const shippingQuote = quoteShipping({
    zoneId: shippingZoneId,
    country: customer.country,
    city: customer.city,
    subtotalXof,
  });
  const shippingXof = shippingQuote.shippingXof;

  let taxXof = 0;
  if (settings.tax.enabled && !settings.tax.included) {
    const base = Math.max(0, subtotalXof - promoDiscount) + shippingXof;
    taxXof = Math.round(base * (Number(settings.tax.rate) / 100));
  }

  const expectedTotal = Math.max(0, subtotalXof - promoDiscount) + shippingXof + taxXof;
  if (Math.abs(expectedTotal - totalXof) > 1) {
    return res.status(400).json({
      error: `Total incohérent. Attendu ${expectedTotal}, reçu ${totalXof}.`,
    });
  }

  const validPaymentIds = settings.payments.methods.filter((m) => m.active).map((m) => m.id);
  const chosenPayment = validPaymentIds.includes(paymentMethod)
    ? paymentMethod
    : validPaymentIds[0] ?? "wave";

  /* Stock reservation (atomic per-write) */
  const stockLines = lines
    .filter((l) => l.productKey || l.productId)
    .map((l) => ({
      productKey: l.productKey ?? l.productId,
      variationId: l.variationId ?? "default",
      size: l.size,
      qty: Number(l.qty) || 1,
    }));
  const reservation = reserveStock(stockLines);
  if (!reservation.ok) {
    const detail = reservation.errors
      .map(
        (e) =>
          `${e.productKey} ${e.variationId}/${e.size} (demandé ${e.requested}, dispo ${e.available})`
      )
      .join("; ");
    return res
      .status(409)
      .json({ error: `Stock insuffisant : ${detail}`, stockErrors: reservation.errors });
  }

  if (promoCode) incrementPromoUsage(promoCode);

  const customerToken =
    req.header("authorization")?.replace(/^Bearer\s+/i, "") ??
    req.header("x-customer-token") ??
    "";
  const customerAuth = validateCustomerSession(customerToken);

  const order = createOrder({
    customerId: customerAuth?.customer?.id ?? null,
    customer,
    lines,
    subtotalXof,
    discountXof: promoDiscount,
    promoCode: promoCode ?? null,
    shippingXof,
    shippingZoneId: shippingQuote.zone?.id ?? null,
    shippingZoneName: shippingQuote.zone?.name ?? null,
    taxXof,
    taxRate: settings.tax.enabled ? settings.tax.rate : 0,
    taxIncluded: settings.tax.included,
    paymentMethod: chosenPayment,
    totalXof,
    notes,
  });

  // Notifications e-mail (non bloquantes)
  const mailVars = orderMailVars(order, settings);
  Promise.allSettled([
    sendTemplate("order_confirmation", customer.email, mailVars),
    notifyAdmins("admin_new_order", mailVars),
  ]).catch(() => {});

  res
    .status(201)
    .json({ order: { id: order.id, totalXof: order.totalXof, status: order.status } });
});

/**
 * Construit le panier "pending" : valide promo, stock, totaux, taxes.
 * Retourne { ok, pendingPayload } ou { error, status }.
 * NE crée PAS de commande. NE réserve PAS encore le stock — c'est fait à la finalisation.
 */
function buildPendingPayload(body, customerAuth) {
  const {
    customer,
    lines,
    subtotalXof,
    discountXof,
    totalXof,
    promoCode,
    notes,
    shippingZoneId,
    paymentMethod,
  } = body ?? {};

  if (!customer?.name || !customer?.email || !customer?.phone) {
    return { error: "Coordonnées client incomplètes.", status: 400 };
  }
  if (!Array.isArray(lines) || lines.length === 0) {
    return { error: "Panier vide.", status: 400 };
  }
  if (typeof subtotalXof !== "number" || typeof totalXof !== "number") {
    return { error: "Montants invalides.", status: 400 };
  }

  const settings = getSettings();
  let promoDiscount = 0;
  if (promoCode) {
    const check = validatePromo(promoCode, subtotalXof);
    if (!check.valid) return { error: check.error, status: 400 };
    if (check.discountXof !== (discountXof ?? 0)) {
      return { error: "Montant remise incohérent.", status: 400 };
    }
    promoDiscount = check.discountXof;
  }

  const shippingQuote = quoteShipping({
    zoneId: shippingZoneId,
    country: customer.country,
    city: customer.city,
    subtotalXof,
  });
  const shippingXof = shippingQuote.shippingXof;

  let taxXof = 0;
  if (settings.tax.enabled && !settings.tax.included) {
    const base = Math.max(0, subtotalXof - promoDiscount) + shippingXof;
    taxXof = Math.round(base * (Number(settings.tax.rate) / 100));
  }

  const expectedTotal = Math.max(0, subtotalXof - promoDiscount) + shippingXof + taxXof;
  if (Math.abs(expectedTotal - totalXof) > 1) {
    return {
      error: `Total incohérent. Attendu ${expectedTotal}, reçu ${totalXof}.`,
      status: 400,
    };
  }

  const validPaymentIds = settings.payments.methods.filter((m) => m.active).map((m) => m.id);
  const chosenPayment = validPaymentIds.includes(paymentMethod)
    ? paymentMethod
    : validPaymentIds[0] ?? "wave";

  return {
    ok: true,
    settings,
    pendingPayload: {
      customerId: customerAuth?.customer?.id ?? null,
      customer,
      lines,
      subtotalXof,
      discountXof: promoDiscount,
      promoCode: promoCode ?? null,
      shippingXof,
      shippingZoneId: shippingQuote.zone?.id ?? null,
      shippingZoneName: shippingQuote.zone?.name ?? null,
      taxXof,
      taxRate: settings.tax.enabled ? settings.tax.rate : 0,
      taxIncluded: settings.tax.included,
      paymentMethod: chosenPayment,
      totalXof,
      notes: notes ?? "",
    },
  };
}

/**
 * Réserve le stock, applique le promo, crée la commande.
 * Envoie les e-mails SAUF si sendConfirmation=false (utile pour les commandes
 * créées en attente de paiement online).
 */
async function finalizeOrderFromPending(
  payload,
  {
    paymentStatus = "paid",
    status = "confirmed",
    paymentMethod,
    payment,
    sendConfirmation = true,
  } = {}
) {
  const stockLines = (payload.lines ?? [])
    .filter((l) => l.productKey || l.productId)
    .map((l) => ({
      productKey: l.productKey ?? l.productId,
      variationId: l.variationId ?? "default",
      size: l.size,
      qty: Number(l.qty) || 1,
    }));
  const reservation = reserveStock(stockLines);
  if (!reservation.ok) {
    return { error: "Stock insuffisant.", reservation };
  }

  if (payload.promoCode) incrementPromoUsage(payload.promoCode);

  const settings = getSettings();
  const order = createOrder({
    ...payload,
    paymentMethod: paymentMethod ?? payload.paymentMethod,
    status,
    paymentStatus,
    payment,
  });

  if (sendConfirmation) {
    const mailVars = orderMailVars(order, settings);
    Promise.allSettled([
      payload.customer?.email
        ? sendTemplate("order_confirmation", payload.customer.email, mailVars)
        : Promise.resolve(),
      notifyAdmins("admin_new_order", mailVars),
    ]).catch(() => {});
  }

  return { order };
}

/**
 * Confirme une commande existante après un paiement en ligne réussi.
 * Idempotent : si la commande est déjà "paid", ne refait rien.
 * Envoie les e-mails de confirmation au passage.
 */
function confirmPaidOrder(orderId, { provider, ref, gatewayMeta }) {
  const before = getOrder(orderId);
  if (!before) return { error: "Commande introuvable." };
  if (before.paymentStatus === "paid") {
    return { order: before, alreadyPaid: true };
  }
  const settings = getSettings();
  const order = updateOrder(orderId, {
    status: "confirmed",
    paymentStatus: "paid",
    paymentMethod: provider,
    payment: {
      ...before.payment,
      provider,
      ref,
      confirmedAt: new Date().toISOString(),
      gatewayMeta,
    },
  });
  const mailVars = orderMailVars(order, settings);
  Promise.allSettled([
    order.customer?.email
      ? sendTemplate("order_confirmation", order.customer.email, mailVars)
      : Promise.resolve(),
    notifyAdmins("admin_new_order", mailVars),
  ]).catch(() => {});
  return { order };
}

/** Variables utilisées dans les templates e-mail liés aux commandes */
function orderMailVars(order, settings) {
  const fmt = (n) =>
    `${new Intl.NumberFormat(settings.currency.locale, { maximumFractionDigits: 0 }).format(n)} ${settings.currency.label}`;
  const lines = (order.lines ?? [])
    .map(
      (l) =>
        `• ${l.title} — ${l.variationLabel !== "Pièce" ? `${l.variationLabel}, ` : ""}taille ${l.size} × ${l.qty} — ${fmt(l.priceXof * l.qty)}`
    )
    .join("\n");
  const payment = settings.payments.methods.find((m) => m.id === order.paymentMethod);
  return {
    brand: settings.brand.name,
    contactEmail: settings.contact.email,
    leadTime: settings.production.leadTime,
    accountUrl: `/compte/commandes/${encodeURIComponent(order.id)}`,
    adminOrderUrl: `/admin/commandes`,
    orderId: order.id,
    orderSummary: lines,
    subtotal: fmt(order.subtotalXof),
    shipping: order.shippingXof ? fmt(order.shippingXof) : "Offerte",
    taxLine:
      order.taxXof && !order.taxIncluded
        ? `${settings.tax.label} : ${fmt(order.taxXof)}\n`
        : "",
    discountLine:
      order.discountXof > 0
        ? `Remise${order.promoCode ? ` (${order.promoCode})` : ""} : -${fmt(order.discountXof)}\n`
        : "",
    total: fmt(order.totalXof),
    paymentLabel: payment?.label ?? order.paymentMethod ?? "",
    paymentInstructions: payment?.instructions ?? "",
    customerName: order.customer?.name ?? "",
    customerEmail: order.customer?.email ?? "",
    customerPhone: order.customer?.phone ?? "",
    customerCity: order.customer?.city ?? "",
    customerCountry: order.customer?.country ?? "",
    statusLabel: order.status,
    statusBody: "",
  };
}

/* ───────── Compte client ───────── */
app.post("/api/store/auth/register", loginLimiter, (req, res) => {
  const result = registerCustomer(req.body ?? {});
  if (result.error) return res.status(400).json({ error: result.error });
  const { token, expiresAt } = createCustomerSession(result.customer.id);
  // Envoi e-mail de bienvenue (non bloquant)
  const settings = getSettings();
  sendTemplate("customer_welcome", result.customer.email, {
    brand: settings.brand.name,
    customerName: result.customer.name,
    accountUrl: "/compte",
  }).catch(() => {});
  res.status(201).json({ sessionToken: token, expiresAt, customer: result.customer });
});

app.post("/api/store/auth/login", loginLimiter, (req, res) => {
  const { email, password } = req.body ?? {};
  const customer = authenticateCustomer(email, password);
  if (!customer) return res.status(401).json({ error: "E-mail ou mot de passe incorrect." });
  const { token, expiresAt } = createCustomerSession(customer.id);
  res.json({ sessionToken: token, expiresAt, customer: toPublicCustomer(customer) });
});

app.post("/api/store/auth/forgot", loginLimiter, (req, res) => {
  const { email } = req.body ?? {};
  if (!email) return res.status(400).json({ error: "E-mail requis." });
  const customer = getCustomerByEmail(email);
  // Réponse identique pour ne pas révéler si l'e-mail existe
  if (customer) {
    const { token } = createResetToken({
      kind: "customer",
      userId: customer.id,
      email: customer.email,
    });
    const settings = getSettings();
    sendTemplate("password_reset", customer.email, {
      brand: settings.brand.name,
      customerName: customer.name,
      resetUrl: `/compte/reinitialiser?token=${token}`,
    }).catch(() => {});
  }
  res.json({ ok: true, message: "Si l'e-mail existe, un lien de réinitialisation a été envoyé." });
});

app.get("/api/store/auth/reset-info", (req, res) => {
  const token = String(req.query.token ?? "");
  const reset = peekResetToken(token);
  if (!reset || reset.kind !== "customer") {
    return res.status(400).json({ error: "Lien invalide ou expiré." });
  }
  res.json({ email: reset.email, expiresAt: reset.expiresAt });
});

app.post("/api/store/auth/reset", loginLimiter, (req, res) => {
  const { token, newPassword } = req.body ?? {};
  if (!token || !newPassword) {
    return res.status(400).json({ error: "Token et mot de passe requis." });
  }
  const reset = consumeResetToken(token);
  if (!reset || reset.kind !== "customer") {
    return res.status(400).json({ error: "Lien invalide ou expiré." });
  }
  const result = resetCustomerPassword(reset.userId, newPassword);
  if (!result.ok) return res.status(400).json({ error: result.error });
  res.json({ ok: true, message: "Mot de passe réinitialisé. Vous pouvez vous connecter." });
});

app.post("/api/store/auth/logout", (req, res) => {
  const token =
    req.header("authorization")?.replace(/^Bearer\s+/i, "") ??
    req.header("x-customer-token");
  if (token) revokeCustomerSession(token);
  res.json({ ok: true });
});

app.get("/api/store/auth/me", customerSessionMiddleware, (req, res) => {
  res.json({ customer: req.customer });
});

app.patch("/api/store/account/profile", customerSessionMiddleware, (req, res) => {
  const result = updateCustomerProfile(req.customer.id, req.body ?? {});
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result);
});

app.post("/api/store/account/change-password", customerSessionMiddleware, (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  const result = changeCustomerPassword(req.customer.id, currentPassword, newPassword);
  if (!result.ok) return res.status(400).json({ error: result.error });
  revokeCustomerSession(req.customerToken);
  res.json({ ok: true, message: "Mot de passe mis à jour. Reconnectez-vous." });
});

/* ─── Adresses client ─── */
app.get("/api/store/account/addresses", customerSessionMiddleware, (req, res) => {
  res.json({ addresses: listAddresses(req.customer.id) });
});

app.post("/api/store/account/addresses", customerSessionMiddleware, (req, res) => {
  const result = addAddress(req.customer.id, req.body ?? {});
  if (result.error) return res.status(400).json({ error: result.error });
  res.status(201).json(result);
});

app.patch("/api/store/account/addresses/:id", customerSessionMiddleware, (req, res) => {
  const result = updateAddress(req.customer.id, req.params.id, req.body ?? {});
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result);
});

app.delete("/api/store/account/addresses/:id", customerSessionMiddleware, (req, res) => {
  const result = deleteAddress(req.customer.id, req.params.id);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result);
});

/* ─── Wishlist client ─── */
app.get("/api/store/account/wishlist", customerSessionMiddleware, (req, res) => {
  res.json({ wishlist: listWishlist(req.customer.id) });
});

app.post("/api/store/account/wishlist/:slug", customerSessionMiddleware, (req, res) => {
  const list = addWishlist(req.customer.id, req.params.slug);
  res.status(201).json({ wishlist: list });
});

app.delete("/api/store/account/wishlist/:slug", customerSessionMiddleware, (req, res) => {
  const list = removeWishlist(req.customer.id, req.params.slug);
  res.json({ wishlist: list });
});

app.get("/api/store/account/summary", customerSessionMiddleware, (req, res) => {
  res.json({ summary: getCustomerOrderSummary(req.customer.id) });
});

app.get("/api/store/account/orders", customerSessionMiddleware, (req, res) => {
  res.json({ orders: listOrdersForCustomer(req.customer.id) });
});

app.get("/api/store/account/orders/:orderId", customerSessionMiddleware, (req, res) => {
  const order = getCustomerOrder(req.customer.id, req.params.orderId);
  if (!order) return res.status(404).json({ error: "Commande introuvable." });
  res.json({ order });
});

app.post("/api/store/orders/track", storeLimiter, (req, res) => {
  const { orderId, email } = req.body ?? {};
  if (!orderId || !email) return res.status(400).json({ error: "N° commande et e-mail requis." });
  const result = trackGuestOrder(String(orderId).trim(), email);
  if (result.error) return res.status(404).json({ error: result.error });
  res.json(result);
});

/* ───────── Auth admin ───────── */
app.get("/api/admin/ping", (_req, res) => res.json({ ok: true }));

app.post("/api/admin/login", loginLimiter, (req, res) => {
  const { email, password } = req.body ?? {};
  const user = authenticate(email, password);
  if (!user) {
    recordAudit("admin.login.failed", {
      ip: req.ip,
      meta: { email: email ?? null },
    });
    return res.status(401).json({ error: "Identifiants incorrects." });
  }
  const { token, expiresAt } = createSession(user.id);
  recordAudit("admin.login", {
    actor: user,
    ip: req.ip,
  });
  res.json({ sessionToken: token, expiresAt, user: toPublicUser(user) });
});

app.post("/api/admin/logout", (req, res) => {
  const token =
    req.header("authorization")?.replace(/^Bearer\s+/i, "") ??
    req.header("x-session-token");
  if (token) revokeSession(token);
  res.json({ ok: true });
});

app.post("/api/admin/forgot", loginLimiter, (req, res) => {
  const { email } = req.body ?? {};
  if (!email) return res.status(400).json({ error: "E-mail requis." });
  const user = getUserByEmail(email);
  if (user) {
    const { token } = createResetToken({
      kind: "admin",
      userId: user.id,
      email: user.email,
    });
    const settings = getSettings();
    sendTemplate("password_reset", user.email, {
      brand: settings.brand.name,
      customerName: user.name,
      resetUrl: `/admin/reinitialiser?token=${token}`,
    }).catch(() => {});
  }
  res.json({ ok: true, message: "Si l'e-mail existe, un lien a été envoyé." });
});

app.get("/api/admin/reset-info", (req, res) => {
  const token = String(req.query.token ?? "");
  const reset = peekResetToken(token);
  if (!reset || reset.kind !== "admin") {
    return res.status(400).json({ error: "Lien invalide ou expiré." });
  }
  res.json({ email: reset.email, expiresAt: reset.expiresAt });
});

app.post("/api/admin/reset", loginLimiter, (req, res) => {
  const { token, newPassword } = req.body ?? {};
  if (!token || !newPassword) {
    return res.status(400).json({ error: "Token et mot de passe requis." });
  }
  const reset = consumeResetToken(token);
  if (!reset || reset.kind !== "admin") {
    return res.status(400).json({ error: "Lien invalide ou expiré." });
  }
  const result = resetUserPassword(reset.userId, newPassword);
  if (!result.ok) return res.status(400).json({ error: result.error });
  res.json({ ok: true });
});

app.use(sessionMiddleware);

app.get("/api/admin/me", (req, res) => {
  res.json({ user: req.adminUser });
});

app.post("/api/admin/change-password", (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  const result = changeUserPassword(req.adminUser.id, currentPassword, newPassword);
  if (!result.ok) return res.status(400).json({ error: result.error });
  revokeSession(req.sessionToken);
  res.json({ ok: true, message: "Mot de passe mis à jour. Reconnectez-vous." });
});

/* ───────── Utilisateurs admin ───────── */
app.get("/api/admin/users", requireUserManagement, (_req, res) => {
  res.json({ users: listUsers(), roles: USER_ROLES });
});

app.post("/api/admin/users", requireUserManagement, (req, res) => {
  const result = createUser(req.body ?? {}, req.adminUser);
  if (result.error) return res.status(400).json({ error: result.error });
  res.status(201).json(result);
});

app.patch("/api/admin/users/:id", requireUserManagement, (req, res) => {
  const result = updateUser(req.params.id, req.body ?? {}, req.adminUser);
  if (result.error) {
    const code = result.error.includes("introuvable") ? 404 : 400;
    return res.status(code).json({ error: result.error });
  }
  if (req.body?.password !== undefined) revokeUserSessions(req.params.id);
  res.json(result);
});

app.delete("/api/admin/users/:id", requireUserManagement, (req, res) => {
  const result = deleteUser(req.params.id, req.adminUser);
  if (result.error) {
    const code = result.error.includes("introuvable") ? 404 : 400;
    return res.status(code).json({ error: result.error });
  }
  revokeUserSessions(req.params.id);
  recordAudit("user.delete", {
    actor: req.adminUser,
    target: { type: "user", id: req.params.id },
    ip: req.ip,
  });
  res.json(result);
});

app.get("/api/admin/customers", requireCommerce, (_req, res) => {
  res.json({ customers: listCustomers() });
});

/* ───────── Réglages boutique ───────── */
app.get("/api/admin/settings", (_req, res) => {
  res.json({ settings: getSettings() });
});

app.patch("/api/admin/settings", requireCommerce, (req, res) => {
  try {
    const next = updateSettings(req.body ?? {});
    recordAudit("settings.update", {
      actor: req.adminUser,
      meta: { keys: Object.keys(req.body ?? {}) },
      ip: req.ip,
    });
    res.json({ settings: next });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

/* ───────── Zones de livraison ───────── */
app.get("/api/admin/shipping/zones", requireCommerce, (_req, res) => {
  res.json({ zones: listZones({ includeInactive: true }) });
});

app.post("/api/admin/shipping/zones", requireCommerce, (req, res) => {
  const result = createZone(req.body ?? {});
  if (result.error) return res.status(400).json(result);
  res.status(201).json(result);
});

app.patch("/api/admin/shipping/zones/:id", requireCommerce, (req, res) => {
  const result = updateZone(req.params.id, req.body ?? {});
  if (!result) return res.status(404).json({ error: "Zone introuvable." });
  res.json(result);
});

app.delete("/api/admin/shipping/zones/:id", requireCommerce, (req, res) => {
  const ok = deleteZone(req.params.id);
  if (!ok) return res.status(404).json({ error: "Zone introuvable." });
  res.json({ ok: true });
});

/* ───────── E-mails (templates + test) ───────── */
app.get("/api/admin/mail/status", requireCommerce, async (_req, res) => {
  const status = await verifyMailer();
  res.json({ smtpConfigured: isSmtpConfigured(), ...status });
});

app.get("/api/admin/mail/templates", requireCommerce, (_req, res) => {
  res.json({ templates: getMailTemplates() });
});

app.patch("/api/admin/mail/templates/:id", requireCommerce, (req, res) => {
  const updated = updateMailTemplate(req.params.id, req.body ?? {});
  if (!updated) return res.status(404).json({ error: "Template introuvable" });
  res.json({ template: updated });
});

app.post("/api/admin/mail/test", requireCommerce, async (req, res) => {
  const { to } = req.body ?? {};
  if (!to) return res.status(400).json({ error: "Destinataire requis" });
  const result = await sendRaw({
    to,
    subject: "Test e-mail — FANG",
    text: "Cet e-mail confirme que la configuration SMTP fonctionne correctement.",
  });
  if (!result.ok) return res.status(500).json(result);
  res.json(result);
});

/* ───────── Avis produits (admin) ───────── */
app.get("/api/admin/reviews", requireCommerce, (req, res) => {
  res.json({ reviews: listAllReviews({ status: req.query.status }) });
});

app.patch("/api/admin/reviews/:id", requireCommerce, (req, res) => {
  const { status } = req.body ?? {};
  const result = moderateReview(req.params.id, status);
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

app.delete("/api/admin/reviews/:id", requireCommerce, (req, res) => {
  const ok = deleteReview(req.params.id);
  if (!ok) return res.status(404).json({ error: "Avis introuvable" });
  res.json({ ok: true });
});

/* ───────── Pages (CGV, RGPD, FAQ, etc.) ───────── */
app.get("/api/admin/pages", requireCommerce, (_req, res) => {
  res.json({ pages: listPages() });
});

app.get("/api/admin/pages/:slug", requireCommerce, (req, res) => {
  const page = getPage(req.params.slug);
  if (!page) return res.status(404).json({ error: "Page introuvable" });
  res.json({ page });
});

app.patch("/api/admin/pages/:slug", requireCommerce, (req, res) => {
  const result = updatePage(req.params.slug, req.body ?? {});
  if (result.error) return res.status(404).json(result);
  res.json(result);
});

/* ───────── Stock / inventaire ───────── */
app.get("/api/admin/stock", requireCommerce, (_req, res) => {
  res.json({ stock: getAllStock(), summary: getStockSummary() });
});

app.get("/api/admin/stock/:productKey", requireCommerce, (req, res) => {
  res.json({ stock: getStockForProduct(req.params.productKey) });
});

app.put("/api/admin/stock/:productKey", requireCommerce, (req, res) => {
  const item = setStock(req.params.productKey, req.body ?? null);
  res.json({ stock: item });
});

app.patch("/api/admin/stock/:productKey/:variationId/:size", requireCommerce, (req, res) => {
  const { qty } = req.body ?? {};
  const item = setStockQty(
    req.params.productKey,
    req.params.variationId,
    req.params.size,
    qty
  );
  res.json({ stock: item });
});

app.get("/api/admin/stats", requireCommerce, (_req, res) => {
  res.json({ orders: orderStats() });
});

/* ───────── Commandes admin ───────── */
app.get("/api/admin/orders", requireCommerce, (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  res.json(listOrders({ status }));
});

/* Export CSV — filtres période + statut */
function csvEscape(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes(";")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

app.get("/api/admin/orders.csv", requireCommerce, (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const from = typeof req.query.from === "string" ? new Date(req.query.from) : null;
  const to = typeof req.query.to === "string" ? new Date(req.query.to) : null;

  let { orders } = listOrders({ status });
  if (from && !Number.isNaN(from.valueOf())) {
    orders = orders.filter((o) => new Date(o.createdAt) >= from);
  }
  if (to && !Number.isNaN(to.valueOf())) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    orders = orders.filter((o) => new Date(o.createdAt) <= end);
  }

  const cols = [
    "id",
    "createdAt",
    "status",
    "paymentStatus",
    "customerName",
    "customerEmail",
    "customerPhone",
    "city",
    "country",
    "subtotalXof",
    "shippingXof",
    "taxXof",
    "discountXof",
    "totalXof",
    "promoCode",
    "paymentMethod",
    "itemsCount",
    "items",
  ];

  const rows = orders.map((o) => {
    const items = (o.lines || [])
      .map((l) => `${l.quantity ?? 1}× ${l.name ?? l.productName ?? l.slug} ${l.size ? `[${l.size}]` : ""}`.trim())
      .join(" | ");
    return [
      o.id,
      o.createdAt,
      o.status,
      o.paymentStatus ?? "",
      o.customer?.name ?? "",
      o.customer?.email ?? "",
      o.customer?.phone ?? "",
      o.customer?.city ?? "",
      o.customer?.country ?? "",
      o.subtotalXof ?? 0,
      o.shippingXof ?? 0,
      o.taxXof ?? 0,
      o.discountXof ?? 0,
      o.totalXof ?? 0,
      o.promoCode ?? "",
      o.paymentMethod ?? "",
      (o.lines || []).reduce((s, l) => s + (l.quantity ?? 1), 0),
      items,
    ].map(csvEscape).join(",");
  });

  const csv = [cols.join(","), ...rows].join("\n");
  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="fang-commandes-${stamp}.csv"`);
  res.send("\uFEFF" + csv);
});

/* Rapports : CA par mois, top produits, top clients */
app.get("/api/admin/reports", requireCommerce, (req, res) => {
  const months = Math.max(1, Math.min(24, Number(req.query.months) || 12));
  const { orders } = listOrders({});
  const validOrders = orders.filter((o) => o.status !== "cancelled");

  // CA par mois (n derniers)
  const now = new Date();
  const buckets = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.push({ key, label: d.toLocaleDateString("fr-FR", { month: "short", year: "numeric" }), revenue: 0, orders: 0 });
  }
  for (const o of validOrders) {
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const b = buckets.find((x) => x.key === key);
    if (b) {
      b.revenue += o.totalXof ?? 0;
      b.orders += 1;
    }
  }

  // Top produits
  const productMap = new Map();
  for (const o of validOrders) {
    for (const l of o.lines ?? []) {
      const key = l.slug ?? l.productSlug ?? l.name ?? "inconnu";
      const entry = productMap.get(key) ?? { slug: key, name: l.name ?? l.productName ?? key, quantity: 0, revenue: 0 };
      entry.quantity += l.quantity ?? 1;
      entry.revenue += (l.priceXof ?? 0) * (l.quantity ?? 1);
      productMap.set(key, entry);
    }
  }
  const topProducts = [...productMap.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 10);

  // Top clients
  const customerMap = new Map();
  for (const o of validOrders) {
    const key = o.customer?.email ?? o.customerId ?? o.customer?.name ?? "guest";
    const entry = customerMap.get(key) ?? {
      key,
      name: o.customer?.name ?? "—",
      email: o.customer?.email ?? "",
      orders: 0,
      revenue: 0,
    };
    entry.orders += 1;
    entry.revenue += o.totalXof ?? 0;
    customerMap.set(key, entry);
  }
  const topCustomers = [...customerMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  // Conversion approx : commandes confirmées / total
  const totalCount = orders.length;
  const confirmed = orders.filter((o) => ["confirmed", "in_production", "ready", "shipped", "delivered"].includes(o.status)).length;
  const conversion = totalCount > 0 ? Math.round((confirmed / totalCount) * 100) : 0;

  const totalRevenue = validOrders.reduce((s, o) => s + (o.totalXof ?? 0), 0);
  const avgOrder = validOrders.length ? Math.round(totalRevenue / validOrders.length) : 0;

  res.json({
    monthly: buckets,
    topProducts,
    topCustomers,
    summary: {
      totalRevenue,
      totalOrders: totalCount,
      validOrders: validOrders.length,
      conversion,
      avgOrder,
    },
  });
});

/* Facture HTML imprimable (admin + client) */
function escapeHtml(v) {
  return String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderInvoiceHtml(order, settings) {
  const fmt = (n) =>
    new Intl.NumberFormat(settings.currency?.locale ?? "fr-SN").format(n ?? 0) +
    " " +
    (settings.currency?.label ?? "FCFA");
  const date = new Date(order.createdAt).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const e = escapeHtml;
  const lines = (order.lines || [])
    .map((l) => {
      const name = l.name ?? l.productName ?? l.slug ?? "—";
      const variation = l.variationName ? ` — ${l.variationName}` : "";
      const size = l.size ? ` · taille ${l.size}` : "";
      const qty = l.quantity ?? 1;
      const unit = l.priceXof ?? 0;
      const total = unit * qty;
      return `<tr>
        <td>${e(name)}${e(variation)}${e(size)}</td>
        <td style="text-align:center">${e(qty)}</td>
        <td style="text-align:right">${e(fmt(unit))}</td>
        <td style="text-align:right">${e(fmt(total))}</td>
      </tr>`;
    })
    .join("");

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Facture ${e(order.id)} — ${e(settings.brand?.name ?? "FANG")}</title>
<style>
* { box-sizing: border-box; }
body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 32px; color: #1a1a1a; background: #fff; max-width: 800px; margin: 0 auto; font-size: 14px; }
h1 { font-size: 28px; margin: 0 0 4px; letter-spacing: -0.01em; }
.muted { color: #777; }
.row { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 24px; }
.box { flex: 1; }
.box h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #555; margin: 0 0 6px; }
table { width: 100%; border-collapse: collapse; margin-top: 8px; }
th, td { padding: 10px 8px; border-bottom: 1px solid #eee; }
th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #666; }
.totals { margin-top: 16px; margin-left: auto; width: 280px; }
.totals .line { display: flex; justify-content: space-between; padding: 4px 0; }
.totals .grand { border-top: 2px solid #1a1a1a; padding-top: 8px; margin-top: 8px; font-weight: bold; font-size: 16px; }
.print-btn { position: fixed; top: 16px; right: 16px; padding: 10px 16px; background: #1a1a1a; color: #fff; border: none; cursor: pointer; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; }
.footer-note { margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #777; }
@media print { .print-btn { display: none; } body { padding: 0; } }
</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">Imprimer / Enregistrer PDF</button>

<header style="margin-bottom:32px">
  <h1>${e(settings.brand?.name ?? "FANG")}</h1>
  <p class="muted">${e(settings.brand?.legalName ?? "")}<br>${e(settings.brand?.address ?? "")}</p>
  <p class="muted">${e(settings.contact?.email ?? "")} · ${e(settings.contact?.phone ?? "")}</p>
</header>

<div class="row">
  <div class="box">
    <h3>Facturé à</h3>
    <p style="margin:0">
      <strong>${e(order.customer?.name ?? "—")}</strong><br>
      ${e(order.customer?.email ?? "")}<br>
      ${e(order.customer?.phone ?? "")}<br>
      ${e(order.customer?.city ?? "")}, ${e(order.customer?.country ?? "")}
    </p>
  </div>
  <div class="box" style="text-align:right">
    <h3>Facture</h3>
    <p style="margin:0">
      N° <strong>${e(order.id)}</strong><br>
      Date : ${e(date)}<br>
      Statut : ${e(order.status ?? "—")}<br>
      Paiement : ${e(order.paymentStatus ?? "—")}
    </p>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th>Article</th>
      <th style="text-align:center;width:60px">Qté</th>
      <th style="text-align:right;width:120px">P.U.</th>
      <th style="text-align:right;width:140px">Total</th>
    </tr>
  </thead>
  <tbody>${lines}</tbody>
</table>

<div class="totals">
  <div class="line"><span>Sous-total</span><span>${fmt(order.subtotalXof)}</span></div>
  ${order.shippingXof ? `<div class="line"><span>Livraison</span><span>${fmt(order.shippingXof)}</span></div>` : ""}
  ${order.taxXof ? `<div class="line"><span>TVA</span><span>${fmt(order.taxXof)}</span></div>` : ""}
  ${order.discountXof ? `<div class="line"><span>Remise ${order.promoCode ? `(${e(order.promoCode)})` : ""}</span><span>− ${fmt(order.discountXof)}</span></div>` : ""}
  <div class="line grand"><span>Total</span><span>${fmt(order.totalXof)}</span></div>
</div>

<div class="footer-note">
  Merci pour votre commande. Pour toute question : ${e(settings.contact?.email ?? "")}.
  ${settings.brand?.legalName ? `<br>${e(settings.brand.legalName)} — ${e(settings.brand?.address ?? "")}` : ""}
</div>
</body>
</html>`;
}

app.get("/api/admin/orders/:orderId/invoice.html", requireCommerce, (req, res) => {
  const order = getOrder(req.params.orderId);
  if (!order) return res.status(404).send("Commande introuvable");
  res.type("html").send(renderInvoiceHtml(order, getSettings()));
});

/* Facture côté client : session client OU guestTrackingToken */
app.get("/api/store/orders/:orderId/invoice.html", (req, res) => {
  const order = getOrder(req.params.orderId);
  if (!order) return res.status(404).send("Commande introuvable");

  const guestToken = typeof req.query.token === "string" ? req.query.token : null;
  if (guestToken && order.guestTrackingToken === guestToken) {
    return res.type("html").send(renderInvoiceHtml(order, getSettings()));
  }

  const headerToken =
    req.header("authorization")?.replace(/^Bearer\s+/i, "") ??
    req.header("x-customer-token") ??
    (typeof req.query.session === "string" ? req.query.session : "");
  if (headerToken) {
    try {
      const auth = validateCustomerSession(headerToken);
      if (auth && order.customerId === auth.customer.id) {
        return res.type("html").send(renderInvoiceHtml(order, getSettings()));
      }
    } catch {
      /* ignore */
    }
  }

  return res.status(403).send("Accès refusé");
});

app.get("/api/admin/orders/:orderId", requireCommerce, (req, res) => {
  const order = getOrder(req.params.orderId);
  if (!order) return res.status(404).json({ error: "Commande introuvable" });
  res.json({ order });
});

app.patch("/api/admin/orders/:orderId", requireCommerce, (req, res) => {
  const before = getOrder(req.params.orderId);
  const order = updateOrder(req.params.orderId, req.body ?? {});
  if (!order) return res.status(404).json({ error: "Commande introuvable" });
  recordAudit("order.update", {
    actor: req.adminUser,
    target: { type: "order", id: order.id },
    meta: {
      before: { status: before?.status, paymentStatus: before?.paymentStatus },
      after: { status: order.status, paymentStatus: order.paymentStatus },
      patch: Object.keys(req.body ?? {}),
    },
    ip: req.ip,
  });
  // Notifier le client si le statut change
  if (before && req.body?.status && before.status !== order.status && order.customer?.email) {
    const settings = getSettings();
    const vars = orderMailVars(order, settings);
    const statusLabels = {
      pending: "En attente",
      confirmed: "Confirmée",
      in_production: "En production",
      ready: "Prête à expédier",
      shipped: "Expédiée",
      delivered: "Livrée",
      cancelled: "Annulée",
    };
    vars.statusLabel = statusLabels[order.status] ?? order.status;
    sendTemplate("order_status_change", order.customer.email, vars).catch(() => {});
  }
  res.json({ order });
});

/* ───────── Codes promo admin ───────── */
app.get("/api/admin/promos", requireCommerce, (_req, res) => {
  res.json({ promos: listPromos() });
});

app.post("/api/admin/promos", requireCommerce, (req, res) => {
  const result = createPromo(req.body ?? {});
  if (result.error) return res.status(400).json({ error: result.error });
  res.status(201).json(result);
});

app.patch("/api/admin/promos/:id", requireCommerce, (req, res) => {
  const result = updatePromo(req.params.id, req.body ?? {});
  if (!result) return res.status(404).json({ error: "Code introuvable" });
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result);
});

app.delete("/api/admin/promos/:id", requireCommerce, (req, res) => {
  if (!deletePromo(req.params.id)) return res.status(404).json({ error: "Code introuvable" });
  recordAudit("promo.delete", {
    actor: req.adminUser,
    target: { type: "promo", id: req.params.id },
    ip: req.ip,
  });
  res.json({ ok: true });
});

/* ───────── Notifications admin (polling) ───────── */
app.get("/api/admin/notifications", requireCommerce, (req, res) => {
  const sinceParam = typeof req.query.since === "string" ? req.query.since : null;
  const since = sinceParam ? new Date(sinceParam) : null;
  const { orders } = listOrders({});
  const stats = orderStats();

  const newOrders = orders.filter((o) => {
    if (!since || Number.isNaN(since.valueOf())) return false;
    return new Date(o.createdAt) > since;
  });

  res.json({
    pending: orders.filter((o) => o.status === "pending").length,
    confirmedToday: orders.filter((o) => {
      const d = new Date(o.createdAt);
      const today = new Date();
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      );
    }).length,
    newSinceLast: newOrders.length,
    newOrders: newOrders.slice(0, 5).map((o) => ({
      id: o.id,
      total: o.totalXof,
      customerName: o.customer?.name ?? "—",
      createdAt: o.createdAt,
    })),
    revenue: stats?.revenue ?? null,
    lastCheck: new Date().toISOString(),
  });
});

/* ───────── Backups ───────── */
app.get("/api/admin/backups", requireUserManagement, (_req, res) => {
  res.json({ backups: listBackups() });
});

app.post("/api/admin/backups", requireUserManagement, async (req, res) => {
  try {
    const file = await createBackup();
    recordAudit("backup.create", {
      actor: req.adminUser,
      meta: { file: path.basename(file) },
      ip: req.ip,
    });
    res.json({ ok: true, file: path.basename(file) });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur backup" });
  }
});

app.post("/api/admin/backups/:name/restore", requireUserManagement, async (req, res) => {
  try {
    const result = await restoreBackup(req.params.name);
    recordAudit("backup.restore", {
      actor: req.adminUser,
      meta: { file: req.params.name, files: result.restoredFiles.length },
      ip: req.ip,
    });
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur restore" });
  }
});

/* ───────── Journal d'audit ───────── */
app.get("/api/admin/audit", requireCommerce, (req, res) => {
  const limit = Math.max(1, Math.min(500, Number(req.query.limit) || 200));
  const offset = Math.max(0, Number(req.query.offset) || 0);
  const action = typeof req.query.action === "string" ? req.query.action : undefined;
  const actorId = typeof req.query.actorId === "string" ? req.query.actorId : undefined;
  res.json(listAudit({ limit, offset, action, actorId }));
});

app.get("/api/admin/meta", (_req, res) => {
  res.json({ orderStatuses: ORDER_STATUSES, paymentStatuses: PAYMENT_STATUSES });
});

ensureFile(PRODUCTS_OVERRIDES_FILE, {});
ensureFile(SITE_OVERRIDES_FILE, { chapters: {}, copy: {} });
fs.mkdirSync(LIBRARY_ROOT, { recursive: true });

/* ────────────────────── Médiathèque : helpers ────────────────────── */

function hashFile(abs) {
  const hash = crypto.createHash("md5");
  const data = fs.readFileSync(abs);
  hash.update(data);
  return hash.digest("hex");
}

function publicPathFromAbs(abs) {
  return path.relative(PUBLIC_ROOT, abs).replace(/\\/g, "/");
}

function absFromPublicPath(rel) {
  const clean = rel.replace(/^\/+/, "");
  return path.join(PUBLIC_ROOT, clean);
}

function walkImages(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkImages(full, out);
    else if (IMG_RE.test(entry.name)) out.push(full);
  }
  return out;
}

function buildUsageMap() {
  const catalog = readJson(CATALOG_FILE, { season: {}, chapters: [] });
  const usage = new Map();
  for (const ch of catalog.chapters) {
    for (const character of ch.characters) {
      for (const img of character.images) {
        const key = img.replace(/^\/+/, "");
        if (!usage.has(key)) usage.set(key, []);
        usage.get(key).push({
          chapterId: ch.id,
          chapterName: ch.name,
          characterSlug: character.slug,
          characterName: character.name,
        });
      }
    }
  }
  return usage;
}

function collectMediaItems() {
  const roots = [MEDIA_ROOT, LIBRARY_ROOT];
  const files = roots.flatMap((r) => walkImages(r));
  const usage = buildUsageMap();
  const items = files.map((abs) => {
    const stat = fs.statSync(abs);
    const rel = publicPathFromAbs(abs);
    let hash = "";
    try {
      hash = hashFile(abs);
    } catch {
      hash = "";
    }
    return {
      path: rel,
      url: `/${rel}`,
      filename: path.basename(abs),
      size: stat.size,
      modified: stat.mtimeMs,
      hash,
      usedBy: usage.get(rel) ?? [],
    };
  });
  const byHash = new Map();
  for (const item of items) {
    if (!item.hash) continue;
    if (!byHash.has(item.hash)) byHash.set(item.hash, []);
    byHash.get(item.hash).push(item.path);
  }
  for (const item of items) {
    const dupes = byHash.get(item.hash) ?? [];
    item.duplicates = dupes.filter((p) => p !== item.path);
  }
  items.sort((a, b) => b.modified - a.modified);
  return items;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function publicRel(chapterId, characterSlug, file) {
  return `collection/s01/${chapterId}/personnages/${characterSlug}/${file}`;
}

function charDir(chapterId, characterSlug) {
  return path.join(MEDIA_ROOT, chapterId, "personnages", characterSlug);
}

function listImages(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => IMG_RE.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

function resizeImage(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  try {
    execSync(`sips -Z 1600 "${src}" --out "${dest}"`, { stdio: "pipe" });
  } catch {
    fs.copyFileSync(src, dest);
  }
}

function rebuildCharacterFromDisk(chapterId, characterSlug, characterMeta) {
  const dir = charDir(chapterId, characterSlug);
  const files = listImages(dir);
  const images = files.map((f) => publicRel(chapterId, characterSlug, f));
  const coverOverride =
    characterMeta?.coverImage && fs.existsSync(absFromPublicPath(characterMeta.coverImage))
      ? characterMeta.coverImage
      : undefined;
  return {
    id: `${chapterId}-${characterSlug}`,
    slug: characterSlug,
    name: characterMeta?.name ?? characterSlug,
    sourceFolder: characterMeta?.sourceFolder ?? characterSlug,
    coverImage: coverOverride,
    cover: coverOverride ?? (files[0] ? publicRel(chapterId, characterSlug, files[0]) : ""),
    images,
    productCount: files.length,
  };
}

function saveCatalog(catalog) {
  writeJson(CATALOG_FILE, catalog);
}

app.get("/api/admin/catalog", (_req, res) => {
  res.json({
    catalog: readJson(CATALOG_FILE, { season: {}, chapters: [] }),
    productsOverrides: readJson(PRODUCTS_OVERRIDES_FILE, {}),
    siteOverrides: readJson(SITE_OVERRIDES_FILE, { chapters: {}, copy: {} }),
  });
});

/* ────────────────────────────── Chapitres ────────────────────────────── */

app.patch("/api/admin/chapters/:chapterId", (req, res) => {
  const catalog = readJson(CATALOG_FILE, { season: {}, chapters: [] });
  const chapter = catalog.chapters.find((c) => c.id === req.params.chapterId);
  if (!chapter) return res.status(404).json({ error: "Chapitre introuvable" });
  const { name, sourceFolder, index } = req.body ?? {};
  if (name !== undefined) chapter.name = name;
  if (sourceFolder !== undefined) chapter.sourceFolder = sourceFolder;
  if (index !== undefined) chapter.index = index;
  saveCatalog(catalog);
  res.json({ chapter });
});

app.post("/api/admin/chapters/reorder", (req, res) => {
  const catalog = readJson(CATALOG_FILE, { season: {}, chapters: [] });
  const order = req.body?.order;
  if (!Array.isArray(order)) return res.status(400).json({ error: "order requis" });
  catalog.chapters.sort((a, b) => {
    const ai = order.indexOf(a.id);
    const bi = order.indexOf(b.id);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
  catalog.chapters.forEach((c, i) => {
    c.order = i + 1;
    c.index = String(i + 1).padStart(2, "0");
  });
  saveCatalog(catalog);
  res.json({ chapters: catalog.chapters });
});

app.post("/api/admin/chapters", (req, res) => {
  const catalog = readJson(CATALOG_FILE, { season: {}, chapters: [] });
  const { name, sourceFolder } = req.body ?? {};
  if (!name) return res.status(400).json({ error: "name requis" });
  const slug = slugify(name);
  if (catalog.chapters.some((c) => c.id === slug)) {
    return res.status(409).json({ error: "Chapitre déjà existant" });
  }
  const order = catalog.chapters.length + 1;
  const next = {
    order,
    id: slug,
    slug,
    index: String(order).padStart(2, "0"),
    name,
    sourceFolder: sourceFolder ?? name,
    characters: [],
  };
  catalog.chapters.push(next);
  saveCatalog(catalog);
  res.json({ chapter: next });
});

app.delete("/api/admin/chapters/:chapterId", (req, res) => {
  const catalog = readJson(CATALOG_FILE, { season: {}, chapters: [] });
  const idx = catalog.chapters.findIndex((c) => c.id === req.params.chapterId);
  if (idx === -1) return res.status(404).json({ error: "Chapitre introuvable" });
  const [removed] = catalog.chapters.splice(idx, 1);
  catalog.chapters.forEach((c, i) => {
    c.order = i + 1;
    c.index = String(i + 1).padStart(2, "0");
  });
  saveCatalog(catalog);
  const chapterMediaDir = path.join(MEDIA_ROOT, removed.id);
  if (fs.existsSync(chapterMediaDir)) {
    fs.rmSync(chapterMediaDir, { recursive: true, force: true });
  }
  res.json({ ok: true });
});

/* ─────────────── Lore + palette (siteOverrides) ─────────────── */

app.patch("/api/admin/chapters/:chapterId/lore", (req, res) => {
  const site = readJson(SITE_OVERRIDES_FILE, { chapters: {}, copy: {} });
  const id = req.params.chapterId;
  const body = req.body ?? {};
  for (const key of ["coverImage", "posterImage"]) {
    const rel = body[key];
    if (rel && !fs.existsSync(absFromPublicPath(rel))) {
      return res.status(400).json({ error: `Image introuvable : ${rel}` });
    }
  }
  site.chapters = site.chapters || {};
  site.chapters[id] = { ...(site.chapters[id] ?? {}), ...body };
  writeJson(SITE_OVERRIDES_FILE, site);
  res.json({ chapter: site.chapters[id] });
});

/* ────────────────────────────── Personnages ────────────────────────────── */

app.post("/api/admin/chapters/:chapterId/personnages", (req, res) => {
  const catalog = readJson(CATALOG_FILE, { season: {}, chapters: [] });
  const chapter = catalog.chapters.find((c) => c.id === req.params.chapterId);
  if (!chapter) return res.status(404).json({ error: "Chapitre introuvable" });
  const { name } = req.body ?? {};
  if (!name) return res.status(400).json({ error: "name requis" });
  const slug = slugify(name);
  if (chapter.characters.some((c) => c.slug === slug)) {
    return res.status(409).json({ error: "Personnage déjà existant" });
  }
  const created = {
    id: `${chapter.id}-${slug}`,
    slug,
    name,
    sourceFolder: name,
    cover: "",
    images: [],
    productCount: 0,
  };
  chapter.characters.push(created);
  saveCatalog(catalog);
  fs.mkdirSync(charDir(chapter.id, slug), { recursive: true });
  res.json({ character: created });
});

app.patch("/api/admin/chapters/:chapterId/personnages/:characterSlug", (req, res) => {
  const catalog = readJson(CATALOG_FILE, { season: {}, chapters: [] });
  const chapter = catalog.chapters.find((c) => c.id === req.params.chapterId);
  if (!chapter) return res.status(404).json({ error: "Chapitre introuvable" });
  const character = chapter.characters.find((c) => c.slug === req.params.characterSlug);
  if (!character) return res.status(404).json({ error: "Personnage introuvable" });
  const { name, sourceFolder, coverImage } = req.body ?? {};
  if (name !== undefined) character.name = name;
  if (sourceFolder !== undefined) character.sourceFolder = sourceFolder;
  if (coverImage !== undefined) {
    character.coverImage = coverImage || undefined;
    if (coverImage) character.cover = coverImage;
    else if (character.images.length > 0) character.cover = character.images[0];
  }
  saveCatalog(catalog);
  res.json({ character });
});

app.delete("/api/admin/chapters/:chapterId/personnages/:characterSlug", (req, res) => {
  const catalog = readJson(CATALOG_FILE, { season: {}, chapters: [] });
  const chapter = catalog.chapters.find((c) => c.id === req.params.chapterId);
  if (!chapter) return res.status(404).json({ error: "Chapitre introuvable" });
  const before = chapter.characters.length;
  chapter.characters = chapter.characters.filter((c) => c.slug !== req.params.characterSlug);
  if (chapter.characters.length === before) {
    return res.status(404).json({ error: "Personnage introuvable" });
  }
  saveCatalog(catalog);
  const dir = charDir(chapter.id, req.params.characterSlug);
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });

  const overrides = readJson(PRODUCTS_OVERRIDES_FILE, {});
  const prefix = `${chapter.id}/${req.params.characterSlug}`;
  for (const key of Object.keys(overrides)) {
    if (key === prefix || key.startsWith(`${prefix}/`)) delete overrides[key];
  }
  writeJson(PRODUCTS_OVERRIDES_FILE, overrides);

  res.json({ ok: true });
});

app.post("/api/admin/chapters/:chapterId/personnages/reorder", (req, res) => {
  const catalog = readJson(CATALOG_FILE, { season: {}, chapters: [] });
  const chapter = catalog.chapters.find((c) => c.id === req.params.chapterId);
  if (!chapter) return res.status(404).json({ error: "Chapitre introuvable" });
  const order = req.body?.order;
  if (!Array.isArray(order)) return res.status(400).json({ error: "order requis" });
  chapter.characters.sort((a, b) => {
    const ai = order.indexOf(a.slug);
    const bi = order.indexOf(b.slug);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
  saveCatalog(catalog);
  res.json({ characters: chapter.characters });
});

/* ────────────────────────────── Images ────────────────────────────── */

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      const dir = charDir(req.params.chapterId, req.params.characterSlug);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
      const base = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}${ext}`;
      cb(null, base);
    },
  }),
  limits: { fileSize: 12 * 1024 * 1024 },
});

app.post(
  "/api/admin/chapters/:chapterId/personnages/:characterSlug/images",
  upload.array("files", 24),
  (req, res) => {
    const catalog = readJson(CATALOG_FILE, { season: {}, chapters: [] });
    const chapter = catalog.chapters.find((c) => c.id === req.params.chapterId);
    const character = chapter?.characters.find((c) => c.slug === req.params.characterSlug);
    if (!chapter || !character) {
      return res.status(404).json({ error: "Personnage introuvable" });
    }
    const dir = charDir(chapter.id, character.slug);

    const existingHashes = new Set();
    for (const f of listImages(dir)) {
      const abs = path.join(dir, f);
      try {
        if (!(req.files ?? []).some((u) => path.join(dir, u.filename) === abs)) {
          existingHashes.add(hashFile(abs));
        }
      } catch {
        /* ignore */
      }
    }

    const uploaded = [];
    const skippedDuplicates = [];
    for (const file of req.files ?? []) {
      const target = path.join(dir, file.filename);
      try {
        resizeImage(target, target);
      } catch {
        /* ignore */
      }
      try {
        const h = hashFile(target);
        if (existingHashes.has(h)) {
          fs.unlinkSync(target);
          skippedDuplicates.push(file.originalname);
        } else {
          existingHashes.add(h);
          uploaded.push(file.filename);
        }
      } catch {
        uploaded.push(file.filename);
      }
    }

    const updated = rebuildCharacterFromDisk(chapter.id, character.slug, character);
    Object.assign(character, updated);
    saveCatalog(catalog);
    res.json({ character: updated, uploaded, skippedDuplicates });
  }
);

app.delete(
  "/api/admin/chapters/:chapterId/personnages/:characterSlug/images/:filename",
  (req, res) => {
    const catalog = readJson(CATALOG_FILE, { season: {}, chapters: [] });
    const chapter = catalog.chapters.find((c) => c.id === req.params.chapterId);
    const character = chapter?.characters.find((c) => c.slug === req.params.characterSlug);
    if (!chapter || !character) {
      return res.status(404).json({ error: "Personnage introuvable" });
    }
    const file = path.basename(req.params.filename);
    const target = path.join(charDir(chapter.id, character.slug), file);
    if (fs.existsSync(target)) fs.unlinkSync(target);
    const updated = rebuildCharacterFromDisk(chapter.id, character.slug, character);
    Object.assign(character, updated);
    saveCatalog(catalog);
    res.json({ character: updated });
  }
);

app.post(
  "/api/admin/chapters/:chapterId/personnages/:characterSlug/images/reorder",
  (req, res) => {
    const catalog = readJson(CATALOG_FILE, { season: {}, chapters: [] });
    const chapter = catalog.chapters.find((c) => c.id === req.params.chapterId);
    const character = chapter?.characters.find((c) => c.slug === req.params.characterSlug);
    if (!chapter || !character) {
      return res.status(404).json({ error: "Personnage introuvable" });
    }
    const order = req.body?.order;
    if (!Array.isArray(order)) return res.status(400).json({ error: "order requis" });

    const dir = charDir(chapter.id, character.slug);
    const tempPrefix = `__tmp-${Date.now()}-`;
    const existing = listImages(dir);
    const ordered = order
      .map((f) => path.basename(f))
      .filter((f) => existing.includes(f));
    const remaining = existing.filter((f) => !ordered.includes(f));
    const finalOrder = [...ordered, ...remaining];

    finalOrder.forEach((name) => {
      fs.renameSync(path.join(dir, name), path.join(dir, tempPrefix + name));
    });
    finalOrder.forEach((name, i) => {
      const ext = path.extname(name).toLowerCase() || ".jpg";
      const target =
        i === 0 ? `cover${ext}` : `produit-${String(i).padStart(2, "0")}${ext}`;
      const src = path.join(dir, tempPrefix + name);
      const dest = path.join(dir, target);
      if (fs.existsSync(dest) && dest !== src) fs.unlinkSync(dest);
      fs.renameSync(src, dest);
    });

    const updated = rebuildCharacterFromDisk(chapter.id, character.slug, character);
    Object.assign(character, updated);
    saveCatalog(catalog);
    res.json({ character: updated });
  }
);

/* ────────────────────────────── Produits ────────────────────────────── */

app.put(
  "/api/admin/chapters/:chapterId/personnages/:characterSlug/product",
  (req, res) => {
    const overrides = readJson(PRODUCTS_OVERRIDES_FILE, {});
    const key = `${req.params.chapterId}/${req.params.characterSlug}`;
    overrides[key] = { ...(overrides[key] ?? {}), ...req.body };
    writeJson(PRODUCTS_OVERRIDES_FILE, overrides);
    res.json({ override: overrides[key] });
  }
);

app.put(
  "/api/admin/chapters/:chapterId/personnages/:characterSlug/pieces/:pieceId/product",
  (req, res) => {
    const overrides = readJson(PRODUCTS_OVERRIDES_FILE, {});
    const key = `${req.params.chapterId}/${req.params.characterSlug}/${req.params.pieceId}`;
    overrides[key] = { ...(overrides[key] ?? {}), ...req.body };
    writeJson(PRODUCTS_OVERRIDES_FILE, overrides);
    res.json({ override: overrides[key] });
  }
);

app.delete(
  "/api/admin/chapters/:chapterId/personnages/:characterSlug/pieces/:pieceId/product",
  (req, res) => {
    const overrides = readJson(PRODUCTS_OVERRIDES_FILE, {});
    delete overrides[
      `${req.params.chapterId}/${req.params.characterSlug}/${req.params.pieceId}`
    ];
    writeJson(PRODUCTS_OVERRIDES_FILE, overrides);
    res.json({ ok: true });
  }
);

app.delete(
  "/api/admin/chapters/:chapterId/personnages/:characterSlug/product",
  (req, res) => {
    const overrides = readJson(PRODUCTS_OVERRIDES_FILE, {});
    delete overrides[`${req.params.chapterId}/${req.params.characterSlug}`];
    writeJson(PRODUCTS_OVERRIDES_FILE, overrides);
    res.json({ ok: true });
  }
);

/* ────────────────────────────── Copy / site ────────────────────────────── */

app.put("/api/admin/site/copy", (req, res) => {
  const site = readJson(SITE_OVERRIDES_FILE, { chapters: {}, copy: {} });
  site.copy = { ...(site.copy ?? {}), ...req.body };
  writeJson(SITE_OVERRIDES_FILE, site);
  res.json({ copy: site.copy });
});

/* ────────────────────────────── CMS — admin ──────────────────────────────
 * Schéma déclaratif + draft / published + token de preview iframe.
 */
app.get("/api/admin/cms", (_req, res) => {
  res.json(getCmsState());
});

app.patch("/api/admin/cms/:sectionId", async (req, res) => {
  const sectionId = String(req.params.sectionId);
  const known = CMS_SCHEMA.sections.find((s) => s.id === sectionId);
  if (!known) return res.status(400).json({ error: "Section inconnue." });
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ error: "Corps invalide." });
  }
  const patch = req.body;
  // Validation des champs autorisés
  const allowed = new Set(known.fields.map((f) => f.id));
  const safePatch = {};
  for (const [k, v] of Object.entries(patch)) {
    if (allowed.has(k)) safePatch[k] = v;
  }
  const draft = await updateCmsSection(sectionId, safePatch, {
    actor: req.adminUser?.email ?? null,
  });
  recordAudit("cms.update", {
    target: { type: "cms.section", id: sectionId },
    meta: { fields: Object.keys(safePatch) },
    actor: req.adminUser?.email,
    ip: req.ip,
  });
  res.json({ draft });
});

app.post("/api/admin/cms/publish", async (req, res) => {
  const published = await publishCms({ actor: req.adminUser?.email ?? null });
  recordAudit("cms.publish", {
    target: { type: "cms", id: "site" },
    actor: req.adminUser?.email,
    ip: req.ip,
  });
  res.json({ published, publishedAt: new Date().toISOString() });
});

app.post("/api/admin/cms/revert", async (req, res) => {
  const draft = await revertCmsDraft();
  recordAudit("cms.revert", {
    target: { type: "cms", id: "site" },
    actor: req.adminUser?.email,
    ip: req.ip,
  });
  res.json({ draft });
});

app.post("/api/admin/cms/preview", (_req, res) => {
  const { token, expiresAt } = createPreviewToken();
  res.json({ token, expiresAt });
});

app.put("/api/admin/site/season", (req, res) => {
  const catalog = readJson(CATALOG_FILE, { season: {}, chapters: [] });
  catalog.season = { ...(catalog.season ?? {}), ...req.body };
  saveCatalog(catalog);
  res.json({ season: catalog.season });
});

/* ────────────────────────────── Médiathèque ────────────────────────────── */

app.get("/api/admin/media", (_req, res) => {
  res.json({ items: collectMediaItems() });
});

const libraryUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      fs.mkdirSync(LIBRARY_ROOT, { recursive: true });
      cb(null, LIBRARY_ROOT);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
      const base = slugify(path.basename(file.originalname, ext)) || "media";
      cb(null, `${base}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 12 * 1024 * 1024 },
});

app.post("/api/admin/media/upload", libraryUpload.array("files", 24), (req, res) => {
  const items = collectMediaItems();
  const existingHashes = new Map(items.map((i) => [i.hash, i.path]));
  const written = [];
  const skipped = [];
  for (const file of req.files ?? []) {
    const target = path.join(LIBRARY_ROOT, file.filename);
    try {
      resizeImage(target, target);
    } catch {
      /* ignore */
    }
    let h = "";
    try {
      h = hashFile(target);
    } catch {
      /* ignore */
    }
    if (h && existingHashes.has(h)) {
      const original = existingHashes.get(h);
      const targetRel = publicPathFromAbs(target);
      if (targetRel !== original) {
        try {
          fs.unlinkSync(target);
        } catch {
          /* ignore */
        }
      }
      skipped.push({ file: file.originalname, existing: original });
    } else {
      const rel = publicPathFromAbs(target);
      if (h) existingHashes.set(h, rel);
      written.push(rel);
    }
  }
  res.json({ written, skipped, items: collectMediaItems() });
});

app.delete("/api/admin/media", (req, res) => {
  const target = typeof req.query.path === "string" ? req.query.path : "";
  if (!target) return res.status(400).json({ error: "path requis" });
  const abs = absFromPublicPath(target);
  if (!abs.startsWith(PUBLIC_ROOT)) return res.status(400).json({ error: "Chemin invalide" });
  if (!fs.existsSync(abs)) return res.status(404).json({ error: "Fichier introuvable" });
  const force = req.query.force === "true" || req.query.force === "1";
  const usage = buildUsageMap();
  const used = usage.get(target.replace(/^\/+/, "")) ?? [];
  if (used.length > 0 && !force) {
    return res.status(409).json({ error: "Média utilisé", usedBy: used });
  }
  fs.unlinkSync(abs);
  if (force && used.length > 0) {
    const catalog = readJson(CATALOG_FILE, { season: {}, chapters: [] });
    for (const ch of catalog.chapters) {
      for (const character of ch.characters) {
        character.images = character.images.filter(
          (p) => p.replace(/^\/+/, "") !== target.replace(/^\/+/, "")
        );
        if (
          character.cover &&
          character.cover.replace(/^\/+/, "") === target.replace(/^\/+/, "")
        ) {
          character.cover = character.images[0] ?? "";
        }
        character.productCount = character.images.length;
      }
    }
    saveCatalog(catalog);
  }
  res.json({ ok: true });
});

app.post(
  "/api/admin/chapters/:chapterId/personnages/:characterSlug/images/link",
  (req, res) => {
    const catalog = readJson(CATALOG_FILE, { season: {}, chapters: [] });
    const chapter = catalog.chapters.find((c) => c.id === req.params.chapterId);
    const character = chapter?.characters.find((c) => c.slug === req.params.characterSlug);
    if (!chapter || !character) {
      return res.status(404).json({ error: "Personnage introuvable" });
    }
    const paths = Array.isArray(req.body?.paths) ? req.body.paths : [];
    const dir = charDir(chapter.id, character.slug);
    fs.mkdirSync(dir, { recursive: true });
    const existingHashes = new Set();
    for (const f of listImages(dir)) {
      try {
        existingHashes.add(hashFile(path.join(dir, f)));
      } catch {
        /* ignore */
      }
    }
    const linked = [];
    const skipped = [];
    for (const rel of paths) {
      const abs = absFromPublicPath(rel);
      if (!abs.startsWith(PUBLIC_ROOT) || !fs.existsSync(abs)) {
        skipped.push({ path: rel, reason: "introuvable" });
        continue;
      }
      let h = "";
      try {
        h = hashFile(abs);
      } catch {
        /* ignore */
      }
      if (h && existingHashes.has(h)) {
        skipped.push({ path: rel, reason: "doublon" });
        continue;
      }
      const ext = path.extname(abs).toLowerCase() || ".jpg";
      const base = `lib-${Date.now()}-${Math.random().toString(36).slice(2, 6)}${ext}`;
      const target = path.join(dir, base);
      fs.copyFileSync(abs, target);
      if (h) existingHashes.add(h);
      linked.push(publicPathFromAbs(target));
    }
    const updated = rebuildCharacterFromDisk(chapter.id, character.slug, character);
    Object.assign(character, updated);
    saveCatalog(catalog);
    res.json({ character: updated, linked, skipped });
  }
);

app.listen(PORT, () => {
  console.log(`[fang] Serveur prêt — http://localhost:${PORT}`);
  console.log(`[fang] CORS : ${CORS_ORIGIN}`);
  if (process.env.FANG_DISABLE_BACKUPS !== "1") {
    scheduleDailyBackup();
    console.log(`[fang] Backups quotidiens activés (rotation 7 jours).`);
  }
  try {
    purgePending();
  } catch {
    /* ignore */
  }
  const payStatus = paymentProvidersStatus();
  console.log(
    `[fang] Paiement en ligne — sélection=${payStatus.selected} actif=${payStatus.active ?? "—"} (paytech=${payStatus.paytech.ready} paydunya=${payStatus.paydunya.ready})`
  );
});
