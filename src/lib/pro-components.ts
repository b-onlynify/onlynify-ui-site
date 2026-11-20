import { readFileSync } from "node:fs";
import { join } from "node:path";
import { resolvePlaceholders, toFramework, type CodeFile, type Framework } from "./convert.ts";
import { freeSubset, themeAttrs, themeCss, type Theme } from "./theme.ts";

/**
 * Pro components: the "full" versions of the free kit components (registry/pro/<slug>.html +
 * registry/pro/pro.css). The free MIT kit is the basic version of every component; these are
 * Pro-only. Previews are public; source only goes to licence holders (see /api/pro/<slug>).
 *
 * Tiers ("pro type"):
 *   pro  — every Pro component and chart, code in HTML/React/Vue/Angular, brand + style presets
 *   team — also the Team-only components (marked tier "team") and fully customised code
 *          (any colour, radius, font, density) baked into the download
 */
export type Plan = "free" | "pro" | "team";
export type ProTier = "pro" | "team";
export type ProMeta = {
  slug: string;
  title: string;
  category: string;
  tier: ProTier;
  height: number;
  components: string[];
  description: string;
  chart?: boolean;
};

const PLAN_RANK: Record<Plan, number> = { free: 0, pro: 1, team: 2 };
export const planAllows = (plan: Plan, tier: ProTier) => PLAN_RANK[plan] >= PLAN_RANK[tier];
/** Team licences get the whole theme in code; Pro gets brand + style presets. */
export const canCustomise = (plan: Plan) => plan === "team";
export const themeForPlan = (plan: Plan, theme: Theme | null): Theme | null => (!theme ? null : canCustomise(plan) ? theme : freeSubset(theme));

// Read from disk (not a JSON import) so this module also runs under plain Node for tests.
const registry = (...p: string[]) => join(process.cwd(), "registry", ...p);
export const PRO_COMPONENTS: ProMeta[] = JSON.parse(readFileSync(registry("pro.json"), "utf8"));
export const PRO_CATEGORIES = Array.from(new Set(PRO_COMPONENTS.map((p) => p.category)));
export const proBySlug = (slug: string) => PRO_COMPONENTS.find((p) => p.slug === slug);
/** Pro versions of a catalogue component, e.g. "Button" → [pro-buttons]. */
export const proForComponent = (name: string) => PRO_COMPONENTS.filter((p) => p.components.includes(name));

const ICONS = JSON.parse(readFileSync(registry("icons.json"), "utf8")) as Record<string, { attrs: string; body: string }>;
const expandIcons = (html: string) =>
  html.replace(/<svg data-icon="([\w-]+)"([^>]*)><\/svg>/g, (all, name: string, extra: string) => {
    const i = ICONS[name];
    return i ? `<svg${extra} ${i.attrs} aria-hidden="true">${i.body}</svg>` : all;
  });

let cssCache: string | null = null;
/** The Pro stylesheet. Server-only: it is part of the licensed source. */
export function proCss(): string {
  if (cssCache === null || process.env.NODE_ENV !== "production") cssCache = readFileSync(registry("pro", "pro.css"), "utf8");
  return cssCache;
}

/** Component markup with icons inlined. Premium: only ever read on the server. */
export function proHtml(slug: string): string {
  if (!/^[a-z0-9-]+$/.test(slug) || !proBySlug(slug)) throw new Error("unknown pro component");
  return expandIcons(readFileSync(registry("pro", `${slug}.html`), "utf8")).trim();
}

/** Source files for one framework: the component, pro.css, theme.css (when themed) and a README. */
export function proFiles(slug: string, framework: Framework, theme?: Theme | null): CodeFile[] {
  const meta = proBySlug(slug)!;
  const body = resolvePlaceholders(proHtml(slug));
  const attrs = theme ? Object.entries(themeAttrs(theme)).map(([k, v]) => `${k}="${v}"`).join(" ") : "";
  const files: CodeFile[] = [];
  if (framework === "html") {
    files.push({
      path: `${slug}/index.html`,
      language: "html",
      content: `<!doctype html>\n<html lang="en"${attrs ? ` ${attrs}` : ""}>\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${meta.title} · Onlyn.ify UI Pro</title>\n<link rel="stylesheet" href="./onlynify-ui/onlynify-ui.css">\n<link rel="stylesheet" href="./pro.css">\n${theme ? `<link rel="stylesheet" href="./theme.css">\n` : ""}<script src="./onlynify-ui/onlynify-ui.js" defer></script>\n</head>\n<body>\n${body}\n</body>\n</html>\n`,
    });
  } else {
    for (const f of toFramework(body, framework, slug, { title: `${meta.title} (Pro)` })) files.push({ ...f, path: `${slug}/${f.path}` });
  }
  files.push({ path: `${slug}/pro.css`, language: "css", content: proCss() });
  if (theme) files.push({ path: `${slug}/theme.css`, language: "css", content: themeCss(theme) });
  files.push({
    path: `${slug}/README.md`,
    language: "markdown",
    content: `# ${meta.title} · Onlyn.ify UI Pro\n\n${meta.description}\n\n1. Load \`onlynify-ui.css\` (free kit), then \`pro.css\`${theme ? ", then `theme.css`" : ""}.\n${attrs ? `2. Add to your <html> element: \`${attrs}\`\n` : ""}3. Call \`init()\` from \`onlynify-ui\` once on the client${meta.chart || body.includes("<onl-chart") ? " (charts render through the <onl-chart> web component)" : " (tabs, menus and other interactive parts)"}.\n\nAll colours come from the kit tokens, so dark mode and brand presets work automatically.\nLicensed under the Onlyn.ify UI Pro licence${meta.tier === "team" ? " (Team)" : ""}: use in your products, don't redistribute the source.\n`,
  });
  return files;
}
