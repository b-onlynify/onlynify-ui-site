// node --test tests/pro-components.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const pro = await import("../src/lib/pro-components.ts");
const { CATALOG } = await import("../src/lib/catalog.ts");
const { FRAMEWORKS } = await import("../src/lib/convert.ts");
const { planOfLicences } = await import("../src/lib/payments.ts");

const names = new Set(CATALOG.map((c: { name: string }) => c.name));

test("every Pro component has source, valid metadata and real catalogue links", () => {
  const slugs = new Set<string>();
  for (const p of pro.PRO_COMPONENTS) {
    assert.match(p.slug, /^pro-[a-z0-9-]+$/, p.slug);
    assert.ok(!slugs.has(p.slug), `duplicate ${p.slug}`);
    slugs.add(p.slug);
    assert.ok(["pro", "team"].includes(p.tier), p.slug);
    assert.ok(p.height >= 300 && p.height <= 1600, `${p.slug} height`);
    assert.ok(p.description.length > 20, `${p.slug} description`);
    assert.ok(existsSync(`registry/pro/${p.slug}.html`), `${p.slug}.html missing`);
    for (const n of p.components) assert.ok(names.has(n), `${p.slug}: "${n}" is not in the catalogue`);
  }
  assert.ok(pro.PRO_COMPONENTS.length >= 56);
  assert.ok(pro.PRO_COMPONENTS.filter((p) => p.chart).length >= 15);
  assert.ok(pro.PRO_COMPONENTS.filter((p) => p.tier === "team").length >= 7);
});

test("every Pro item converts to every framework without leftover HTML-only attributes", () => {
  for (const p of pro.PRO_COMPONENTS) {
    for (const fw of FRAMEWORKS) {
      const files = pro.proFiles(p.slug, fw, null);
      assert.ok(files.length >= 3, `${p.slug} ${fw}`);
      if (fw === "react") {
        const jsx = files.find((f) => /\.[jt]sx$/.test(f.path));
        assert.ok(jsx, `${p.slug}: no JSX file`);
        assert.ok(!/\s(class|for)=|\sstyle="/.test(jsx.content), `${p.slug}: HTML attribute left in JSX`);
      }
    }
  }
});

test("Pro markup names no third-party brands outside icon artwork", () => {
  const brands = /whatsapp|google|facebook|instagram|twitter|razorpay|stripe|paytm|phonepe|visa|mastercard|rupay/i;
  for (const p of pro.PRO_COMPONENTS) {
    const text = pro.proHtml(p.slug).replace(/<svg[\s\S]*?<\/svg>/g, "");
    assert.ok(!brands.test(text), `${p.slug}: names a third-party brand`);
  }
});

test("Pro covers every catalogue component except the style presets page", () => {
  const covered = new Set(pro.PRO_COMPONENTS.flatMap((p) => p.components));
  const missing = [...names].filter((n) => !covered.has(n) && n !== "Style Presets");
  assert.deepEqual(missing, []);
});

test("Pro markup: icons resolve, no scripts or inline handlers, only onlp-/onl- classes", () => {
  for (const p of pro.PRO_COMPONENTS) {
    const html = pro.proHtml(p.slug);
    assert.ok(!/data-icon="/.test(html), `${p.slug}: unresolved icon`);
    assert.ok(!/<script/i.test(html), `${p.slug}: script tag`);
    assert.ok(!/\son[a-z]+=/i.test(html), `${p.slug}: inline handler`);
    for (const m of html.matchAll(/class="([^"]+)"/g)) {
      for (const cls of m[1].split(/\s+/)) assert.match(cls, /^(onlp?-|site-)/, `${p.slug}: stray class "${cls}"`);
    }
  }
});

test("every onlp- class used in markup is defined in pro.css (or is a kit class)", () => {
  const css = readFileSync("registry/pro/pro.css", "utf8");
  const defined = new Set([...css.matchAll(/\.(onlp-[a-z0-9_-]+)/g)].map((m) => m[1]));
  const missing = new Set<string>();
  for (const p of pro.PRO_COMPONENTS) {
    for (const m of pro.proHtml(p.slug).matchAll(/class="([^"]+)"/g)) for (const cls of m[1].split(/\s+/)) if (cls.startsWith("onlp-") && !defined.has(cls)) missing.add(`${p.slug}:${cls}`);
  }
  assert.deepEqual([...missing], []);
});

test("licence rules: Pro gets pro tier + presets, Team gets everything + custom theme", () => {
  assert.equal(pro.planAllows("free", "pro"), false);
  assert.equal(pro.planAllows("pro", "pro"), true);
  assert.equal(pro.planAllows("pro", "team"), false);
  assert.equal(pro.planAllows("team", "team"), true);
  assert.equal(planOfLicences([]), "free");
  assert.equal(planOfLicences(["pro"]), "pro");
  assert.equal(planOfLicences(["pro", "team"]), "team");
  const custom = { brand: "#123456", style: "glass" as const, radius: 4, accent: "#ff0000" };
  assert.deepEqual(pro.themeForPlan("pro", custom), { brand: "onlynify", style: "glass" });
  assert.deepEqual(pro.themeForPlan("team", custom), custom);
  assert.equal(pro.themeForPlan("pro", null), null);
});

test("proFiles: every framework ships the component, pro.css and README; theme.css only when themed", () => {
  for (const fw of FRAMEWORKS) {
    const files = pro.proFiles("pro-buttons", fw, null);
    const paths = files.map((f) => f.path);
    assert.ok(paths.includes("pro-buttons/pro.css"), fw);
    assert.ok(paths.includes("pro-buttons/README.md"), fw);
    assert.ok(!paths.includes("pro-buttons/theme.css"), fw);
    assert.ok(files.length >= 3, fw);
  }
  const themed = pro.proFiles("pro-chart-revenue", "react", { brand: "#123456", style: "soft" });
  const css = themed.find((f) => f.path.endsWith("theme.css"));
  assert.ok(css && css.content.includes("--onl-brand-light: #123456"));
  assert.ok(themed.find((f) => f.path.endsWith("README.md"))!.content.includes("data-style=\"soft\""));
});

test("proForComponent maps catalogue names to Pro versions", () => {
  assert.deepEqual(pro.proForComponent("Kanban").map((p) => p.slug), ["pro-kanban"]);
  assert.ok(pro.proForComponent("Chart").length >= 10);
  assert.deepEqual(pro.proForComponent("Nope"), []);
});

test("style guide catalogue (onlynify-ui/docs/catalog.json) has every component with its own demos, and no Pro source", async () => {
  const { buildStyleguideCatalog } = await import("../scripts/export-styleguide-catalog.ts");
  const fresh = buildStyleguideCatalog();
  const onDisk = JSON.parse(readFileSync("../onlynify-ui/docs/catalog.json", "utf8"));
  assert.deepEqual(onDisk, fresh, "run npm run sync to re-export the style guide catalogue");
  const { CATALOG: all, CHART_TYPES } = await import("../src/lib/catalog.ts");
  assert.deepEqual(fresh.components.map((c) => c.name), all.map((c) => c.name), "every catalogue component is in the style guide");
  assert.deepEqual(fresh.charts, CHART_TYPES);
  const sections = new Set([...readFileSync("../onlynify-ui/docs/index.html", "utf8").matchAll(/<section class="doc-section" id="([a-z-]+)"/g)].map((m) => m[1]));
  for (const c of fresh.components) {
    assert.ok(sections.has(c.page), `${c.name} links to a style guide section (#${c.page})`);
    assert.ok(c.demos.length > 0 && c.demos.every((d) => d.html.trim().startsWith("<")), `${c.name} has its own live demo`);
    for (const slug of c.pro) assert.ok(fresh.pro.some((p) => p.slug === slug), `${c.name} → ${slug} exists`);
  }
  assert.equal(new Set(fresh.components.map((c) => c.slug)).size, fresh.components.length, "component slugs are unique");
  // Pro entries carry metadata only: never the premium markup from registry/pro/<slug>.html.
  for (const p of fresh.pro) assert.deepEqual(Object.keys(p).sort(), ["category", "components", "description", "height", "slug", "tier", "title"]);
  const proSnippet = readFileSync("registry/pro/pro-buttons.html", "utf8").trim().slice(0, 120);
  assert.ok(!JSON.stringify(onDisk).includes(JSON.stringify(proSnippet).slice(1, -1)), "no Pro source in the style guide");
});
