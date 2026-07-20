/**
 * Enregistre une démo LinkedIn du site FANG (16:9, ~60 s).
 * Usage : node scripts/record-linkedin-demo.mjs
 * Produit demo-linkedin/fang-linkedin-demo.webm + trim.txt (secondes à couper au début).
 * NB : ouvre une fenêtre Chromium visible (GPU réel = rendu fluide). Ne pas y toucher pendant la capture.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "demo-linkedin");
const BASE = process.env.DEMO_URL || "http://localhost:5173";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Scroll fluide natif : un seul appel, le navigateur anime lui-même.
async function glide(page, y, settleMs = 1600) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: "smooth" }), y).catch(() => {});
  await wait(settleMs);
}

// Navigation SPA (pas de rechargement → pas de flash blanc).
async function spaNav(page, href) {
  const link = page.locator(`a[href="${href}"]`).first();
  if (await link.count()) {
    await link.click({ force: true }).catch(() => {});
  } else {
    await page.evaluate((h) => {
      window.history.pushState({}, "", h);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }, href);
  }
  await wait(1000);
  await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
}

async function waitImages(page, selector, min = 1) {
  await page
    .waitForFunction(
      ({ sel, n }) => {
        const imgs = [...document.querySelectorAll(sel)];
        const ready = imgs.filter((img) => img.complete && img.naturalWidth > 40);
        return ready.length >= Math.min(n, Math.max(1, imgs.length));
      },
      { sel: selector, n: min },
      { timeout: 12000 }
    )
    .catch(() => {});
}

async function main() {
  console.log("BASE", BASE);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const videoDir = path.join(OUT_DIR, `raw-${Date.now()}`);
  fs.mkdirSync(videoDir, { recursive: true });

  // Fenêtre visible : GPU matériel → animations fluides.
  const browser = await chromium.launch({
    headless: false,
    args: ["--window-position=0,0", "--window-size=1936,1096", "--hide-scrollbars"],
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    recordVideo: { dir: videoDir, size: { width: 1920, height: 1080 } },
    locale: "fr-FR",
  });
  await context.addInitScript(() => {
    const style = document.createElement("style");
    style.textContent = `
      .music-toggle, .cursor, .custom-cursor { display: none !important; }
      * { cursor: none !important; }
    `;
    document.documentElement.appendChild(style);
  });
  const t0 = Date.now();
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const mark = (label) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, label);

  mark("1/6 Accueil");
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector(".hero__title", { state: "visible", timeout: 25000 }).catch(() => {});
  await page.waitForSelector(".loader", { state: "detached", timeout: 15000 }).catch(() => {});
  await waitImages(page, ".hero img, .hero__media img, img", 1);
  await wait(500);
  const trimSec = Math.max(0, (Date.now() - t0) / 1000 - 0.2);

  await wait(2800); // hero
  await glide(page, 750, 2000);
  await glide(page, 1500, 2200);

  mark("2/6 Chapitres");
  const chapters = page.locator("#collections");
  if (await chapters.count()) {
    await chapters.first().scrollIntoViewIfNeeded().catch(() => {});
    await waitImages(page, ".chapter-panel.is-current img, .chapter-panel__gallery img", 1);
    await wait(1600);
    const next = page.locator(".chapters__nav-btn").last();
    if (await next.count()) {
      await next.click({ force: true }).catch(() => {});
      await waitImages(page, ".chapter-panel.is-current img", 1);
      await wait(1800);
      await next.click({ force: true }).catch(() => {});
      await waitImages(page, ".chapter-panel.is-current img", 1);
      await wait(1800);
    }
  }

  mark("3/6 Archétype");
  await spaNav(page, "/archetype");
  await page.waitForSelector(".archetype-screen, #personnages", { timeout: 15000 }).catch(() => {});
  await waitImages(page, ".archetype-screen__thumb img, .archetype-screen img", 2);
  await wait(2800);
  const thumbs = page.locator(".archetype-screen__thumb");
  const n = await thumbs.count();
  if (n > 1) {
    await thumbs.nth(1).click({ force: true }).catch(() => {});
    await wait(2400);
    await thumbs.nth(Math.min(3, n - 1)).click({ force: true }).catch(() => {});
    await wait(2600);
  }

  mark("4/6 Boutique");
  await spaNav(page, "/boutique");
  await page.waitForSelector(".product-card-shop, .shop-catalog-grid, .shop-page", { timeout: 15000 }).catch(() => {});
  await waitImages(page, ".product-card-shop img, .shop-page img", 3);
  await wait(1800);
  await glide(page, 520, 1800);

  mark("5/6 Fiche produit");
  const productLink = page.locator('a[href^="/boutique/"]').first();
  if (await productLink.count()) {
    await productLink.click({ force: true }).catch(() => {});
    await waitImages(page, ".product-page img, img", 1);
    await wait(2400);
    await glide(page, 450, 1800);
    await glide(page, 0, 1200);
  }

  mark("6/6 Collection + fin");
  await spaNav(page, "/collection");
  await waitImages(page, ".collection-page img, img", 1);
  await wait(2200);
  await glide(page, 450, 1800);
  await glide(page, 0, 1200);
  await wait(2000); // plan final stable
  mark("fin capture");

  await context.close();
  await browser.close();

  const files = fs.readdirSync(videoDir).filter((f) => f.endsWith(".webm"));
  if (!files.length) throw new Error("Aucune vidéo Playwright générée");
  const raw = path.join(videoDir, files[0]);
  const destWebm = path.join(OUT_DIR, "fang-linkedin-demo.webm");
  fs.copyFileSync(raw, destWebm);
  fs.writeFileSync(path.join(OUT_DIR, "trim.txt"), String(trimSec.toFixed(2)));
  console.log("RAW", destWebm);
  console.log("TRIM", trimSec.toFixed(2));
  console.log("OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
