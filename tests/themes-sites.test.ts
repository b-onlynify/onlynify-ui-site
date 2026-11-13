// node --test tests/themes-sites.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const theme = await import("../src/lib/theme.ts");
const sites = await import("../src/lib/sites.ts");
const { FRAMEWORKS } = await import("../src/lib/convert.ts");

test("normalizeTheme accepts presets and hex, rejects junk, clamps values", () => {
  assert.equal(theme.normalizeTheme(null), null);
  assert.equal(theme.normalizeTheme({ brand: "javascript:alert(1)" }), null);
  assert.equal(theme.normalizeTheme({ brand: "#12345" }), null);
  assert.deepEqual(theme.normalizeTheme({ brand: "violet", style: "nope" }), { brand: "violet", style: "modern" });
  const t = theme.normalizeTheme({ brand: "#AABBCC", style: "glass", radius: 99, font: "comic", density: "compact", accent: "#00ff00", name: "  Mine  " })!;
  assert.deepEqual(t, { brand: "#aabbcc", style: "glass", radius: 24, density: "compact", accent: "#00ff00", name: "Mine" });
});

test("Pro gate: presets are free, custom settings need Pro", () => {
  assert.equal(theme.needsPro({ brand: "emerald", style: "soft" }), false);
  assert.equal(theme.needsPro({ brand: "#123456", style: "modern" }), true);
  assert.equal(theme.needsPro({ brand: "teal", style: "modern", radius: 4 }), true);
  assert.equal(theme.needsPro({ brand: "teal", style: "modern", font: "serif" }), true);
  assert.deepEqual(theme.freeSubset({ brand: "#123456", style: "bold", accent: "#ffffff" }), { brand: "onlynify", style: "bold" });
});

test("themeCss / themeAttrs", () => {
  assert.deepEqual(theme.themeAttrs({ brand: "rose", style: "soft", density: "compact" }), { "data-brand": "rose", "data-style": "soft", "data-density": "compact" });
  assert.deepEqual(theme.themeAttrs({ brand: "onlynify", style: "modern" }), {});
  assert.match(theme.themeCss({ brand: "rose", style: "soft" }), /Presets only/);
  const css = theme.themeCss({ brand: "#0b7a75", style: "modern", radius: 12, font: "serif", accent: "#f59e0b" });
  assert.match(css, /--onl-brand-light: #0b7a75/);
  assert.match(css, /--onl-radius: 12px/);
  assert.match(css, /--onl-radius-lg: 17px/);
  assert.match(css, /--onl-accent-light: #f59e0b/);
  assert.match(css, /--onl-font: Charter/);
  assert.ok(!/[<>]/.test(css), "no markup in CSS output");
});

test("theme URL encoding round-trips and rejects tampering", () => {
  const t = { brand: "#0b7a75", style: "glass" as const, radius: 14, name: "Teal glass ✨" };
  assert.deepEqual(theme.decodeTheme(theme.encodeTheme(t)), t);
  assert.equal(theme.decodeTheme("not-base64!!"), null);
  assert.equal(theme.decodeTheme(Buffer.from(JSON.stringify({ brand: "red" })).toString("base64")), null);
  assert.equal(theme.decodeTheme("x".repeat(5000)), null);
});

test("contrast ratio", () => {
  assert.ok(Math.abs(theme.contrast("#000000", "#ffffff") - 21) < 0.01);
  assert.ok(theme.contrast("#1449a0", "#ffffff") > 4.5);
  assert.ok(theme.contrast("#fde047", "#ffffff") < 3);
});

test("every site has its pages and partials, valid theme and no brand-name leaks", () => {
  assert.ok(sites.SITES.length >= 5 && sites.SITES.length <= 10);
  for (const s of sites.SITES) {
    assert.ok(s.theme, `${s.slug} theme`);
    for (const f of ["_nav", "_footer", ...s.pages.map((p) => p.slug)]) assert.ok(existsSync(`registry/sites/${s.slug}/${f}.html`), `${s.slug}/${f}`);
    for (const p of s.pages) {
      const html = sites.sitePageHtml(s.slug, p.slug, (x) => `/x/${x}`);
      assert.ok(!html.includes("{{page:"), `${s.slug}/${p.slug} unresolved link`);
      assert.ok(!/data-icon=/.test(html), `${s.slug}/${p.slug} unexpanded icon`);
      assert.match(html, new RegExp(`href="/x/${p.slug}" aria-current="page"`));
      assert.ok(!/\b(dribbble|instagram|linkedin|facebook|twitter|youtube|hyrox|razorpay|stripe)\b/i.test(html), `${s.slug}/${p.slug} third-party brand name`);
    }
  }
  assert.throws(() => sites.sitePageHtml("nova", "../../etc", (x) => x));
  assert.throws(() => sites.sitePageHtml("nova", "missing", (x) => x));
});

test("site code generation for every framework includes theme.css and README", () => {
  for (const s of sites.SITES) {
    for (const fw of FRAMEWORKS) {
      const files = sites.siteFiles(s.slug, fw, null);
      assert.ok(files.some((f) => f.path === `${s.slug}/theme.css`));
      assert.ok(files.some((f) => f.path === `${s.slug}/README.md`));
      assert.ok(files.filter((f) => !/theme\.css|README/.test(f.path)).length >= s.pages.length, `${s.slug} ${fw} pages`);
      for (const f of files) assert.ok(!f.content.includes("data-ph="), `${f.path} placeholder left`);
    }
  }
  const html = sites.siteFiles("nova", "html", { brand: "#0b7a75", style: "soft" });
  assert.match(html.find((f) => f.path === "nova/home.html")!.content, /data-style="soft"/);
  assert.match(html.find((f) => f.path === "nova/home.html")!.content, /href="\.\/pricing\.html"/);
  assert.match(html.find((f) => f.path === "nova/theme.css")!.content, /#0b7a75/);
});

test("new blocks are registered and their files exist", () => {
  const blocks = JSON.parse(readFileSync("registry/blocks.json", "utf8")) as { slug: string; premium: boolean }[];
  for (const b of blocks) assert.ok(existsSync(`registry/blocks/${b.slug}.html`), b.slug);
  assert.ok(blocks.length >= 24);
  for (const slug of ["contact-01", "signup-01", "analytics-01", "finance-01", "onboarding-01", "booking-01", "survey-01", "kanban-01"]) assert.ok(blocks.some((b) => b.slug === slug), slug);
});

test("zip writer: valid structure and CRC-32", async () => {
  const { zip, crc32 } = await import("../src/lib/zip.ts");
  assert.equal(crc32(new TextEncoder().encode("123456789")), 0xcbf43926);
  const files = [{ path: "nova/home.html", content: "<h1>Hi ₹</h1>" }, { path: "../evil/theme.css", content: ":root{}" }];
  const z = zip(files);
  const v = new DataView(z.buffer);
  assert.equal(v.getUint32(0, true), 0x04034b50);
  assert.equal(v.getUint32(z.length - 22, true), 0x06054b50);
  assert.equal(v.getUint16(z.length - 22 + 10, true), 2);
  const text = new TextDecoder().decode(z);
  assert.ok(text.includes("nova/home.html") && text.includes("evil/theme.css") && !text.includes("../"));
  // Validate with Python's zipfile (CRC check + read) when Python is installed; Node has no unzip API.
  const { execFileSync } = await import("node:child_process");
  const { mkdtempSync, writeFileSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const dir = mkdtempSync(join(tmpdir(), "onl-zip-"));
  writeFileSync(join(dir, "t.zip"), z);
  try {
    const out = execFileSync("python", ["-c", "import sys,zipfile;z=zipfile.ZipFile(sys.argv[1]);assert z.testzip() is None;print(z.read('nova/home.html').decode())", join(dir, "t.zip")], { encoding: "utf8", env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
    assert.match(out, /<h1>Hi ₹<\/h1>/);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
  }
});

test("component catalogue points at real docs pages", async () => {
  const { CATALOG, CHART_TYPES } = await import("../src/lib/catalog.ts");
  const pages = new Set((JSON.parse(readFileSync("registry/components.json", "utf8")) as { slug: string }[]).map((c) => c.slug));
  for (const c of CATALOG) assert.ok(pages.has(c.page), `${c.name} → ${c.page}`);
  assert.equal(new Set(CATALOG.map((c) => c.name)).size, CATALOG.length);
  assert.ok(CATALOG.length >= 80 && CHART_TYPES.length >= 17);
  for (const must of ["Combobox", "Context Menu", "Data Table", "Date Picker", "Menubar", "Navigation Menu", "Resizable", "Scroll Area", "Sheet", "Typography", "Code Block", "Trace", "Questionnaire"]) assert.ok(CATALOG.some((c) => c.name === must), must);
});

test("layouts: free, normalised, emitted as data-layout and shipped in theme.css", () => {
  assert.deepEqual(theme.normalizeTheme({ brand: "teal", style: "soft", layout: "editorial" }), { brand: "teal", style: "soft", layout: "editorial" });
  assert.deepEqual(theme.normalizeTheme({ brand: "teal", style: "soft", layout: "classic" }), { brand: "teal", style: "soft" });
  assert.deepEqual(theme.normalizeTheme({ brand: "teal", style: "soft", layout: "<x>" }), { brand: "teal", style: "soft" });
  assert.equal(theme.needsPro({ brand: "teal", style: "soft", layout: "minimal" }), false);
  assert.deepEqual(theme.freeSubset({ brand: "#123456", style: "bold", layout: "immersive" }), { brand: "onlynify", style: "bold", layout: "immersive" });
  assert.deepEqual(theme.themeAttrs({ brand: "onlynify", style: "modern", layout: "centered" }), { "data-layout": "centered" });
  // The rules live in the kit; theme.css notes the attribute, and every layout has rules in onlynify-ui.css.
  const kitCss = readFileSync("../onlynify-ui/src/css/layouts.css", "utf8");
  for (const l of theme.LAYOUTS.filter((x: string) => x !== "classic")) {
    assert.match(theme.themeCss({ brand: "rose", style: "soft", layout: l }), new RegExp(`data-layout="${l}"`));
    assert.ok(kitCss.includes(`[data-layout="${l}"]`), `kit ships the ${l} layout`);
  }
  assert.equal(theme.themeCss({ brand: "rose", style: "soft" }).includes("Layout:"), false);
});

test("every site has 3-5 Pro setup variations whose copy matches the template text", () => {
  for (const s of sites.SITES) {
    assert.ok(s.variants.length >= 3 && s.variants.length <= 5, `${s.slug} has ${s.variants.length} variations`);
    assert.equal(s.variants[0].id, "original");
    assert.equal(new Set(s.variants.map((v: { id: string }) => v.id)).size, s.variants.length, `${s.slug} variation ids are unique`);
    const raw = ["_nav", "_footer", ...s.pages.map((p: { slug: string }) => p.slug)].map((f) => readFileSync(`registry/sites/${s.slug}/${f}.html`, "utf8")).join("\n");
    for (const v of s.variants.slice(1)) {
      assert.ok(v.description.length > 40 && v.tagline && v.name, `${s.slug}/${v.id} has a name, tagline and description`);
      assert.ok(Object.keys(v.copy).length >= 6, `${s.slug}/${v.id} rewrites enough copy`);
      for (const k of Object.keys(v.copy)) assert.ok(raw.includes(k), `${s.slug}/${v.id}: "${k.slice(0, 60)}" is in the template`);
    }
  }
});

test("choosing a variation rewrites every page (nav, body, footer) and its theme", () => {
  const s = sites.siteBySlug("nova")!;
  const v = sites.variantOf(s, "ledgerly");
  assert.equal(sites.variantOf(s, "nope").id, "original");
  for (const p of s.pages) {
    const html = sites.sitePageHtml("nova", p.slug, (x: string) => `/${x}`, "ledgerly");
    assert.ok(!html.includes("Nova"), `${p.slug} no longer mentions Nova`);
    assert.ok(html.includes("Ledgerly"), `${p.slug} shows Ledgerly`);
  }
  assert.ok(sites.sitePageHtml("nova", "home", (x: string) => `/${x}`).includes("Nova"), "original unchanged");
  assert.equal(v.theme.layout, "editorial");
  const files = sites.siteFiles("nova", "html", null, "ledgerly");
  assert.match(files.find((f: { path: string }) => f.path.endsWith("home.html"))!.content, /data-layout="editorial"/);
  assert.match(files.find((f: { path: string }) => f.path.endsWith("theme.css"))!.content, /Layout: Editorial/);
  assert.match(files.find((f: { path: string }) => f.path.endsWith("README.md"))!.content, /Ledgerly/);
  // Single pass: replacement text is never rewritten again.
  assert.equal(sites.applyCopy("Nova and Nova Analytics Pvt. Ltd.", { Nova: "Ledgerly", "Nova Analytics Pvt. Ltd.": "Ledgerly Finance Pvt. Ltd." }), "Ledgerly and Ledgerly Finance Pvt. Ltd.");
  assert.equal(sites.applyCopy("a+b (x)", { "a+b": "c", "(x)": "[y]" }), "c [y]");
});
