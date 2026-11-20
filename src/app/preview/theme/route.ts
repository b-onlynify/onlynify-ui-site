import { fillPlaceholders } from "@/lib/placeholder.ts";
import { blockHtml } from "@/lib/block-source.ts";
import { DEFAULT_THEME, decodeTheme, themeAttrs, themeCss } from "@/lib/theme.ts";

const SHOWCASE = ["stats-01", "contact-01", "pricing-01", "testimonials-01", "faq-01"];

/** Theme preview: a few real blocks rendered with the theme from ?theme=…&mode=light|dark. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const theme = decodeTheme(url.searchParams.get("theme")) ?? DEFAULT_THEME;
  const mode = url.searchParams.get("mode");
  const attrs = { ...themeAttrs(theme), ...(mode === "dark" || mode === "light" ? { "data-theme": mode } : {}) };
  const html = `<!doctype html>
<html lang="en" ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(" ")}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Theme preview · Onlyn.ify UI</title>
<link rel="stylesheet" href="/ui/onlynify-ui.css">
<style>${themeCss(theme).replace(/<\//g, "<\\/")}</style>
<script src="/ui/onlynify-ui.js" data-manual></script>
<script>Onlynify.init({ restore: false });</script>
</head>
<body class="onl-bg-mesh">
${SHOWCASE.map((s) => fillPlaceholders(blockHtml(s))).join("\n")}
</body>
</html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=60", "X-Frame-Options": "SAMEORIGIN", "X-Robots-Tag": "noindex" } });
}
