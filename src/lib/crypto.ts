/** Pure crypto helpers (no Next.js imports, so node:test can load them directly). */
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const N = 16384;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 32, { N, r: 8, p: 1 });
  return `scrypt$${N}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [alg, n, salt, hash] = stored.split("$");
  if (alg !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const actual = scryptSync(password, Buffer.from(salt, "base64"), expected.length, { N: Number(n), r: 8, p: 1 });
  return timingSafeEqual(expected, actual);
}

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");

/** Constant-time comparison of two hex/ascii strings. */
export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export const hmacHex = (secret: string, payload: string | Buffer) => createHmac("sha256", secret).update(payload).digest("hex");

/** Checkout signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
export const verifyCheckoutSignature = (orderId: string, paymentId: string, signature: string, secret: string) =>
  safeEqual(hmacHex(secret, `${orderId}|${paymentId}`), signature);

/** Webhook signature: HMAC_SHA256(raw body, webhook secret), sent in a request header. */
export const verifyWebhookSignature = (rawBody: string, signature: string, secret: string) => safeEqual(hmacHex(secret, rawBody), signature);

/* ------------------------------------------------------------------ licence keys */
// Crockford base32 without I, L, O, U: easy to read aloud and type.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** ONL-XXXX-XXXX-XXXX-XXXX where the last group is a checksum of the first three. */
export function generateLicenceKey(): string {
  const bytes = randomBytes(12);
  const body = Array.from(bytes, (b) => ALPHABET[b % 32]).join("");
  const groups = [body.slice(0, 4), body.slice(4, 8), body.slice(8, 12)];
  return `ONL-${groups.join("-")}-${checksum(groups.join(""))}`;
}

function checksum(s: string): string {
  const h = createHash("sha256").update("onlynify-ui:" + s).digest();
  return Array.from(h.subarray(0, 4), (b) => ALPHABET[b % 32]).join("");
}

/** Cheap format + checksum check before touching the database. */
export function isWellFormedLicence(key: string): boolean {
  const m = /^ONL-([0-9A-HJKMNP-TV-Z]{4})-([0-9A-HJKMNP-TV-Z]{4})-([0-9A-HJKMNP-TV-Z]{4})-([0-9A-HJKMNP-TV-Z]{4})$/.exec(key.trim().toUpperCase());
  return !!m && checksum(m[1] + m[2] + m[3]) === m[4];
}

export const maskLicence = (key: string) => key.replace(/^(ONL-[^-]+)-[^-]+-[^-]+/, "$1-••••-••••");
