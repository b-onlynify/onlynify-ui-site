/**
 * Payment gateway adapter (server side).
 *
 * This is the only server module that knows the provider's endpoints and field
 * names. To switch providers, change this file and src/lib/gateway-client.ts;
 * the rest of the app only uses gatewayConfig(), createGatewayOrder() and
 * readCheckoutResult().
 *
 * Configuration (see .env.example):
 *   PAYMENT_GATEWAY_KEY_ID, PAYMENT_GATEWAY_KEY_SECRET, PAYMENT_GATEWAY_WEBHOOK_SECRET
 */
const ORDERS_URL = "https://api.razorpay.com/v1/orders";
const FIELDS = { orderId: "razorpay_order_id", paymentId: "razorpay_payment_id", signature: "razorpay_signature" } as const;

/** HTTP header carrying the webhook signature. */
export const WEBHOOK_SIGNATURE_HEADER = "x-razorpay-signature";

export type GatewayConfig = { keyId: string; secret: string; webhookSecret?: string };

/** Live gateway credentials, or null when the built-in test gateway should be used. */
export function gatewayConfig(): GatewayConfig | null {
  const keyId = process.env.PAYMENT_GATEWAY_KEY_ID;
  const secret = process.env.PAYMENT_GATEWAY_KEY_SECRET;
  return keyId && secret ? { keyId, secret, webhookSecret: process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET } : null;
}

/** Create an order at the gateway. Returns its id, or an error message. */
export async function createGatewayOrder(
  cfg: GatewayConfig,
  input: { amount: number; currency: string; receipt: string; notes: Record<string, string> },
): Promise<{ id: string } | { error: string }> {
  const res = await fetch(ORDERS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Basic " + Buffer.from(`${cfg.keyId}:${cfg.secret}`).toString("base64") },
    body: JSON.stringify(input),
  });
  const body = (await res.json().catch(() => ({}))) as { id?: string; error?: { description?: string } };
  if (!res.ok || !body.id) return { error: body.error?.description ?? "The payment gateway is unavailable. Try again shortly." };
  return { id: body.id };
}

/** Pull the order id, payment id and signature out of the browser checkout callback. */
export function readCheckoutResult(body: Record<string, unknown> | null) {
  return {
    orderId: String(body?.[FIELDS.orderId] ?? ""),
    paymentId: String(body?.[FIELDS.paymentId] ?? ""),
    signature: String(body?.[FIELDS.signature] ?? ""),
  };
}
