import { createSession } from "@/lib/auth.ts";
import { hashPassword, verifyPassword } from "@/lib/crypto.ts";
import { clientIp, error, json, rateLimit, readJson, sameOrigin } from "@/lib/http.ts";
import { read } from "@/lib/store.ts";

// Compared against when the email is unknown, so response time doesn't reveal accounts.
const DUMMY = hashPassword("onlynify-ui-timing-guard");

export async function POST(req: Request) {
  if (!sameOrigin(req)) return error(403, "csrf", "Cross-site request blocked.");
  const body = await readJson<{ email?: unknown; password?: unknown }>(req);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!rateLimit(`login:${clientIp(req)}`, 20, 15 * 60_000) || !rateLimit(`login:${email}`, 8, 15 * 60_000)) {
    return error(429, "rate_limited", "Too many attempts. Wait 15 minutes and try again.");
  }
  const user = (await read()).users.find((u) => u.email === email);
  const ok = verifyPassword(password, user?.passHash ?? DUMMY) && !!user;
  if (!ok || !user) return error(401, "auth.invalid", "Email or password is incorrect.");
  await createSession(user.id);
  return json({ ok: true });
}
