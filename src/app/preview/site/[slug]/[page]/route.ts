import { fillPlaceholders } from "@/lib/placeholder.ts";
import { siteBySlug, sitePageHtml, variantOf } from "@/lib/sites.ts";
import { decodeTheme, themeAttrs, themeCss } from "@/lib/theme.ts";

/**
 * Standalone, themed document for one page of a site template (shown in an iframe).
 * Previews are public, like any live website; source code only goes to licence holders.
 * ?variant=<id> shows a ready-made variation (its copy on every page, theme and layout);
 * ?theme=<encoded> applies a theme for the preview; ?mode=dark|light forces the colour scheme.
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string; page: string }> }) {
  const { slug, page } = await params;
  const site = siteBySlug(slug);
  if (!site || !site.pages.some((p) => p.slug === page)) return new Response("Not found", { status: 404 });
  const url = new URL(req.url);
  const variant = variantOf(site, url.searchParams.get("variant"));
  const theme = decodeTheme(url.searchParams.get("theme")) ?? variant.theme;
  const mode = url.searchParams.get("mode");
  const thumb = url.searchParams.has("thumb");
  const keep = new URLSearchParams();
  for (const k of ["variant", "theme", "mode"]) if (url.searchParams.get(k)) keep.set(k, url.searchParams.get(k)!);
  const qs = keep.toString() ? `?${keep}` : "";
  const body = sitePageHtml(slug, page, (p) => `/preview/site/${slug}/${p}${qs}`, variant.id);
  const attrs = { ...themeAttrs(theme), ...(mode === "dark" || mode === "light" ? { "data-theme": mode } : {}) };
  const html = `<!doctype html>
<html lang="en" ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(" ")}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${site.pages.find((p) => p.slug === page)!.title} · ${variant.id === "original" ? site.title : `${variant.name} · ${variant.tagline}`}</title>
<link rel="stylesheet" href="/ui/onlynify-ui.css">
<style>${themeCss(theme).replace(/<\//g, "<\\/")}</style>
<script src="/ui/onlynify-ui.js" data-manual></script>
<script>Onlynify.init({ restore: false });</script>
${thumb ? "<style>html{overflow:hidden}*{animation:none!important;transition:none!important}</style>" : ""}
</head>
<body>
${fillPlaceholders(body)}
</body>
</html>`;
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=120", "X-Frame-Options": "SAMEORIGIN", "X-Robots-Tag": "noindex" },
  });
}
