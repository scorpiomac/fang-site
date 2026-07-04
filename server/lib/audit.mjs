import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { readJson, writeJson, ensureFile } from "./jsonStore.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(path.resolve(__dirname, "../../data"), "audit.json");
const MAX_ENTRIES = 5000;

ensureFile(FILE, []);

function load() {
  return readJson(FILE, []);
}

function save(entries) {
  writeJson(FILE, entries);
}

/**
 * Enregistre une entrée d'audit.
 * action: string — ex: "login", "order.update", "user.delete"
 * actor: { id, email, name, role } ou null pour un évènement système / public
 * target: { type, id, label } optionnel
 * meta: objet libre
 */
export function recordAudit(action, { actor = null, target = null, meta = null, ip = null } = {}) {
  if (!action) return;
  const entry = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    action: String(action),
    actor: actor
      ? {
          id: actor.id ?? null,
          email: actor.email ?? null,
          name: actor.name ?? null,
          role: actor.role ?? null,
        }
      : null,
    target: target
      ? { type: target.type ?? null, id: target.id ?? null, label: target.label ?? null }
      : null,
    meta: meta ?? null,
    ip,
  };
  try {
    const list = load();
    list.unshift(entry);
    if (list.length > MAX_ENTRIES) list.length = MAX_ENTRIES;
    save(list);
  } catch (err) {
    console.warn("[audit] write error", err);
  }
}

export function listAudit({ limit = 200, offset = 0, action, actorId } = {}) {
  let list = load();
  if (action) list = list.filter((e) => e.action === action || e.action.startsWith(`${action}.`));
  if (actorId) list = list.filter((e) => e.actor?.id === actorId);
  const total = list.length;
  return {
    total,
    entries: list.slice(offset, offset + limit),
  };
}

export function actionsSummary() {
  const list = load();
  const counts = {};
  for (const e of list) {
    counts[e.action] = (counts[e.action] ?? 0) + 1;
  }
  return counts;
}
