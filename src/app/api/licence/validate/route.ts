import { clientIp, error, json, rateLimit } from "@/lib/http.ts";
import { findLicence } from "@/lib/payments.ts";

/** Used by `npx onlynify-ui login <key>`. */
export async function GET(req: Request) {
  if (!rateLimit(`licence:${clientIp(req)}`, 30, 15 * 60_000)) return error(429, "rate_limited", "Too many attempts.");
  const auth = req.headers.get("authorization") ?? "";
  const key = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const found = key ? await findLicence(key) : null;
  if (!found) return error(403, "licence.invalid", "This licence key is not valid or has been revoked.");
  const masked = found.user.email.replace(/^(.).*(@.*)$/, "$1•••$2");
  return json({ ok: true, plan: found.licence.plan, seats: found.licence.seats, email: masked }, 200, { "Cache-Control": "no-store" });
}
