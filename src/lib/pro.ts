import { currentUser } from "./auth.ts";
import { clientIp, error, rateLimit } from "./http.ts";
import { findLicence, planOfLicences, userPlan } from "./payments.ts";

/**
 * Who is asking for premium source: a CLI with `Authorization: Bearer <licence>`, or a signed-in
 * Pro/Team user. Returns an error Response when neither applies. `plan` is the licence type
 * (the key's own plan for the CLI, the best active licence for a signed-in user).
 */
export async function requirePro(req: Request, scope: string): Promise<{ userId: string | null; licenceKey: string | null; plan: "pro" | "team" } | Response> {
  if (!rateLimit(`${scope}:${clientIp(req)}`, 120, 60 * 60_000)) return error(429, "rate_limited", "Too many requests. Try again later.");
  const auth = req.headers.get("authorization") ?? "";
  const key = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (key) {
    const found = await findLicence(key);
    if (!found) return error(403, "licence.invalid", "This licence key is not valid or has been revoked.");
    return { userId: found.user.id, licenceKey: found.licence.key, plan: planOfLicences([found.licence.plan]) === "team" ? "team" : "pro" };
  }
  const user = await currentUser();
  if (!user) return error(401, "auth.required", "Sign in with a Pro or Team account.");
  const plan = await userPlan(user.id);
  if (plan === "free") return error(402, "licence.required", "This needs a Pro or Team licence.");
  return { userId: user.id, licenceKey: null, plan };
}
