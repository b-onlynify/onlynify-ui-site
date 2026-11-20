import { fillPlaceholders } from "@/lib/placeholder.ts";
import { blockHtml } from "@/lib/block-source.ts";
import { blockBySlug } from "@/lib/registry.ts";

/**
 * Standalone document for a block, rendered in an iframe. Premium blocks can be
 * previewed by anyone (like any live website); their source code is only
 * delivered to licence holders through /blocks/<slug> and /api/registry.
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const block = blockBySlug(slug);
  if (!block) return new Response("Not found", { status: 404 });
  const url = new URL(req.url);
  const theme = url.searchParams.get("theme");
  const brand = url.searchParams.get("brand");
  const thumb = url.searchParams.has("thumb");
  const attrs = [theme === "dark" || theme === "light" ? `data-theme="${theme}"` : "", brand && /^[a-z]+$/.test(brand) ? `data-brand="${brand}"` : ""].filter(Boolean).join(" ");
  const html = `<!doctype html>
<html lang="en" ${attrs}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${block.title} · Onlyn.ify UI</title>
<link rel="stylesheet" href="/ui/onlynify-ui.css">
<script src="/ui/onlynify-ui.js" data-manual></script>
<script>Onlynify.init({ restore: false });</script>
${thumb ? "<style>html{overflow:hidden}*{animation:none!important;transition:none!important}</style>" : ""}
</head>
<body>
${fillPlaceholders(blockHtml(slug))}
</body>
</html>`;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "X-Frame-Options": "SAMEORIGIN",
      "X-Robots-Tag": "noindex",
    },
  });
}
