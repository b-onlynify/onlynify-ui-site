import { NextResponse } from "next/server";

export const json = (body: unknown, status = 200, headers?: HeadersInit) => NextResponse.json(body, { status, headers });
export const error = (status: number, code: string, message: string) => json({ code, message }, status);

/** Reject cross-site state-changing requests (cookies are SameSite=Lax, this is defence in depth). */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return req.headers.get("sec-fetch-site") !== "cross-site";
  try {
    return new URL(origin).host === (req.headers.get("x-forwarded-host") ?? req.headers.get("host"));
  } catch {
    return false;
  }
}

/** Small fixed-window limiter per key (IP + route). In-memory: one instance only. */
const buckets = (globalThis as unknown as { __onlRate?: Map<string, { n: number; reset: number }> }).__onlRate ??= new Map();
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const t = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < t) {
    buckets.set(key, { n: 1, reset: t + windowMs });
    return true;
  }
  b.n++;
  return b.n <= limit;
}

export const clientIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";

export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T | null> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as T) : null;
  } catch {
    return null;
  }
}
