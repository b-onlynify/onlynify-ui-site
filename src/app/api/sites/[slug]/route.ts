import { FRAMEWORKS, type Framework } from "@/lib/convert.ts";
import { error, json } from "@/lib/http.ts";
import { recordDownload } from "@/lib/payments.ts";
import { requirePro } from "@/lib/pro.ts";
import { siteBySlug, siteFiles, variantOf } from "@/lib/sites.ts";
import { logEvent, read, write } from "@/lib/store.ts";
import { decodeTheme, normalizeTheme } from "@/lib/theme.ts";

/**
 * Site template source: GET /api/sites/<slug>?framework=react&variant=<id>&theme=<encoded>|&themeId=<saved id>
 * Every site is Pro: needs a signed-in Pro/Team user or `Authorization: Bearer <licence>`.
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = siteBySlug(slug);
  if (!site) return error(404, "site.not_found", `No site named "${slug}".`);
  const url = new URL(req.url);
  const fw = (url.searchParams.get("framework") ?? "html") as Framework;
  if (!FRAMEWORKS.includes(fw)) return error(400, "framework.invalid", `Framework must be one of ${FRAMEWORKS.join(", ")}.`);

  const who = await requirePro(req, "sites");
  if (who instanceof Response) return who;

  let theme = decodeTheme(url.searchParams.get("theme"));
  const themeId = url.searchParams.get("themeId");
  if (themeId) {
    const saved = (await read()).themes.find((t) => t.id === themeId && t.userId === who.userId);
    if (!saved) return error(404, "theme.not_found", "That saved theme doesn't exist.");
    theme = normalizeTheme(saved.theme);
  }

  const variant = variantOf(site, url.searchParams.get("variant"));
  const files = siteFiles(slug, fw, theme, variant.id).map(({ path, content }) => ({ path, content }));
  if (who.licenceKey) await recordDownload(who.licenceKey, `site:${slug}`, fw);
  else if (!url.searchParams.has("view")) await write((db) => logEvent(db, "block.download", { slug: `site:${slug}`, framework: fw, userId: who.userId }));
  return json({ slug, title: site.title, variant: variant.id, premium: true, framework: fw, files }, 200, { "Cache-Control": "private, no-store" });
}
