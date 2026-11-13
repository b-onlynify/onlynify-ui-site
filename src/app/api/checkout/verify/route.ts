import { currentUser } from "@/lib/auth.ts";
import { verifyCheckoutSignature } from "@/lib/crypto.ts";
import { error, json, readJson, sameOrigin } from "@/lib/http.ts";
import { readCheckoutResult } from "@/lib/gateway.ts";
import { fulfilOrder, gatewayConfig, PaymentError } from "@/lib/payments.ts";
import { read } from "@/lib/store.ts";

/** Called by the hosted checkout's success handler in the browser. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return error(403, "csrf", "Cross-site request blocked.");
  const user = await currentUser();
  if (!user) return error(401, "auth.required", "Sign in again to finish your purchase.");
  const rz = gatewayConfig();
  if (!rz) return error(400, "payments.test_mode", "The live payment gateway is not configured.");
  const { orderId, paymentId, signature } = readCheckoutResult(await readJson(req));
  if (!orderId || !paymentId || !signature || !verifyCheckoutSignature(orderId, paymentId, signature, rz.secret)) {
    return error(400, "payment.signature", "We couldn't verify this payment. If money was taken, it will be confirmed automatically within a few minutes.");
  }
  const order = (await read()).orders.find((o) => o.gatewayOrderId === orderId);
  if (!order || order.userId !== user.id) return error(404, "order.not_found", "Order not found.");
  try {
    const { licence } = await fulfilOrder({ gatewayOrderId: orderId }, paymentId, "checkout");
    return json({ ok: true, plan: licence.plan });
  } catch (e) {
    if (e instanceof PaymentError) return error(e.status, e.code, e.message);
    throw e;
  }
}
