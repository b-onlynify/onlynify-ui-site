import { verifyWebhookSignature } from "@/lib/crypto.ts";
import { error, json } from "@/lib/http.ts";
import { WEBHOOK_SIGNATURE_HEADER } from "@/lib/gateway.ts";
import { failOrder, fulfilOrder, gatewayConfig, PaymentError } from "@/lib/payments.ts";
import { read } from "@/lib/store.ts";

/**
 * Payment gateway webhook. Register https://ui.onlynify.com/api/webhooks/payments in the
 * gateway dashboard for the events payment.captured, order.paid and payment.failed. This is the source of
 * truth if the buyer closes the tab before the browser callback runs.
 */
export async function POST(req: Request) {
  const secret = gatewayConfig()?.webhookSecret;
  if (!secret) return error(503, "webhook.unconfigured", "PAYMENT_GATEWAY_WEBHOOK_SECRET is not set.");
  const raw = await req.text();
  const sig = req.headers.get(WEBHOOK_SIGNATURE_HEADER) ?? "";
  if (!sig || !verifyWebhookSignature(raw, sig, secret)) return error(401, "webhook.signature", "Invalid signature.");

  let event: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string; error_description?: string } } } };
  try {
    event = JSON.parse(raw);
  } catch {
    return error(400, "webhook.body", "Invalid JSON.");
  }
  const payment = event.payload?.payment?.entity;
  const gatewayOrderId = payment?.order_id;
  if (!gatewayOrderId || !payment?.id) return json({ ok: true, ignored: true });

  try {
    if (event.event === "payment.captured" || event.event === "order.paid") {
      await fulfilOrder({ gatewayOrderId }, payment.id, `webhook:${event.event}`);
    } else if (event.event === "payment.failed") {
      const order = (await read()).orders.find((o) => o.gatewayOrderId === gatewayOrderId);
      if (order) await failOrder(order.id, payment.error_description ?? "payment.failed");
    }
  } catch (e) {
    // Unknown orders belong to another integration on the same gateway account: acknowledge them.
    if (e instanceof PaymentError && e.status === 404) return json({ ok: true, ignored: true });
    throw e;
  }
  return json({ ok: true });
}
