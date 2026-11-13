import { cookies } from "next/headers";
import { randomToken, sha256 } from "./crypto.ts";
import { id, now, read, write, type User } from "./store.ts";

export const SESSION_COOKIE = "onl_session";
const SESSION_DAYS = 30;

export type PublicUser = Pick<User, "id" | "email" | "name">;
export const publicUser = (u: User): PublicUser => ({ id: u.id, email: u.email, name: u.name });

export async function createSession(userId: string) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);
  await write((db) => {
    db.sessions = db.sessions.filter((s) => new Date(s.expiresAt) > new Date());
    db.sessions.push({ tokenHash: sha256(token), userId, expiresAt: expiresAt.toISOString(), createdAt: now() });
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await write((db) => void (db.sessions = db.sessions.filter((s) => s.tokenHash !== sha256(token))));
  jar.delete(SESSION_COOKIE);
}

/** The signed-in user, or null. Safe to call from server components and route handlers. */
export async function currentUser(): Promise<PublicUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = await read();
  const s = db.sessions.find((x) => x.tokenHash === sha256(token));
  if (!s || new Date(s.expiresAt) < new Date()) return null;
  const u = db.users.find((x) => x.id === s.userId);
  return u ? publicUser(u) : null;
}

export const newUserId = () => id("usr");
