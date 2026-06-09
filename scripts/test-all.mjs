#!/usr/bin/env node
/**
 * Suite de tests FANG — variations + API admin + boutique + routes
 * Usage: npm run test:all
 * Prérequis: serveur admin sur :5170 (npm run admin) + .env avec FANG_ADMIN_PASSWORD
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(ROOT, ".env") });

const ADMIN = process.env.FANG_ADMIN_URL ?? "http://localhost:5170/api/admin";
const STORE = process.env.FANG_STORE_URL ?? "http://localhost:5170/api/store";
const VITE = process.env.FANG_VITE_URL ?? "http://localhost:5173";
const ADMIN_PASSWORD = process.env.FANG_ADMIN_PASSWORD;

let sessionToken = null;
let passed = 0;
let failed = 0;

function ok(name) {
  passed++;
  console.log(`  ✓ ${name}`);
}

function fail(name, detail) {
  failed++;
  console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
}

function assert(cond, name, detail) {
  if (cond) ok(name);
  else fail(name, detail);
}

async function login() {
  if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) {
    throw new Error("FANG_ADMIN_PASSWORD requis (min. 12 car.) dans .env");
  }
  const email = process.env.FANG_ADMIN_EMAIL ?? "admin@fang.studio";
  const res = await fetch(`${ADMIN}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: ADMIN_PASSWORD }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `login HTTP ${res.status}`);
  sessionToken = json.sessionToken;
  if (!sessionToken) throw new Error("sessionToken manquant");
}

async function admin(path, init = {}) {
  const headers = {
    Authorization: sessionToken ? `Bearer ${sessionToken}` : "",
    "x-session-token": sessionToken ?? "",
    "Content-Type": "application/json",
    ...(init.headers ?? {}),
  };
  const res = await fetch(`${ADMIN}${path}`, { ...init, headers });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

async function store(path, init = {}) {
  const res = await fetch(`${STORE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

/* ── 1. Logique variations (miroir productVariations.ts) ── */
function resolveVariations(priceXof, variations) {
  const list = (variations ?? []).filter(
    (v) => v.label?.trim() && typeof v.priceXof === "number" && v.priceXof >= 0
  );
  if (list.length > 0) return list;
  return [{ id: "default", label: "Pièce", priceXof, default: true }];
}

function hasMultipleVariations(vars) {
  return vars.length > 1;
}

function getDefaultVariation(vars) {
  return vars.find((v) => v.default) ?? vars[0];
}

function getPriceRange(vars) {
  const prices = vars.map((v) => v.priceXof);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

function displayPriceXof(priceXof, variations) {
  const vars = resolveVariations(priceXof, variations);
  if (hasMultipleVariations(vars)) return getPriceRange(vars).min;
  return getDefaultVariation(vars).priceXof;
}

console.log("\n═══ 1. Logique variations ═══");

const trio = [
  { id: "ensemble", label: "Ensemble complet", priceXof: 185000, default: true },
  { id: "haut", label: "Haut seul", priceXof: 95000 },
  { id: "pantalon", label: "Pantalon seul", priceXof: 75000 },
];
const resolved = resolveVariations(125000, trio);
assert(resolved.length === 3, "3 variations résolues");
assert(getDefaultVariation(resolved).id === "ensemble", "variation par défaut = ensemble");
assert(displayPriceXof(125000, trio) === 75000, "prix affiché = minimum (75000)");
assert(hasMultipleVariations(resolved), "hasMultipleVariations true");

const single = resolveVariations(130000, []);
assert(single.length === 1 && single[0].priceXof === 130000, "prix unique sans override");

const filtered = resolveVariations(100000, [
  { id: "a", label: "  ", priceXof: 50000 },
  { id: "b", label: "Valide", priceXof: 80000 },
]);
assert(filtered.length === 1 && filtered[0].label === "Valide", "labels vides filtrés");

/* ── 2. Fichiers JSON valides ── */
console.log("\n═══ 2. Fichiers contenu ═══");

for (const f of [
  "src/content/atelierCatalog.json",
  "src/content/productsOverrides.json",
  "src/content/siteOverrides.json",
]) {
  try {
    JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8"));
    ok(`${f} JSON valide`);
  } catch (e) {
    fail(`${f} JSON valide`, e.message);
  }
}

/* ── 3. API Admin ── */
console.log("\n═══ 3. API Admin (nécessite serveur :5170) ═══");

let catalog;
let testPromoId = null;
try {
  await login();
  ok("POST /login (session)");

  const ping = await admin("/ping", { method: "GET", headers: {} });
  assert(ping.status === 200 && ping.json.ok, "GET /ping");

  const noAuth = await fetch(`${ADMIN}/catalog`);
  assert(noAuth.status === 401, "catalog sans token → 401");

  const cat = await admin("/catalog");
  assert(cat.status === 200, "GET /catalog");
  catalog = cat.json.catalog;
  assert(Array.isArray(catalog?.chapters) && catalog.chapters.length > 0, "catalogue non vide");

  const media = await admin("/media");
  assert(media.status === 200 && Array.isArray(media.json.items), "GET /media");
  assert(media.json.items.length > 0, "médiathèque non vide");

  const dupes = media.json.items.filter((i) => i.duplicates?.length > 0);
  ok(`médiathèque: ${media.json.items.length} fichiers, ${dupes.length} avec doublons`);

  const stats = await admin("/stats");
  assert(stats.status === 200 && stats.json.orders, "GET /stats");

  const users = await admin("/users");
  assert(users.status === 200 && Array.isArray(users.json.users), "GET /users");
  assert(users.json.users.length >= 1, "au moins 1 utilisateur");

  const orders = await admin("/orders");
  assert(orders.status === 200 && Array.isArray(orders.json.orders), "GET /orders");

  const promos = await admin("/promos");
  assert(promos.status === 200 && Array.isArray(promos.json.promos), "GET /promos");
} catch (e) {
  fail("API admin accessible", e.message);
  console.error("\n⚠ Lancez: npm run dev (ou npm run admin) avec .env configuré\n");
}

/* ── 4. CRUD variations (test + rollback) ── */
console.log("\n═══ 4. CRUD variations produit ═══");

if (catalog && sessionToken) {
  let testChapter = null;
  let testChar = null;
  for (const ch of catalog.chapters) {
    if (ch.characters?.length > 0) {
      testChapter = ch;
      testChar = ch.characters[0];
      break;
    }
  }

  if (testChapter && testChar) {
    const key = `${testChapter.id}/${testChar.slug}`;
    const testVariations = [
      {
        id: "ensemble-complet",
        label: "Ensemble complet",
        priceXof: 185000,
        description: "Haut + pantalon",
        default: true,
      },
      { id: "haut-seul", label: "Haut seul", priceXof: 95000 },
      { id: "pantalon-seul", label: "Pantalon seul", priceXof: 75000 },
    ];

    const put = await admin(
      `/chapters/${testChapter.id}/personnages/${testChar.slug}/product`,
      {
        method: "PUT",
        body: JSON.stringify({
          priceXof: 185000,
          variations: testVariations,
        }),
      }
    );
    assert(put.status === 200, "PUT product variations");
    assert(put.json.override?.variations?.length === 3, "3 variations enregistrées");
    assert(put.json.override?.priceXof === 185000, "priceXof = variation par défaut");

    const overridesFile = JSON.parse(
      fs.readFileSync(path.join(ROOT, "src/content/productsOverrides.json"), "utf8")
    );
    assert(overridesFile[key]?.variations?.length === 3, "productsOverrides.json persisté");

    const del = await admin(
      `/chapters/${testChapter.id}/personnages/${testChar.slug}/product`,
      { method: "DELETE" }
    );
    assert(del.status === 200, "DELETE product override (rollback)");
    ok(`test sur ${key}`);
  } else {
    fail("trouver un personnage test", "aucun personnage dans le catalogue");
  }
}

/* ── 5. Lore chapitre + copy ── */
console.log("\n═══ 5. Overrides chapitre & copy ═══");

if (catalog?.chapters?.[0] && sessionToken) {
  const chId = catalog.chapters[0].id;
  const lore = await admin(`/chapters/${chId}/lore`, {
    method: "PATCH",
    body: JSON.stringify({
      coverImage: "collection/s01/test/cover.jpg",
      posterImage: "collection/s01/test/poster.jpg",
    }),
  });
  assert(lore.status === 200, "PATCH chapter lore (cover + poster)");

  await admin(`/chapters/${chId}/lore`, {
    method: "PATCH",
    body: JSON.stringify({ coverImage: undefined, posterImage: undefined }),
  });
  ok("rollback lore chapitre");
}

if (sessionToken) {
  const copyPut = await admin("/site/copy", {
    method: "PUT",
    body: JSON.stringify({ heroTitle: "Test titre" }),
  });
  assert(copyPut.status === 200, "PUT site copy");
}

/* ── 6. Boutique — promos + commandes ── */
console.log("\n═══ 6. API Boutique (promos + commandes) ═══");

if (sessionToken) {
  const code = `TEST${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const createPromo = await admin("/promos", {
    method: "POST",
    body: JSON.stringify({
      code,
      label: "Test auto",
      type: "percent",
      value: 10,
      active: true,
    }),
  });
  assert(createPromo.status === 201, "POST promo test");
  testPromoId = createPromo.json.promo?.id;

  const validate = await store("/promo/validate", {
    method: "POST",
    body: JSON.stringify({ code, subtotalXof: 100000 }),
  });
  assert(validate.status === 200 && validate.json.valid, "POST /promo/validate");
  assert(validate.json.discountXof === 10000, "remise 10 % correcte");

  const order = await store("/orders", {
    method: "POST",
    body: JSON.stringify({
      customer: {
        name: "Test Client",
        email: "test@example.com",
        phone: "+221000000000",
        city: "Dakar",
        country: "Sénégal",
      },
      lines: [
        {
          lineId: "test-line",
          title: "Pièce test",
          size: "M",
          variationLabel: "Pièce",
          priceXof: 100000,
          qty: 1,
        },
      ],
      subtotalXof: 100000,
      discountXof: 10000,
      totalXof: 90000,
      promoCode: code,
    }),
  });
  assert(order.status === 201 && order.json.order?.id, "POST /orders");
  assert(order.json.order.id.startsWith("FANG-"), "numéro commande FANG-");

  const fetched = await admin(`/orders/${encodeURIComponent(order.json.order.id)}`);
  assert(fetched.status === 200, "GET order par id");

  if (testPromoId) {
    await admin(`/promos/${testPromoId}`, { method: "DELETE" });
    ok("DELETE promo test (rollback)");
  }
}

/* ── 7. Compte client ── */
console.log("\n═══ 7. Compte client ═══");

const clientEmail = `client.test.${Date.now()}@example.com`;
const clientPass = "ClientTest2026!";
try {
  const reg = await fetch(`${STORE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: clientEmail,
      password: clientPass,
      name: "Client Test",
      phone: "+221000000000",
      city: "Dakar",
    }),
  });
  assert(reg.status === 201, "POST /auth/register");
  const regBody = await reg.json();
  const clientToken = regBody.sessionToken;

  const me = await fetch(`${STORE}/auth/me`, {
    headers: { Authorization: `Bearer ${clientToken}`, "x-customer-token": clientToken },
  });
  assert(me.status === 200, "GET /auth/me");

  const clientOrder = await fetch(`${STORE}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${clientToken}`,
      "x-customer-token": clientToken,
    },
    body: JSON.stringify({
      customer: {
        name: "Client Test",
        email: clientEmail,
        phone: "+221000000000",
        city: "Dakar",
        country: "Sénégal",
      },
      lines: [
        {
          lineId: "client-line",
          title: "Test client",
          size: "M",
          variationLabel: "Pièce",
          priceXof: 50000,
          qty: 1,
        },
      ],
      subtotalXof: 50000,
      discountXof: 0,
      totalXof: 50000,
    }),
  });
  assert(clientOrder.status === 201, "commande liée au compte client");
  const clientOrderBody = await clientOrder.json();

  const myOrders = await fetch(`${STORE}/account/orders`, {
    headers: { Authorization: `Bearer ${clientToken}`, "x-customer-token": clientToken },
  });
  const myOrdersBody = await myOrders.json();
  assert(myOrders.status === 200 && myOrdersBody.orders?.length >= 1, "GET /account/orders");

  const track = await fetch(`${STORE}/orders/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId: clientOrderBody.order.id, email: clientEmail }),
  });
  assert(track.status === 200, "POST /orders/track");

  const summary = await fetch(`${STORE}/account/summary`, {
    headers: { Authorization: `Bearer ${clientToken}`, "x-customer-token": clientToken },
  });
  assert(summary.status === 200, "GET /account/summary");
} catch (e) {
  fail("API compte client", e.message);
}

/* ── 8. Routes frontend ── */
console.log("\n═══ 8. Routes frontend (nécessite Vite :5173) ═══");

  const routes = [
  "/",
  "/admin",
  "/admin/commandes",
  "/admin/clients",
  "/admin/promos",
  "/admin/utilisateurs",
  "/admin/medias",
  "/admin/collections",
  "/admin/produits",
  "/boutique",
  "/collection",
  "/commande",
  "/compte",
  "/compte/commandes",
];
for (const r of routes) {
  try {
    const res = await fetch(`${VITE}${r}`);
    assert(res.status === 200, `GET ${r} → 200`);
  } catch (e) {
    fail(`GET ${r}`, e.message);
  }
}

/* ── Résumé ── */
console.log("\n══════════════════════════════════════");
console.log(`Résultat: ${passed} passés, ${failed} échoués`);
console.log("══════════════════════════════════════\n");

process.exit(failed > 0 ? 1 : 0);
