import { randomToken } from "./crypto.ts";

/**
 * "Continue with Google" (OpenID Connect authorization-code flow) without extra dependencies.
 *
 * The ID token is taken straight from Google's token endpoint over TLS in exchange for our client secret, so per
 * OpenID Connect Core §3.1.3.7 the TLS connection authenticates the issuer and the token's signature check can
 * be skipped. Every other claim is still checked: issuer, audience, expiry, nonce and a verified email.
 */
export const GOOGLE_STATE_COOKIE = "onl_google_state";
const AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN = "https://oauth2.googleapis.com/token";

const cfg = () => ({ id: process.env.GOOGLE_CLIENT_ID ?? "", secret: process.env.GOOGLE_CLIENT_SECRET ?? "", site: (process.env.SITE_URL ?? "http://localhost:3600").replace(/\/$/, "") });
export const googleEnabled = () => Boolean(cfg().id && cfg().secret);
const redirectUri = () => `${cfg().site}/api/auth/google/callback`;

/** Authorization URL plus the value to keep in the state cookie (state.nonce.next). */
export function startUrl(next: string) {
  const state = randomToken();
  const nonce = randomToken();
  const q = new URLSearchParams({ client_id: cfg().id, redirect_uri: redirectUri(), response_type: "code", scope: "openid email profile", state, nonce, prompt: "select_account" });
  return { url: `${AUTH}?${q}`, cookie: [state, nonce, encodeURIComponent(next)].join(".") };
}

export type GoogleProfile = { email: string; name: string };

/** Exchanges the code and validates the ID token claims. Throws an error code string on any problem. */
export async function finish(code: string, nonce: string): Promise<GoogleProfile> {
  const res = await fetch(TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: cfg().id, client_secret: cfg().secret, redirect_uri: redirectUri(), grant_type: "authorization_code" }),
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await res.json().catch(() => ({}))) as { id_token?: string };
  if (!res.ok || !body.id_token) throw "google_failed";
  const part = body.id_token.split(".")[1];
  if (!part) throw "google_failed";
  const c = JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as Record<string, unknown>;
  const issOk = c.iss === "https://accounts.google.com" || c.iss === "accounts.google.com";
  const audOk = c.aud === cfg().id || (Array.isArray(c.aud) && c.aud.includes(cfg().id));
  if (!issOk || !audOk || typeof c.exp !== "number" || c.exp * 1000 < Date.now()) throw "google_failed";
  if (c.nonce !== nonce) throw "google_state";
  if (c.email_verified !== true || typeof c.email !== "string") throw "google_unverified";
  return { email: c.email.toLowerCase(), name: typeof c.name === "string" && c.name.trim() ? c.name.trim().slice(0, 80) : c.email.split("@")[0] };
}
