// Writes every block and demo as React code into gencheck/ so `tsc` can typecheck the converter output.
import { mkdirSync } from "node:fs";
mkdirSync("gencheck", { recursive: true });
import { readFileSync, writeFileSync } from "node:fs";
import { toFramework } from "../src/lib/convert.ts";
const blocks = JSON.parse(readFileSync("registry/blocks.json", "utf8")) as { slug: string }[];
const comps = JSON.parse(readFileSync("registry/components.json", "utf8")) as { slug: string; demos: { html: string }[] }[];
const icons = JSON.parse(readFileSync("registry/icons.json", "utf8")) as Record<string, { attrs: string; body: string }>;
const expand = (h: string) => h.replace(/<svg data-icon="([\w-]+)"([^>]*)><\/svg>/g, (_a, n: string, x: string) => `<svg${x} ${icons[n].attrs} aria-hidden="true">${icons[n].body}</svg>`);
let n = 0;
for (const b of blocks) for (const f of toFramework(expand(readFileSync(`registry/blocks/${b.slug}.html`, "utf8")), "react", b.slug)) (writeFileSync(`gencheck/${f.path}`, `import "onlynify-ui";\n${f.content}`), n++);
for (const c of comps) c.demos.forEach((d, i) => toFramework(d.html, "react", `${c.slug}-${i + 1}`).forEach((f) => (writeFileSync(`gencheck/${f.path}`, `import "onlynify-ui";\n${f.content}`), n++)));
console.log("generated", n);
// site templates (React output of every page)
const { SITES, siteFiles } = await import("../src/lib/sites.ts");
for (const s of SITES) for (const f of siteFiles(s.slug, "react")) if (f.path.endsWith(".tsx")) (writeFileSync(`gencheck/${f.path.split("/").pop()}`, `import "onlynify-ui";\n${f.content}`), n++);
console.log("generated with sites", n);
