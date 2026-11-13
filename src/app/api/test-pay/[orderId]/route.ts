import { currentUser } from "@/lib/auth.ts";
import { error, json, readJson, sameOrigin } from "@/lib/http.ts";
import { failOrder, fulfilOrder, testPaymentsAllowed } from "@/lib/payments.ts";
import { id, read } from "@/lib/store.ts";

/** Built-in test gateway. Disabled in production unless ALLOW_TEST_PAYMENTS=true. */
export async function POST(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  if (!testPaymentsAllowed()) return error(404, "not_found", "Not found.");
  if (!sameOrigin(req)) return error(403, "csrf", "Cross-site request blocked.");
  const user = await currentUser();
  if (!user) return error(401, "auth.required", "Sign in first.");
  const { orderId } = await params;
  const order = (await read()).orders.find((o) => o.id === orderId);
  if (!order || order.userId !== user.id || order.gateway !== "test") return error(404, "order.not_found", "Order not found.");
  const body = await readJson<{ outcome?: string }>(req);
  if (body?.outcome === "fail") {
    await failOrder(order.id, "test.simulated_failure");
    return json({ ok: true, status: "failed" });
  }
  const { licence } = await fulfilOrder({ orderId: order.id }, id("pay_test"), "test-gateway");
  return json({ ok: true, status: "paid", plan: licence.plan });
}
