import { NextResponse } from "next/server";
import { GOOGLE_STATE_COOKIE, googleEnabled, startUrl } from "@/lib/google.ts";
import { clientIp, rateLimit } from "@/lib/http.ts";

/** GET /api/auth/google?next=/account → Google's account chooser. */
export async function GET(req: Request) {
  const site = new URL(req.url);
  if (!googleEnabled()) return NextResponse.redirect(new URL("/login?error=google_not_configured", site));
  if (!rateLimit(`google:${clientIp(req)}`, 30, 15 * 60_000)) return NextResponse.redirect(new URL("/login?error=rate_limited", site));
  const next = site.searchParams.get("next") ?? "/account";
  const { url, cookie } = startUrl(next.startsWith("/") && !next.startsWith("//") ? next.slice(0, 300) : "/account");
  const res = NextResponse.redirect(url);
  // Lax so it comes back on Google's top-level redirect to the callback.
  res.cookies.set(GOOGLE_STATE_COOKIE, cookie, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/api/auth/google", maxAge: 600 });
  return res;
}
