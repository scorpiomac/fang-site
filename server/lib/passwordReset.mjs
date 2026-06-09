import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { readJson, writeJson, ensureFile } from "./jsonStore.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESETS_FILE = path.join(path.resolve(__dirname, "../../data"), "passwordResets.json");

ensureFile(RESETS_FILE, { resets: [] });

const TTL_MS = 30 * 60 * 1000;

function load() {
  return readJson(RESETS_FILE, { resets: [] });
}
function save(data) {
  writeJson(RESETS_FILE, data);
}

function purge(data) {
  const now = Date.now();
  data.resets = data.resets.filter(
    (r) => !r.usedAt && new Date(r.expiresAt).getTime() > now
  );
}

export function createResetToken({ kind, userId, email }) {
  const data = load();
  purge(data);
  // Invalidate previous tokens for the same user
  data.resets = data.resets.filter(
    (r) => !(r.kind === kind && r.userId === userId)
  );
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TTL_MS).toISOString();
  data.resets.push({
    token,
    kind,
    userId,
    email,
    createdAt: new Date().toISOString(),
    expiresAt,
    usedAt: null,
  });
  save(data);
  return { token, expiresAt };
}

export function consumeResetToken(token) {
  const data = load();
  purge(data);
  const idx = data.resets.findIndex((r) => r.token === token);
  if (idx === -1) return null;
  const reset = data.resets[idx];
  if (reset.usedAt) return null;
  if (new Date(reset.expiresAt).getTime() < Date.now()) return null;
  data.resets[idx].usedAt = new Date().toISOString();
  save(data);
  return reset;
}

export function peekResetToken(token) {
  const data = load();
  const reset = data.resets.find((r) => r.token === token);
  if (!reset) return null;
  if (reset.usedAt) return null;
  if (new Date(reset.expiresAt).getTime() < Date.now()) return null;
  return reset;
}
