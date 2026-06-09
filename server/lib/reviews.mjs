import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { readJson, writeJson, ensureFile } from "./jsonStore.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(path.resolve(__dirname, "../../data"), "reviews.json");

ensureFile(FILE, { reviews: [] });

function load() {
  return readJson(FILE, { reviews: [] });
}
function save(data) {
  writeJson(FILE, data);
}

const STATUSES = ["pending", "approved", "rejected"];

export function listReviewsForProduct(productSlug, { onlyApproved = true } = {}) {
  const data = load();
  return data.reviews
    .filter((r) => r.productSlug === productSlug && (!onlyApproved || r.status === "approved"))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listAllReviews({ status } = {}) {
  const data = load();
  let list = [...data.reviews];
  if (status) list = list.filter((r) => r.status === status);
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createReview({ productSlug, customerId, customerName, rating, title, body }) {
  if (!productSlug || !customerName || !rating) {
    return { error: "Produit, nom et note requis." };
  }
  const r = Math.min(5, Math.max(1, Math.round(Number(rating) || 0)));
  if (!r) return { error: "Note invalide." };
  if (!body || String(body).trim().length < 5) {
    return { error: "Avis trop court (5 caractères min.)" };
  }
  const data = load();
  const review = {
    id: crypto.randomUUID(),
    productSlug: String(productSlug),
    customerId: customerId ?? null,
    customerName: String(customerName).trim().slice(0, 80),
    rating: r,
    title: String(title ?? "").trim().slice(0, 100),
    body: String(body).trim().slice(0, 2000),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  data.reviews.push(review);
  save(data);
  return { review };
}

export function moderateReview(id, status) {
  if (!STATUSES.includes(status)) return { error: "Statut invalide" };
  const data = load();
  const review = data.reviews.find((r) => r.id === id);
  if (!review) return { error: "Avis introuvable" };
  review.status = status;
  review.moderatedAt = new Date().toISOString();
  save(data);
  return { review };
}

export function deleteReview(id) {
  const data = load();
  const before = data.reviews.length;
  data.reviews = data.reviews.filter((r) => r.id !== id);
  if (data.reviews.length === before) return false;
  save(data);
  return true;
}

export function getProductRatingSummary(productSlug) {
  const approved = listReviewsForProduct(productSlug, { onlyApproved: true });
  if (approved.length === 0) return { count: 0, average: 0 };
  const sum = approved.reduce((s, r) => s + r.rating, 0);
  return {
    count: approved.length,
    average: Math.round((sum / approved.length) * 10) / 10,
  };
}

export function getAllRatings() {
  const data = load();
  const map = {};
  for (const r of data.reviews) {
    if (r.status !== "approved") continue;
    map[r.productSlug] = map[r.productSlug] ?? { count: 0, sum: 0 };
    map[r.productSlug].count += 1;
    map[r.productSlug].sum += r.rating;
  }
  const out = {};
  for (const [slug, agg] of Object.entries(map)) {
    out[slug] = { count: agg.count, average: Math.round((agg.sum / agg.count) * 10) / 10 };
  }
  return out;
}
