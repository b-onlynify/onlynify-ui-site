import { fillPlaceholders } from "@/lib/placeholder.ts";
import { proBySlug, proCss, proHtml } from "@/lib/pro-components.ts";
import { decodeTheme, themeAttrs, themeCss } from "@/lib/theme.ts";

/**
 * Standalone document for one Pro component (shown in an iframe). Previews are public, like any
 * live website; the copyable source is only delivered to licence holders via /api/pro/<slug>.
 * ?theme=<encoded> applies a theme for the preview; ?mode=dark|light forces the colour scheme.
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = proBySlug(slug);
  if (!meta) return new Response("Not found", { status: 404 });
  const url = new URL(req.url);
  const theme = decodeTheme(url.searchParams.get("theme"));
  const mode = url.searchParams.get("mode");
  const thumb = url.searchParams.has("thumb");
  const attrs = { ...(theme ? themeAttrs(theme) : {}), ...(mode === "dark" || mode === "light" ? { "data-theme": mode } : {}) };
  const html = `<!doctype html>
<html lang="en" ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(" ")}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${meta.title} · Onlyn.ify UI Pro</title>
<link rel="stylesheet" href="/ui/onlynify-ui.css">
<style>${proCss().replace(/<\//g, "<\\/")}</style>
${theme ? `<style>${themeCss(theme).replace(/<\//g, "<\\/")}</style>` : ""}
<style>body{margin:0;background:var(--onl-bg)}</style>
<script src="/ui/onlynify-ui.js" data-manual></script>
<script>Onlynify.init({ restore: false });</script>
${thumb ? "<style>html{overflow:hidden}*{animation:none!important;transition:none!important}</style>" : ""}
</head>
<body>
${fillPlaceholders(proHtml(slug))}
</body>
</html>`;
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=120", "X-Robots-Tag": "noindex" },
  });
}
