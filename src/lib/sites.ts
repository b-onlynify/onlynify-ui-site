import { readFileSync } from "node:fs";
import { join } from "node:path";
import { resolvePlaceholders, toFramework, type CodeFile, type Framework } from "./convert.ts";
import { LAYOUTS, normalizeTheme, themeAttrs, themeCss, type LayoutName, type Theme } from "./theme.ts";

export type SitePage = { slug: string; title: string; height: number };
/**
 * A ready-made variation of a site template (Pro setup): its own business name, copy on every page,
 * theme and page layout. `copy` maps text in the template to the variation's text; it is applied to the
 * nav, footer and every page, so choosing a variation updates the whole site at once.
 */
export type SiteVariant = { id: string; name: string; tagline: string; description: string; theme: Theme; copy: Record<string, string> };
export type SiteMeta = { slug: string; title: string; industry: string; description: string; theme: Theme; pages: SitePage[]; highlights: string[]; variants: SiteVariant[] };

// Read from disk (not a JSON import) so this module also runs under plain Node for tests.
const registryFile = (name: string) => JSON.parse(readFileSync(join(process.cwd(), "registry", name), "utf8"));
type RawVariant = Omit<SiteVariant, "theme"> & { theme: unknown; layout?: string };
const RAW_VARIANTS = registryFile("site-variants.json") as Record<string, RawVariant[]>;
const toVariant = (v: RawVariant): SiteVariant => {
  const layout = LAYOUTS.includes(v.layout as LayoutName) ? (v.layout as LayoutName) : undefined;
  return { id: v.id, name: v.name, tagline: v.tagline, description: v.description, theme: normalizeTheme({ ...(v.theme as object), layout })!, copy: v.copy ?? {} };
};
export const SITES: SiteMeta[] = (registryFile("sites.json") as Omit<SiteMeta, "variants">[]).map((s) => {
  const theme = normalizeTheme(s.theme)!;
  const variants = (RAW_VARIANTS[s.slug] ?? []).map(toVariant);
  // Every site has at least its original as the first variation.
  if (!variants.length || variants[0].id !== "original") variants.unshift({ id: "original", name: s.title.split(" · ")[0], tagline: s.industry, description: s.description, theme, copy: {} });
  return { ...s, theme, variants };
});

/** The variation with this id, else the original. */
export const variantOf = (site: SiteMeta, id: string | null | undefined) => site.variants.find((v) => v.id === id) ?? site.variants[0];

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Rewrite the template's text for a variation in one pass (longest phrases first, so brand names don't break phrases). */
export function applyCopy(html: string, copy: Record<string, string>): string {
  const keys = Object.keys(copy).filter(Boolean).sort((a, b) => b.length - a.length);
  if (!keys.length) return html;
  return html.replace(new RegExp(keys.map(escapeRe).join("|"), "g"), (m) => copy[m] ?? m);
}

const ICONS = registryFile("icons.json") as Record<string, { attrs: string; body: string }>;
const expandIcons = (html: string) =>
  html.replace(/<svg data-icon="([\w-]+)"([^>]*)><\/svg>/g, (all, name: string, extra: string) => {
    const i = ICONS[name];
    return i ? `<svg${extra} ${i.attrs} aria-hidden="true">${i.body}</svg>` : all;
  });
export const siteBySlug = (slug: string) => SITES.find((s) => s.slug === slug);

const read = (slug: string, file: string) => readFileSync(join(process.cwd(), "registry/sites", slug, `${file}.html`), "utf8");

/**
 * One page of a site: shared nav + page body + shared footer.
 * Links written as href="{{page:pricing}}" are resolved by `linkFor`; the matching nav link gets aria-current.
 */
export function sitePageHtml(slug: string, page: string, linkFor: (page: string) => string, variantId?: string | null): string {
  const site = siteBySlug(slug);
  if (!site || !/^[a-z0-9-]+$/.test(page) || !site.pages.some((p) => p.slug === page)) throw new Error("unknown site page");
  const html = applyCopy([read(slug, "_nav"), read(slug, page), read(slug, "_footer")].join("\n"), variantOf(site, variantId).copy);
  return expandIcons(html)
    .replace(/href="\{\{page:([a-z0-9-]+)\}\}"/g, (_, p: string) => `href="${linkFor(p)}"${p === page ? ' aria-current="page"' : ""}`)
    .trim();
}

const pascal = (s: string) => s.replace(/(^|-)([a-z0-9])/g, (_, __, c: string) => c.toUpperCase());

/** Files for a whole site in one framework, themed. Premium: only call for licence holders. */
export function siteFiles(slug: string, framework: Framework, theme?: Theme | null, variantId?: string | null): CodeFile[] {
  const site = siteBySlug(slug)!;
  const variant = variantOf(site, variantId);
  const t = theme ?? variant.theme;
  const name = variant.id === "original" ? site.title.split(" · ")[0] : variant.name;
  const attrs = Object.entries(themeAttrs(t)).map(([k, v]) => `${k}="${v}"`).join(" ");
  const ext = framework === "react" ? "" : framework === "vue" ? ".vue" : framework === "angular" ? ".component" : ".html";
  const link = (p: string) => (framework === "html" ? `./${p}.html` : `/${p === "home" ? "" : p}`);
  const files: CodeFile[] = [];
  for (const p of site.pages) {
    const body = resolvePlaceholders(sitePageHtml(slug, p.slug, link, variant.id));
    if (framework === "html") {
      files.push({
        path: `${slug}/${p.slug}.html`,
        language: "html",
        content: `<!doctype html>\n<html lang="en"${attrs ? ` ${attrs}` : ""}>\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${p.title} · ${name}</title>\n<link rel="stylesheet" href="./onlynify-ui/onlynify-ui.css">\n<link rel="stylesheet" href="./theme.css">\n<script src="./onlynify-ui/onlynify-ui.js" defer></script>\n</head>\n<body>\n${body}\n</body>\n</html>\n`,
      });
    } else {
      for (const f of toFramework(body, framework, `${slug}-${p.slug}`, { title: `${name} · ${p.title}` })) files.push({ ...f, path: `${slug}/${f.path}` });
    }
  }
  files.push({ path: `${slug}/theme.css`, language: "css", content: themeCss(t) });
  files.push({
    path: `${slug}/README.md`,
    language: "markdown",
    content: `# ${name} · ${variant.tagline}\n\nPremium Onlynify UI site template "${site.title}"${variant.id === "original" ? "" : `, ${variant.name} variation`} (${site.pages.map((p) => p.title).join(", ")}).\n\n1. Load \`onlynify-ui.css\`, then \`theme.css\`${framework === "html" ? " (copy node_modules/onlynify-ui/dist into ./onlynify-ui/)" : ""}.\n${attrs ? `2. Add to your <html> element: \`${attrs}\`\n` : ""}3. Call \`init()\` from \`onlynify-ui\` once on the client (charts, calendar and other interactive parts).\n${framework === "html" ? "" : `\nPages: ${site.pages.map((p) => `${pascal(`${slug}-${p.slug}`)}${ext}`).join(", ")}. Wire them to your router; links point to /, ${site.pages.filter((p) => p.slug !== "home").map((p) => `/${p.slug}`).join(", ")}.\n`}\nImages are placeholders under \`/images\`; replace them with your own.\nLicensed under the Onlynify UI Pro licence.\n`,
  });
  return files;
}
