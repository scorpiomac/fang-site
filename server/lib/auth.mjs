import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { readJson, writeJson, ensureFile } from "./jsonStore.mjs";
import {
  initUsers,
  verifyUserPassword,
  touchLastLogin,
  getUserById,
  changeUserPassword,
  toPublicUser,
  canManageUsers,
  canAccessCommerce,
} from "./users.mjs";

export { initUsers, changeUserPassword, canManageUsers, canAccessCommerce, toPublicUser };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SESSIONS_FILE = path.join(path.resolve(__dirname, "../../data"), "sessions.json");

const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 h

ensureFile(SESSIONS_FILE, { sessions: [] });

function loadSessions() {
  return readJson(SESSIONS_FILE, { sessions: [] });
}

function saveSessions(data) {
  writeJson(SESSIONS_FILE, data);
}

function purgeExpired(sessions) {
  const now = Date.now();
  return sessions.filter((s) => s.expiresAt > now);
}

export function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  const session = {
    id: token,
    userId,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
  };
  const data = loadSessions();
  data.sessions = purgeExpired(data.sessions);
  data.sessions.push(session);
  saveSessions(data);
  return { token, expiresAt: session.expiresAt };
}

function getSession(token) {
  if (!token || typeof token !== "string") return null;
  const data = loadSessions();
  const now = Date.now();
  data.sessions = purgeExpired(data.sessions);
  const session = data.sessions.find((s) => s.id === token);
  if (!session || session.expiresAt <= now) {
    saveSessions(data);
    return null;
  }
  saveSessions(data);
  return session;
}

export function authenticate(email, password) {
  const user = verifyUserPassword(email, password);
  if (!user) return null;
  touchLastLogin(user.id);
  return user;
}

export function validateSession(token) {
  const session = getSession(token);
  if (!session) return null;
  const user = getUserById(session.userId);
  if (!user || !user.active) return null;
  return { session, user };
}

export function revokeSession(token) {
  const data = loadSessions();
  data.sessions = data.sessions.filter((s) => s.id !== token);
  saveSessions(data);
}

export function revokeUserSessions(userId) {
  const data = loadSessions();
  data.sessions = data.sessions.filter((s) => s.userId !== userId);
  saveSessions(data);
}

export function revokeAllSessions() {
  saveSessions({ sessions: [] });
}

export function sessionMiddleware(req, res, next) {
  const publicPaths = ["/api/admin/ping", "/api/admin/login"];
  if (publicPaths.includes(req.path)) return next();
  if (req.method === "OPTIONS") return next();

  const token =
    req.header("authorization")?.replace(/^Bearer\s+/i, "") ??
    req.header("x-session-token") ??
    "";

  const auth = validateSession(token);
  if (!auth) {
    return res.status(401).json({ error: "Session invalide ou expirée." });
  }

  req.sessionToken = token;
  req.adminUser = toPublicUser(auth.user);
  next();
}

export function requireCommerce(req, res, next) {
  if (!canAccessCommerce(req.adminUser?.role)) {
    return res.status(403).json({ error: "Accès réservé aux administrateurs." });
  }
  next();
}

export function requireUserManagement(req, res, next) {
  if (!canManageUsers(req.adminUser?.role)) {
    return res.status(403).json({ error: "Accès réservé aux administrateurs." });
  }
  next();
}
