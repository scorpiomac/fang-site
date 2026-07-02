import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { readJson, writeJson, ensureFile } from "./jsonStore.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ORDERS_FILE = path.join(path.resolve(__dirname, "../../data"), "orders.json");

ensureFile(ORDERS_FILE, { orders: [], lastNumber: 0 });

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "in_production",
  "ready",
  "shipped",
  "delivered",
  "cancelled",
];

const PAYMENT_STATUSES = ["pending", "partial", "paid", "refunded"];

function load() {
  return readJson(ORDERS_FILE, { orders: [], lastNumber: 0 });
}

function save(data) {
  writeJson(ORDERS_FILE, data);
}

function nextOrderId(data) {
  const n = (data.lastNumber ?? 0) + 1;
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return { id: `FANG-${date}-${String(n).padStart(4, "0")}`, number: n };
}

export function listOrders({ status, limit = 100, offset = 0 } = {}) {
  const data = load();
  let orders = [...data.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (status) orders = orders.filter((o) => o.status === status);
  return {
    orders: orders.slice(offset, offset + limit),
    total: orders.length,
  };
}

export function getOrder(id) {
  const data = load();
  return data.orders.find((o) => o.id === id) ?? null;
}

export function createOrder(payload) {
  const data = load();
  const { id, number } = nextOrderId(data);
  const order = {
    id,
    number,
    status: payload.status ?? "pending",
    paymentStatus: payload.paymentStatus ?? "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    customerId: payload.customerId ?? null,
    customer: payload.customer,
    notes: payload.notes ?? "",
    lines: payload.lines,
    subtotalXof: payload.subtotalXof,
    discountXof: payload.discountXof ?? 0,
    promoCode: payload.promoCode ?? null,
    shippingXof: payload.shippingXof ?? 0,
    shippingZoneId: payload.shippingZoneId ?? null,
    shippingZoneName: payload.shippingZoneName ?? null,
    taxXof: payload.taxXof ?? 0,
    taxRate: payload.taxRate ?? 0,
    taxIncluded: payload.taxIncluded ?? true,
    paymentMethod: payload.paymentMethod ?? null,
    payment: payload.payment ?? null,
    totalXof: payload.totalXof,
    source: payload.source ?? "website",
  };
  data.orders.push(order);
  data.lastNumber = number;
  save(data);
  return order;
}

export function listOrdersForCustomer(customerId, { limit = 50 } = {}) {
  const data = load();
  const orders = data.orders
    .filter((o) => o.customerId === customerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map(formatCustomerOrderSummary);
  return orders;
}

function formatCustomerOrderSummary(o) {
  return {
    id: o.id,
    status: o.status,
    paymentStatus: o.paymentStatus,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    totalXof: o.totalXof,
    subtotalXof: o.subtotalXof,
    discountXof: o.discountXof,
    promoCode: o.promoCode,
    lineCount: o.lines?.length ?? 0,
    lines: o.lines.map((l) => ({
      title: l.title,
      size: l.size,
      variationLabel: l.variationLabel,
      qty: l.qty,
      priceXof: l.priceXof,
      image: l.image ?? null,
    })),
  };
}

export function getCustomerOrderSummary(customerId) {
  const data = load();
  const orders = data.orders.filter((o) => o.customerId === customerId && o.status !== "cancelled");
  const totalSpentXof = orders.reduce((s, o) => s + o.totalXof, 0);
  const lastOrder = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  return {
    totalOrders: orders.length,
    totalSpentXof,
    pendingOrders: orders.filter((o) => o.status === "pending").length,
    activeOrders: orders.filter((o) => !["delivered", "cancelled"].includes(o.status)).length,
    lastOrderId: lastOrder?.id ?? null,
  };
}

export function trackGuestOrder(orderId, email) {
  const normalized = String(email).trim().toLowerCase();
  const order = getOrder(orderId);
  if (!order) return { error: "Commande introuvable." };
  if (order.customer?.email?.trim().toLowerCase() !== normalized) {
    return { error: "E-mail ne correspond pas à cette commande." };
  }
  return { order: formatCustomerOrderDetail(order) };
}

function formatCustomerOrderDetail(order) {
  return {
    id: order.id,
    status: order.status,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    customer: order.customer,
    notes: order.notes ?? "",
    lines: order.lines,
    subtotalXof: order.subtotalXof,
    discountXof: order.discountXof,
    promoCode: order.promoCode,
    totalXof: order.totalXof,
  };
}

export function getCustomerOrder(customerId, orderId) {
  const order = getOrder(orderId);
  if (!order || order.customerId !== customerId) return null;
  return formatCustomerOrderDetail(order);
}

export function updateOrder(id, patch) {
  const data = load();
  const idx = data.orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  const order = data.orders[idx];
  if (patch.status && ORDER_STATUSES.includes(patch.status)) {
    order.status = patch.status;
  }
  if (patch.paymentStatus && PAYMENT_STATUSES.includes(patch.paymentStatus)) {
    order.paymentStatus = patch.paymentStatus;
  }
  if (patch.internalNote !== undefined) order.internalNote = patch.internalNote;
  if (patch.payment !== undefined) {
    order.payment = { ...(order.payment ?? {}), ...patch.payment };
  }
  if (patch.paymentMethod !== undefined) order.paymentMethod = patch.paymentMethod;
  if (patch.authenticity !== undefined) {
    order.authenticity = { ...(order.authenticity ?? {}), ...patch.authenticity };
  }
  order.updatedAt = new Date().toISOString();
  data.orders[idx] = order;
  save(data);
  return order;
}

export function orderStats() {
  const data = load();
  const orders = data.orders;
  const byStatus = {};
  for (const s of ORDER_STATUSES) byStatus[s] = 0;
  for (const o of orders) byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
  const revenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.totalXof, 0);
  return {
    total: orders.length,
    byStatus,
    revenueXof: revenue,
    pending: byStatus.pending ?? 0,
  };
}

export { ORDER_STATUSES, PAYMENT_STATUSES };
