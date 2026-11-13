import { FRAMEWORKS, type Framework } from "@/lib/convert.ts";
import { error, json } from "@/lib/http.ts";
import { recordDownload } from "@/lib/payments.ts";
import { requirePro } from "@/lib/pro.ts";
import { canCustomise, planAllows, proBySlug, proFiles, themeForPlan } from "@/lib/pro-components.ts";
import { logEvent, read, write } from "@/lib/store.ts";
import { decodeTheme, needsPro, normalizeTheme } from "@/lib/theme.ts";

/**
 * Pro component source: GET /api/pro/<slug>?framework=react&theme=<encoded>|&themeId=<saved id>
 * Needs a Pro or Team licence (signed in, or `Authorization: Bearer <licence>` from the CLI).
 * Team-tier components need a Team licence. Pro gets brand + style presets in the code;
 * Team gets the full custom theme (colours, radius, font, density).
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = proBySlug(slug);
  if (!meta) return error(404, "pro.not_found", `No Pro component named "${slug}".`);
  const url = new URL(req.url);
  const fw = (url.searchParams.get("framework") ?? "html") as Framework;
  if (!FRAMEWORKS.includes(fw)) return error(400, "framework.invalid", `Framework must be one of ${FRAMEWORKS.join(", ")}.`);

  const who = await requirePro(req, "pro");
  if (who instanceof Response) return who;
  if (!planAllows(who.plan, meta.tier)) return error(402, "licence.team_required", `"${meta.title}" is a Team component. Upgrade to Team to get its source.`);

  let theme = decodeTheme(url.searchParams.get("theme"));
  const themeId = url.searchParams.get("themeId");
  if (themeId) {
    const saved = (await read()).themes.find((t) => t.id === themeId && t.userId === who.userId);
    if (!saved) return error(404, "theme.not_found", "That saved theme doesn't exist.");
    theme = normalizeTheme(saved.theme);
  }
  const applied = themeForPlan(who.plan, theme);
  const reduced = Boolean(theme && needsPro(theme) && !canCustomise(who.plan));

  const files = proFiles(slug, fw, applied).map(({ path, content }) => ({ path, content }));
  if (who.licenceKey) await recordDownload(who.licenceKey, `pro:${slug}`, fw);
  else if (!url.searchParams.has("view")) await write((db) => logEvent(db, "block.download", { slug: `pro:${slug}`, framework: fw, userId: who.userId }));
  return json(
    { slug, title: meta.title, tier: meta.tier, plan: who.plan, framework: fw, customised: canCustomise(who.plan), themeReduced: reduced, files },
    200,
    { "Cache-Control": "private, no-store" },
  );
}
