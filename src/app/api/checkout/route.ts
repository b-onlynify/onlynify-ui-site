import { currentUser } from "@/lib/auth.ts";
import { error, json, rateLimit, readJson, sameOrigin } from "@/lib/http.ts";
import { createOrder, PaymentError } from "@/lib/payments.ts";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return error(403, "csrf", "Cross-site request blocked.");
  const user = await currentUser();
  if (!user) return error(401, "auth.required", "Sign in to buy a licence.");
  if (!rateLimit(`checkout:${user.id}`, 10, 10 * 60_000)) return error(429, "rate_limited", "Too many checkout attempts. Try again in a few minutes.");
  const body = await readJson<{ plan?: unknown }>(req);
  try {
    const { order, checkout } = await createOrder(user.id, String(body?.plan ?? ""));
    return json({ orderId: order.id, checkout }, 201);
  } catch (e) {
    if (e instanceof PaymentError) return error(e.status, e.code, e.message);
    console.error("checkout failed", e);
    return error(500, "checkout.failed", "Could not start checkout.");
  }
}
