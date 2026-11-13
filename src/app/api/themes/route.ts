import { currentUser } from "@/lib/auth.ts";
import { error, json, readJson, sameOrigin } from "@/lib/http.ts";
import { requirePro } from "@/lib/pro.ts";
import { id, logEvent, now, read, write } from "@/lib/store.ts";
import { normalizeTheme } from "@/lib/theme.ts";

const MAX_THEMES = 30;

/** The signed-in user's saved themes. */
export async function GET() {
  const user = await currentUser();
  if (!user) return json({ themes: [] });
  const themes = (await read()).themes.filter((t) => t.userId === user.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return json({ themes: themes.map(({ id: tid, name, theme, updatedAt }) => ({ id: tid, name, theme, updatedAt })) }, 200, { "Cache-Control": "private, no-store" });
}

/** Save (or update by name) a theme. Pro / Team only. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return error(403, "csrf", "Cross-site request refused.");
  const who = await requirePro(req, "themes");
  if (who instanceof Response) return who;
  const body = await readJson<{ name?: string; theme?: unknown }>(req);
  const theme = normalizeTheme(body?.theme);
  const name = String(body?.name ?? theme?.name ?? "").trim().slice(0, 40);
  if (!theme) return error(422, "theme.invalid", "That isn't a valid theme.");
  if (!name) return error(422, "theme.name_required", "Give the theme a name.");
  const saved = await write((db) => {
    const mine = db.themes.filter((t) => t.userId === who.userId);
    const existing = mine.find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      existing.theme = { ...theme, name };
      existing.updatedAt = now();
      return existing;
    }
    if (mine.length >= MAX_THEMES) return null;
    const t = { id: id("thm"), userId: who.userId!, name, theme: { ...theme, name }, createdAt: now(), updatedAt: now() };
    db.themes.push(t);
    logEvent(db, "theme.saved", { userId: who.userId, name });
    return t;
  });
  if (!saved) return error(409, "theme.limit", `You can keep up to ${MAX_THEMES} themes. Delete one first.`);
  return json({ id: saved.id, name: saved.name, theme: saved.theme, updatedAt: saved.updatedAt }, 201);
}
