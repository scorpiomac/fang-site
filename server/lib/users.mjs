import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJson, writeJson, ensureFile } from "./jsonStore.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USERS_FILE = path.join(path.resolve(__dirname, "../../data"), "users.json");

export const USER_ROLES = ["owner", "admin", "editor"];

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

ensureFile(USERS_FILE, { users: [] });

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64, SCRYPT_PARAMS).toString("hex");
}

function timingSafeEqual(a, b) {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function load() {
  return readJson(USERS_FILE, { users: [] });
}

function save(data) {
  writeJson(USERS_FILE, data);
}

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

export function toPublicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt ?? null,
  };
}

export function initUsers() {
  const envPassword = process.env.FANG_ADMIN_PASSWORD;
  const envEmail = normalizeEmail(process.env.FANG_ADMIN_EMAIL ?? "admin@fang.studio");

  if (!envPassword || String(envPassword).length < 12) {
    throw new Error(
      "[FANG] FANG_ADMIN_PASSWORD requis (min. 12 caractères). Copiez .env.example vers .env"
    );
  }

  const data = load();

  if (data.users.length === 0) {
    const salt = crypto.randomBytes(16).toString("hex");
    data.users.push({
      id: crypto.randomUUID(),
      email: envEmail,
      name: process.env.FANG_ADMIN_NAME ?? "Administrateur",
      passwordHash: hashPassword(envPassword, salt),
      salt,
      role: "owner",
      active: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
    });
    save(data);
    return;
  }

  const owner = data.users.find((u) => u.role === "owner");
  if (owner) {
    let changed = false;
    const expectedHash = hashPassword(envPassword, owner.salt);
    if (owner.passwordHash !== expectedHash) {
      owner.passwordHash = expectedHash;
      changed = true;
    }
    if (owner.email !== envEmail) {
      owner.email = envEmail;
      changed = true;
    }
    const envName = process.env.FANG_ADMIN_NAME ?? "Administrateur";
    if (owner.name !== envName) {
      owner.name = envName;
      changed = true;
    }
    if (changed) {
      owner.updatedAt = new Date().toISOString();
      save(data);
    }
  }
}

export function getUserById(id) {
  return load().users.find((u) => u.id === id) ?? null;
}

export function getUserByEmail(email) {
  const normalized = normalizeEmail(email);
  return load().users.find((u) => u.email === normalized) ?? null;
}

export function verifyUserPassword(email, password) {
  const user = getUserByEmail(email);
  if (!user || !user.active) return null;
  const hash = hashPassword(String(password), user.salt);
  if (!timingSafeEqual(hash, user.passwordHash)) return null;
  return user;
}

export function touchLastLogin(userId) {
  const data = load();
  const user = data.users.find((u) => u.id === userId);
  if (!user) return;
  user.lastLoginAt = new Date().toISOString();
  save(data);
}

export function listUsers() {
  return load()
    .users.map(toPublicUser)
    .sort((a, b) => a.email.localeCompare(b.email));
}

export function createUser(body, actor) {
  const data = load();
  const email = normalizeEmail(body.email);
  if (!email || !email.includes("@")) return { error: "E-mail invalide." };
  if (data.users.some((u) => u.email === email)) return { error: "Cet e-mail existe déjà." };
  if (!body.password || String(body.password).length < 12) {
    return { error: "Mot de passe min. 12 caractères." };
  }
  const role = USER_ROLES.includes(body.role) ? body.role : "editor";
  if (role === "owner") return { error: "Un seul compte propriétaire est autorisé." };
  if (role === "admin" && actor?.role !== "owner") {
    return { error: "Seul le propriétaire peut créer un administrateur." };
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const user = {
    id: crypto.randomUUID(),
    email,
    name: String(body.name ?? email.split("@")[0]).trim() || email,
    passwordHash: hashPassword(String(body.password), salt),
    salt,
    role,
    active: body.active !== false,
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
  };
  data.users.push(user);
  save(data);
  return { user: toPublicUser(user) };
}

export function updateUser(id, patch, actor) {
  const data = load();
  const idx = data.users.findIndex((u) => u.id === id);
  if (idx === -1) return { error: "Utilisateur introuvable." };

  const user = data.users[idx];
  const actorRole = actor?.role ?? "editor";

  if (user.role === "owner" && actorRole !== "owner") {
    return { error: "Seul le propriétaire peut modifier ce compte." };
  }

  if (patch.email !== undefined) {
    const email = normalizeEmail(patch.email);
    if (!email.includes("@")) return { error: "E-mail invalide." };
    if (data.users.some((u) => u.email === email && u.id !== id)) {
      return { error: "Cet e-mail existe déjà." };
    }
    user.email = email;
  }

  if (patch.name !== undefined) user.name = String(patch.name).trim() || user.email;

  if (patch.role !== undefined) {
    if (!USER_ROLES.includes(patch.role)) return { error: "Rôle invalide." };
    if (patch.role === "owner" && user.role !== "owner") {
      return { error: "Impossible de promouvoir en propriétaire." };
    }
    if (user.role === "owner" && patch.role !== "owner") {
      return { error: "Le propriétaire ne peut pas changer de rôle." };
    }
    if (actorRole !== "owner" && (patch.role === "owner" || user.role === "admin")) {
      return { error: "Droits insuffisants pour ce rôle." };
    }
    user.role = patch.role;
  }

  if (patch.active !== undefined) {
    if (user.role === "owner" && !patch.active) {
      return { error: "Le compte propriétaire ne peut pas être désactivé." };
    }
    user.active = Boolean(patch.active);
  }

  if (patch.password !== undefined) {
    if (!patch.password || String(patch.password).length < 12) {
      return { error: "Mot de passe min. 12 caractères." };
    }
    user.salt = crypto.randomBytes(16).toString("hex");
    user.passwordHash = hashPassword(String(patch.password), user.salt);
  }

  user.updatedAt = new Date().toISOString();
  data.users[idx] = user;
  save(data);
  return { user: toPublicUser(user) };
}

export function deleteUser(id, actor) {
  const data = load();
  const user = data.users.find((u) => u.id === id);
  if (!user) return { error: "Utilisateur introuvable." };
  if (actor?.id === id) return { error: "Vous ne pouvez pas supprimer votre propre compte." };
  if (user.role === "owner") return { error: "Le compte propriétaire ne peut pas être supprimé." };
  if (user.role === "admin" && actor?.role !== "owner") {
    return { error: "Seul le propriétaire peut supprimer un administrateur." };
  }

  data.users = data.users.filter((u) => u.id !== id);
  save(data);
  return { ok: true };
}

export function changeUserPassword(userId, currentPassword, newPassword) {
  const user = getUserById(userId);
  if (!user) return { ok: false, error: "Utilisateur introuvable." };
  const hash = hashPassword(String(currentPassword), user.salt);
  if (!timingSafeEqual(hash, user.passwordHash)) {
    return { ok: false, error: "Mot de passe actuel incorrect." };
  }
  if (!newPassword || String(newPassword).length < 12) {
    return { ok: false, error: "Le nouveau mot de passe doit faire au moins 12 caractères." };
  }
  const result = updateUser(userId, { password: newPassword }, { role: "owner", id: userId });
  if (result.error) return { ok: false, error: result.error };
  return { ok: true };
}

export function resetUserPassword(userId, newPassword) {
  if (!newPassword || String(newPassword).length < 12) {
    return { ok: false, error: "Nouveau mot de passe min. 12 caractères." };
  }
  const data = load();
  const user = data.users.find((u) => u.id === userId);
  if (!user) return { ok: false, error: "Utilisateur introuvable." };
  user.salt = crypto.randomBytes(16).toString("hex");
  user.passwordHash = hashPassword(String(newPassword), user.salt);
  user.updatedAt = new Date().toISOString();
  save(data);
  return { ok: true };
}

export function canManageUsers(role) {
  return role === "owner" || role === "admin";
}

export function canAccessCommerce(role) {
  return role === "owner" || role === "admin";
}
