import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { readJson, writeJson, ensureFile } from "./jsonStore.mjs";
import {
  verifyCustomerPassword,
  touchCustomerLogin,
  getCustomerById,
  toPublicCustomer,
} from "./customers.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SESSIONS_FILE = path.join(path.resolve(__dirname, "../../data"), "customerSessions.json");

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 j

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

export function createCustomerSession(customerId) {
  const token = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  const session = {
    id: token,
    customerId,
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

export function authenticateCustomer(email, password) {
  const customer = verifyCustomerPassword(email, password);
  if (!customer) return null;
  touchCustomerLogin(customer.id);
  return customer;
}

export function validateCustomerSession(token) {
  const session = getSession(token);
  if (!session) return null;
  const customer = getCustomerById(session.customerId);
  if (!customer || !customer.active) return null;
  return { session, customer };
}

export function revokeCustomerSession(token) {
  const data = loadSessions();
  data.sessions = data.sessions.filter((s) => s.id !== token);
  saveSessions(data);
}

export function revokeCustomerSessions(customerId) {
  const data = loadSessions();
  data.sessions = data.sessions.filter((s) => s.customerId !== customerId);
  saveSessions(data);
}

export function customerSessionMiddleware(req, res, next) {
  const token =
    req.header("authorization")?.replace(/^Bearer\s+/i, "") ??
    req.header("x-customer-token") ??
    "";

  const auth = validateCustomerSession(token);
  if (!auth) {
    return res.status(401).json({ error: "Session expirée. Reconnectez-vous." });
  }

  req.customerToken = token;
  req.customer = toPublicCustomer(auth.customer);
  next();
}
