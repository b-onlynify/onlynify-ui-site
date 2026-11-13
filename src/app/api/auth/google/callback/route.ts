import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSession, newUserId } from "@/lib/auth.ts";
import { hashPassword, randomToken } from "@/lib/crypto.ts";
import { finish, GOOGLE_STATE_COOKIE } from "@/lib/google.ts";
import { logEvent, now, write } from "@/lib/store.ts";

/**
 * Google sends the visitor back here. Signs in the account with that (verified) email, or creates one: sign-up
 * on this site is open, so Google is just another way to register. Accounts created this way get a random
 * password they don't know; they keep signing in with Google.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const jar = await cookies();
  const saved = jar.get(GOOGLE_STATE_COOKIE)?.value ?? "";
  jar.delete({ name: GOOGLE_STATE_COOKIE, path: "/api/auth/google" });
  const fail = (code: string) => NextResponse.redirect(new URL(`/login?error=${code}`, url));
  const [state, nonce, ...rest] = saved.split(".");
  const next = rest.join("."); // the return path may itself contain dots
  if (url.searchParams.get("error")) return fail("google_cancelled");
  if (!state || state !== url.searchParams.get("state") || !url.searchParams.get("code")) return fail("google_state");
  try {
    const profile = await finish(url.searchParams.get("code")!, nonce);
    const { userId, created } = await write((db) => {
      const found = db.users.find((u) => u.email === profile.email);
      if (found) return { userId: found.id, created: false };
      const user = { id: newUserId(), email: profile.email, name: profile.name, passHash: hashPassword(randomToken()), createdAt: now() };
      db.users.push(user);
      logEvent(db, "signup", { userId: user.id, via: "google" });
      return { userId: user.id, created: true };
    });
    await createSession(userId);
    const dest = decodeURIComponent(next || "/account");
    const safe = dest.startsWith("/") && !dest.startsWith("//") ? dest : "/account";
    return NextResponse.redirect(new URL(created && safe === "/account" ? "/account?joined=1" : safe, url));
  } catch (e) {
    return fail(typeof e === "string" ? e : "google_failed");
  }
}
