import { generateLicenceKey, isWellFormedLicence } from "./crypto.ts";
import { planById } from "./plans.ts";
import { createGatewayOrder, gatewayConfig } from "./gateway.ts";
import { id, logEvent, now, read, write, type Licence, type Order } from "./store.ts";

/**
 * The live payment gateway when PAYMENT_GATEWAY_KEY_ID + PAYMENT_GATEWAY_KEY_SECRET
 * are set, otherwise a built-in test gateway (/pay/test/<order>) so the whole
 * flow works locally. The test gateway is refused in production unless
 * ALLOW_TEST_PAYMENTS=true.
 */
export { gatewayConfig };
export const gatewayMode = (): "live" | "test" => (gatewayConfig() ? "live" : "test");
export const testPaymentsAllowed = () => process.env.NODE_ENV !== "production" || process.env.ALLOW_TEST_PAYMENTS === "true";

export class PaymentError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function createOrder(userId: string, planId: string): Promise<{ order: Order; checkout: Record<string, unknown> }> {
  const plan = planById(planId);
  if (!plan?.purchasable) throw new PaymentError(400, "plan.invalid", "That plan can't be purchased.");
  const rz = gatewayConfig();
  if (!rz && !testPaymentsAllowed()) throw new PaymentError(503, "payments.unconfigured", "Payments are not configured.");

  const orderId = id("ord");
  let gatewayOrderId = `test_${orderId}`;
  if (rz) {
    const r = await createGatewayOrder(rz, { amount: plan.amount, currency: plan.currency, receipt: orderId, notes: { plan: plan.id, userId } });
    if ("error" in r) throw new PaymentError(502, "payments.gateway", r.error);
    gatewayOrderId = r.id;
  }

  const order: Order = {
    id: orderId,
    userId,
    plan: plan.id,
    amount: plan.amount,
    currency: plan.currency,
    status: "created",
    gateway: rz ? "live" : "test",
    gatewayOrderId,
    createdAt: now(),
  };
  await write((db) => {
    db.orders.push(order);
    logEvent(db, "order.created", { orderId, plan: plan.id, gateway: order.gateway });
  });

  const checkout = rz
    ? { mode: "live", key: rz.keyId, orderId: gatewayOrderId, amount: plan.amount, currency: plan.currency, name: "Onlyn.ify UI", description: `${plan.name} licence` }
    : { mode: "test", url: `/pay/test/${orderId}` };
  return { order, checkout };
}

/**
 * Mark an order paid and issue its licence. Idempotent: the browser callback and
 * the webhook can both arrive, in any order, and only one licence is created.
 */
export async function fulfilOrder(match: { orderId?: string; gatewayOrderId?: string }, paymentId: string, source: string): Promise<{ order: Order; licence: Licence }> {
  return write((db) => {
    const order = db.orders.find((o) => (match.orderId ? o.id === match.orderId : o.gatewayOrderId === match.gatewayOrderId));
    if (!order) throw new PaymentError(404, "order.not_found", "Order not found.");
    const existing = order.licenceKey && db.licences.find((l) => l.key === order.licenceKey);
    if (order.status === "paid" && existing) return { order, licence: existing };

    const plan = planById(order.plan)!;
    const licence: Licence = { key: generateLicenceKey(), userId: order.userId, plan: plan.id, seats: plan.seats, orderId: order.id, createdAt: now(), downloads: 0 };
    db.licences.push(licence);
    order.status = "paid";
    order.paymentId = paymentId;
    order.paidAt = now();
    order.licenceKey = licence.key;
    logEvent(db, "order.paid", { orderId: order.id, paymentId, source });
    return { order, licence };
  });
}

export async function failOrder(orderId: string, reason: string) {
  await write((db) => {
    const o = db.orders.find((x) => x.id === orderId);
    if (o && o.status === "created") {
      o.status = "failed";
      logEvent(db, "order.failed", { orderId, reason });
    }
  });
}

/** Look up an active licence by key (used by the CLI registry API). */
export async function findLicence(key: string) {
  if (!isWellFormedLicence(key)) return null;
  const db = await read();
  const lic = db.licences.find((l) => l.key === key.trim().toUpperCase() && !l.revokedAt);
  if (!lic) return null;
  const user = db.users.find((u) => u.id === lic.userId);
  return user ? { licence: lic, user } : null;
}

export async function recordDownload(key: string, slug: string, framework: string) {
  await write((db) => {
    const lic = db.licences.find((l) => l.key === key);
    if (lic) {
      lic.downloads++;
      lic.lastUsedAt = now();
    }
    logEvent(db, "block.download", { slug, framework, licence: key.slice(0, 8) });
  });
}

/** Highest active plan a user holds: "team" beats "pro" beats "free". */
export const planOfLicences = (plans: string[]): "free" | "pro" | "team" => (plans.includes("team") ? "team" : plans.includes("pro") ? "pro" : "free");

export async function userPlan(userId: string | undefined | null): Promise<"free" | "pro" | "team"> {
  if (!userId) return "free";
  const db = await read();
  return planOfLicences(db.licences.filter((l) => l.userId === userId && !l.revokedAt).map((l) => l.plan));
}

export async function userHasPremium(userId: string | undefined | null) {
  if (!userId) return false;
  const db = await read();
  return db.licences.some((l) => l.userId === userId && !l.revokedAt);
}
