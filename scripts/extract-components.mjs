// Builds registry/components.json from the onlynify-ui style guide (single source of truth).
// Inlines sprite icons (<use href="#i-x">) so every snippet is self-contained.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, "../../onlynify-ui/docs/index.html"), "utf8");

// sprite symbols
const symbols = {};
for (const m of html.matchAll(/<symbol id="i-([\w-]+)"([^>]*)>([\s\S]*?)<\/symbol>/g)) symbols[m[1]] = { attrs: m[2].trim(), body: m[3] };
const inlineIcons = (s) =>
  s.replace(/<svg([^>]*)><use href="#i-([\w-]+)"\/><\/svg>/g, (all, attrs, name) => {
    const sym = symbols[name];
    if (!sym) return all;
    return `<svg${attrs} ${sym.attrs} aria-hidden="true">${sym.body}</svg>`;
  });

/** Return the inner HTML of the balanced <div> starting at index `start`. */
function innerDiv(src, start) {
  const open = src.indexOf(">", start) + 1;
  const re = /<div\b|<\/div>/g;
  re.lastIndex = open;
  let depth = 1, m;
  while ((m = re.exec(src))) {
    depth += m[0] === "</div>" ? -1 : 1;
    if (depth === 0) return src.slice(open, m.index);
  }
  throw new Error("unbalanced div");
}
const strip = (s) => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();

const SKIP = new Set(["overview", "all-components", "pro", "foundations", "icons", "grid", "frameworks"]); // icons and grid have their own /docs pages; the site has its own component index and /pro
const ORDER = { selection: "Inputs", menus: "Overlays", content: "Display", datatable: "Data", messaging: "Patterns", direction: "Foundations", inputs: "Inputs", marketing: "Marketing", apps: "Patterns", styles: "Foundations", layouts: "Foundations", buttons: "Actions", badges: "Display", cards: "Display", charts: "Data", forms: "Inputs", feedback: "Feedback", overlays: "Feedback", navigation: "Navigation", data: "Data", media: "Display", commerce: "Patterns", admin: "Patterns" };
const out = [];
const sections = [...html.matchAll(/<section class="doc-section" id="([\w-]+)">/g)];
sections.forEach((s, i) => {
  const id = s[1];
  if (SKIP.has(id)) return;
  const body = html.slice(s.index, sections[i + 1]?.index ?? html.indexOf("</main>"));
  const title = strip(body.match(/<h2 class="onl-h1">([\s\S]*?)<\/h2>/)[1]);
  const description = strip(body.match(/<\/h2>\s*<p>([\s\S]*?)<\/p>/)?.[1] ?? "");
  const demos = [];
  const re = /<div class="doc-demo"( data-demo)?>\s*<h3>([\s\S]*?)<\/h3>\s*(?:<p>([\s\S]*?)<\/p>\s*)?<div class="doc-preview([^"]*)"/g;
  let m;
  while ((m = re.exec(body))) {
    const inner = innerDiv(body, m.index + m[0].length - 1);
    if (inner.includes("doc-live-chart")) continue;
    demos.push({ title: strip(m[2]), description: m[3] ? strip(m[3]) : undefined, muted: m[4].includes("--bg"), html: inlineIcons(inner).replace(/^\n+|\s+$/g, "") });
  }
  out.push({ slug: id, title, group: ORDER[id] ?? "Components", description, demos });
});
writeFileSync(join(here, "../registry/icons.json"), JSON.stringify(symbols, null, 2) + "\n");
writeFileSync(join(here, "../registry/components.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`registry/components.json — ${out.length} components, ${out.reduce((a, c) => a + c.demos.length, 0)} demos, ${Object.keys(symbols).length} icons`);
