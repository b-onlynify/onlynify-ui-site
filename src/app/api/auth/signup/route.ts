import { createSession, newUserId } from "@/lib/auth.ts";
import { hashPassword } from "@/lib/crypto.ts";
import { clientIp, error, json, rateLimit, readJson, sameOrigin } from "@/lib/http.ts";
import { logEvent, now, write } from "@/lib/store.ts";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  if (!sameOrigin(req)) return error(403, "csrf", "Cross-site request blocked.");
  if (!rateLimit(`signup:${clientIp(req)}`, 10, 60 * 60_000)) return error(429, "rate_limited", "Too many sign-ups from this network. Try again later.");
  const body = await readJson<{ name?: unknown; email?: unknown; password?: unknown }>(req);
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 80) : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase().slice(0, 160) : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!name) return error(400, "name.required", "Enter your name.");
  if (!EMAIL.test(email)) return error(400, "email.invalid", "Enter a valid email address.");
  if (password.length < 8 || password.length > 200) return error(400, "password.weak", "Use a password of at least 8 characters.");

  const passHash = hashPassword(password);
  const result = await write((db) => {
    if (db.users.some((u) => u.email === email)) return null;
    const user = { id: newUserId(), email, name, passHash, createdAt: now() };
    db.users.push(user);
    logEvent(db, "user.signup", { userId: user.id });
    return user;
  });
  if (!result) return error(409, "email.taken", "An account with this email already exists. Sign in instead.");
  await createSession(result.id);
  return json({ ok: true }, 201);
}
