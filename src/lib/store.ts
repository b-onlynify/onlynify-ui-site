/**
 * Tiny JSON-file database (data/db.json). Writes are serialised in-process and
 * written atomically (tmp file + rename). Fine for one server instance; swap
 * this module for MongoDB/MySQL when you run several instances. The rest of
 * the app only uses read() and write().
 */
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export type User = { id: string; email: string; name: string; passHash: string; createdAt: string };
export type Session = { tokenHash: string; userId: string; expiresAt: string; createdAt: string };
export type OrderStatus = "created" | "paid" | "failed";
export type Order = {
  id: string;
  userId: string;
  plan: string;
  amount: number; // paise
  currency: string;
  status: OrderStatus;
  gateway: "live" | "test";
  gatewayOrderId: string;
  paymentId?: string;
  licenceKey?: string;
  createdAt: string;
  paidAt?: string;
};
export type Licence = { key: string; userId: string; plan: string; seats: number; orderId: string; createdAt: string; revokedAt?: string; lastUsedAt?: string; downloads: number };
export type Event = { id: string; type: string; at: string; data: Record<string, unknown> };
/** A Pro user's saved theme (validated with normalizeTheme before it is stored). */
export type SavedTheme = { id: string; userId: string; name: string; theme: Record<string, unknown>; createdAt: string; updatedAt: string };
export type DB = { users: User[]; sessions: Session[]; orders: Order[]; licences: Licence[]; events: Event[]; themes: SavedTheme[] };

const empty = (): DB => ({ users: [], sessions: [], orders: [], licences: [], events: [], themes: [] });
const dir = () => process.env.DATA_DIR || join(process.cwd(), "data");
const file = () => join(dir(), "db.json");

// One queue per process, shared across Next.js module instances.
const g = globalThis as unknown as { __onlStoreQueue?: Promise<unknown> };

async function load(): Promise<DB> {
  try {
    return { ...empty(), ...JSON.parse(await fs.readFile(file(), "utf8")) };
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return empty();
    throw e;
  }
}

async function persist(db: DB) {
  await fs.mkdir(dir(), { recursive: true });
  const tmp = `${file()}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2));
  await fs.rename(tmp, file());
}

export async function read(): Promise<DB> {
  await (g.__onlStoreQueue ?? Promise.resolve()).catch(() => {});
  return load();
}

/** Run `fn` against the latest data and save the result. Calls are serialised. */
export function write<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  const run = (g.__onlStoreQueue ?? Promise.resolve()).catch(() => {}).then(async () => {
    const db = await load();
    const result = await fn(db);
    await persist(db);
    return result;
  });
  g.__onlStoreQueue = run;
  return run;
}

export const id = (prefix: string) => `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
export const now = () => new Date().toISOString();

export function logEvent(db: DB, type: string, data: Record<string, unknown>) {
  db.events.push({ id: id("evt"), type, at: now(), data });
  if (db.events.length > 5000) db.events.splice(0, db.events.length - 5000);
}
