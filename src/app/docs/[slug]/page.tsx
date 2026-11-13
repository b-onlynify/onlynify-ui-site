import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ICON_ALIASES, ICON_GROUPS, ICON_NAMES, icon } from "onlynify-ui";
import "onlynify-ui/css/flex-layout";
import { CodeBlock } from "@/components/client";
import { IconGallery, type GalleryGroup } from "@/components/icon-gallery";
import { GUIDES } from "@/lib/guides";

export const dynamicParams = false;
export const generateStaticParams = () => GUIDES.map((g) => ({ slug: g.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: GUIDES.find((x) => x.slug === slug)?.title };
}

const Callout = ({ tone = "brand", title, children }: { tone?: "brand" | "warning" | "success"; title: string; children: React.ReactNode }) => (
  <div className={`onl-alert onl-alert--${tone}`}>
    <div className="onl-alert__content">
      <p className="onl-alert__title">{title}</p>
      <div className="onl-alert__body">{children}</div>
    </div>
  </div>
);

function Introduction() {
  return (
    <>
      <p className="onl-lead">
        Onlynify UI is a design system you can drop into any project. It's a stylesheet, a few Web Components and a set of copy-paste blocks. There's nothing to
        learn beyond HTML classes.
      </p>
      <h2>Why it's built this way</h2>
      <ul>
        <li><b>Framework-agnostic.</b> Components are CSS classes driven by ARIA attributes, so Angular, React, Vue and server templates all use the same markup.</li>
        <li><b>Zero dependencies.</b> There's no CSS framework, no icon font and no chart library. The core is small, fast and easy to audit.</li>
        <li><b>Own your code.</b> Blocks are copied into your project, so you can edit them freely.</li>
        <li><b>Themeable per tenant.</b> One attribute switches the brand colour, which suits multi-tenant SaaS.</li>
      </ul>
      <h2>What's free and what's Pro</h2>
      <table>
        <thead><tr><th></th><th>Free (MIT)</th><th>Pro</th></tr></thead>
        <tbody>
          <tr><td>All components, tokens and charts</td><td>✓</td><td>✓</td></tr>
          <tr><td>Code for HTML, React, Vue and Angular</td><td>✓</td><td>✓</td></tr>
          <tr><td>Free blocks (hero, features, pricing, login, sign-up, contact, FAQ, testimonials…)</td><td>✓</td><td>✓</td></tr>
          <tr><td>Brand presets and style presets (modern, soft, glass, sharp, bold)</td><td>✓</td><td>✓</td></tr>
          <tr><td>Premium blocks (analytics, finance, onboarding, booking, kanban, store, checkout…)</td><td>Preview only</td><td>✓</td></tr>
          <tr><td>Site templates (8 multi-page sites)</td><td>Preview only</td><td>✓</td></tr>
          <tr><td>Theme customiser: any colour, accent, radius, font, density, saved themes</td><td>Preview presets</td><td>✓</td></tr>
          <tr><td>CLI download of premium blocks and sites</td><td></td><td>✓</td></tr>
        </tbody>
      </table>
      <div className="onl-row" style={{ marginTop: 20 }}>
        <Link className="onl-btn onl-btn--brand" href="/docs/installation">Install</Link>
        <Link className="onl-btn" href="/docs/components/buttons">Browse components</Link>
      </div>
    </>
  );
}

function Installation() {
  return (
    <>
      <p className="onl-lead">Choose your stack. Every option uses the same CSS and the same <code>init()</code>.</p>
      <h2>npm</h2>
      <CodeBlock code="npm i onlynify-ui" />
      <h2>HTML / CDN</h2>
      <CodeBlock title="index.html" code={`<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/onlynify-ui@1/dist/onlynify-ui.css">\n<script src="https://cdn.jsdelivr.net/npm/onlynify-ui@1/dist/onlynify-ui.js" defer></script>\n\n<button class="onl-btn onl-btn--brand">Save</button>`} />
      <h2>React / Next.js</h2>
      <CodeBlock title="app/layout.tsx" code={`import "onlynify-ui/css";\nimport { themeInitScript } from "onlynify-ui";\nimport { UiInit } from "./ui-init";\n\nexport default function RootLayout({ children }) {\n  return (\n    <html lang="en" suppressHydrationWarning>\n      <head><script dangerouslySetInnerHTML={{ __html: themeInitScript }} /></head>\n      <body><UiInit />{children}</body>\n    </html>\n  );\n}`} />
      <CodeBlock title="app/ui-init.tsx" code={`"use client";\nimport { useEffect } from "react";\nimport { init } from "onlynify-ui";\n\nexport function UiInit() {\n  useEffect(() => init(), []);\n  return null;\n}`} />
      <p>Types for <code>&lt;onl-chart&gt;</code> in JSX ship with the package, so no extra setup is needed.</p>
      <h2>Vue 3</h2>
      <CodeBlock title="vite.config.ts" code={`vue({\n  template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith("onl-") } },\n})`} />
      <CodeBlock title="main.ts" code={`import "onlynify-ui/css";\nimport { init } from "onlynify-ui";\ninit();`} />
      <h2>Angular</h2>
      <CodeBlock title="angular.json" code={`"styles": ["node_modules/onlynify-ui/dist/onlynify-ui.css", "src/styles.css"]`} />
      <CodeBlock title="main.ts" code={`import { init } from "onlynify-ui";\ninit();\n\n// in components that use <onl-chart>\n@Component({ schemas: [CUSTOM_ELEMENTS_SCHEMA], … })`} />
      <h2>React Native</h2>
      <p>CSS doesn't exist on mobile, so use the same tokens as a JavaScript object:</p>
      <CodeBlock code={`import { tokens } from "onlynify-ui/native";\nconst t = tokens(colorScheme, "emerald");\n<View style={{ backgroundColor: t.colors.surface, borderRadius: t.radius.lg }} />`} />
      <Callout title="Two ways to drive interactivity">
        Bind <code>aria-selected</code>, <code>aria-pressed</code>, <code>hidden</code> or a dialog's <code>open</code> from your framework's state and the CSS follows. Or add the
        declarative <code>data-onl-*</code> attributes and let <code>init()</code> handle them.
      </Callout>
    </>
  );
}

function iconGroups(): GalleryGroup[] {
  const aliasesOf: Record<string, string[]> = {};
  for (const [alias, name] of Object.entries(ICON_ALIASES)) (aliasesOf[name] ??= []).push(alias);
  return ICON_GROUPS.map((g) => ({
    id: g.id,
    title: g.title,
    icons: g.icons.map((name) => ({ name, svg: icon(name, "", 22), aliases: aliasesOf[name] ?? [] })),
  }));
}

function Icons() {
  return (
    <>
      <p className="onl-lead">
        {ICON_NAMES.length} lightweight stroke icons in {ICON_GROUPS.length} groups: navigation, arrows, dashboards, education, healthcare, commerce, travel, files, editing, weather,
        food, sports, home, shapes, brands and more. You can also add any other icon set, including solid, multi-colour or brand SVGs.
        They inherit the current text colour. Search by name, pick a group, then click an icon to copy it. How to use them is at the bottom of the page.
      </p>
      <IconGallery groups={iconGroups()} />

      <h2 id="usage">Usage</h2>
      <p>Every icon above works the same way in any framework, with no icon font and no extra package.</p>
      <h3>Web component</h3>
      <p><code>init()</code> registers <code>&lt;onl-icon&gt;</code>. It renders in light DOM, so your CSS colour and classes apply directly.</p>
      <CodeBlock title="HTML · Angular · Vue · React" code={`<onl-icon name="school"></onl-icon>\n<onl-icon name="save" size="sm"></onl-icon>              <!-- xs 12 · sm 16 · md 20 (default) · lg 24 · xl 32 · or px -->\n<onl-icon name="trash" label="Delete invoice"></onl-icon>  <!-- label = announced to screen readers -->\n<onl-icon name="loader" class="onl-icon--spin"></onl-icon>`} />
      <h3>SVG string</h3>
      <p>Works on the server too, because it needs no DOM.</p>
      <CodeBlock title="JavaScript" code={`import { icon } from "onlynify-ui";\n\nel.innerHTML = icon("check", { size: 20, label: "Paid", strokeWidth: 1.75 });\nicon("check", "onl-icon", 20); // older (name, class, size) form still works`} />
      <h3>Sprite and files</h3>
      <CodeBlock title="Sprite / files / CLI" code={`<!-- inline dist/icons/sprite.svg once, or iconSprite({ names: ["home", "mail"] }) for a subset -->\n<svg class="onl-icon"><use href="#i-calendar"/></svg>\n\n<!-- one file per icon -->\nimport schoolUrl from "onlynify-ui/icons/school.svg";\n\n# list, search or export icons offline\nnpx onlynify-ui icons cart\nnpx onlynify-ui icons chevron arrow --out public/icons\nnpx onlynify-ui icons --sprite --out public/icons`} />
      <h3>Your own icons, any type</h3>
      <p>
        <code>registerIcons()</code> accepts outline, solid and multi-colour icons from any icon set or design tool, on any grid size. Registered icons work everywhere the
        built-in ones do: <code>&lt;onl-icon&gt;</code>, <code>icon()</code>, the sprite and the CLI.
      </p>
      <ul>
        <li><strong>stroke</strong>: outline drawn in the current text colour. This is the built-in style and the default.</li>
        <li><strong>fill</strong>: solid shapes filled with the current text colour, for example Material, Heroicons solid, Font Awesome or Bootstrap Icons.</li>
        <li><strong>color</strong>: the icon keeps its own colours, for brand logos, flags and illustrations.</li>
      </ul>
      <CodeBlock title="registerIcons" code={`import { registerIcons } from "onlynify-ui";\n\nregisterIcons({\n  // 24 × 24 outline shapes, the same style as the built-in icons\n  "tenant-logo": '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>',\n\n  // solid icon tinted with the current text colour\n  "home-solid": { body: '<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>', mode: "fill" },\n\n  // any grid size, e.g. Font Awesome's 512 × 512\n  "fa-star": { body: '<path d="M…"/>', viewBox: "0 0 576 512", mode: "fill" },\n\n  // a whole .svg file: viewBox and mode are detected (coloured fills → "color")\n  "partner-logo": '<svg viewBox="0 0 48 48"><path fill="#4285F4" d="M…"/></svg>',\n});\n// <onl-icon name="home-solid"> elements already on the page re-render`} />
      <Callout title="Safe by default">
        Only plain shapes are accepted (path, circle, rect, line, polyline, polygon, ellipse, g and gradients). Scripts, links, <code>&lt;use&gt;</code>, <code>&lt;image&gt;</code>,
        <code>&lt;style&gt;</code> and event handlers are rejected. If one icon in a call is invalid, none of them are registered.
      </Callout>
      <h3>Aliases</h3>
      <p>These short or older names also work, and the search above finds them too.</p>
      <p>
        {Object.entries(ICON_ALIASES).map(([alias, name], i) => (
          <span key={alias}>{i > 0 && " · "}<code>{alias}</code> → <code>{name}</code></span>
        ))}
      </p>
    </>
  );
}

function Theming() {
  return (
    <>
      <p className="onl-lead">Every value is a CSS custom property named <code>--onl-*</code>. Two attributes cover most needs.</p>
      <CodeBlock code={`<html data-theme="dark" data-brand="emerald">   <!-- omit data-theme to follow the OS -->\n<section data-brand="rose">…a tenant preview…</section>`} />
      <h2>Brand presets</h2>
      <p>onlynify · indigo · violet · fuchsia · rose · orange · amber · lime · emerald · teal · sky · slate. Each has a light and a dark variant, and the accent colour used by gradients follows.</p>
      <h2>Style presets</h2>
      <CodeBlock code={`<html data-style="glass" data-density="compact">`} />
      <table>
        <thead><tr><th><code>data-style</code></th><th>Look</th></tr></thead>
        <tbody>
          <tr><td>(none) modern</td><td>Hairline borders, layered soft shadows, 10px radius</td></tr>
          <tr><td>soft</td><td>Rounder, borderless, gentle shadows</td></tr>
          <tr><td>glass</td><td>Translucent cards with backdrop blur</td></tr>
          <tr><td>sharp</td><td>Tight corners, flat, crisp outlines</td></tr>
          <tr><td>bold</td><td>Thick outlines and offset shadows</td></tr>
        </tbody>
      </table>
      <p><code>data-density="compact"</code> or <code>"comfortable"</code> tightens or loosens spacing. Presets work on any element, so one page can preview several tenants.</p>
      <h2>From JavaScript</h2>
      <CodeBlock code={`import { setTheme, toggleTheme, setBrand, setStyle } from "onlynify-ui";\n\nsetStyle("soft");                                // "modern" | "soft" | "glass" | "sharp" | "bold"\nsetTheme("system");                              // "light" | "dark" | "system"\nsetBrand("violet");                              // preset\nsetBrand({ light: "#0b7a75", dark: "#4fd1c5" }); // any tenant colour`} />
      <h2>Override tokens</h2>
      <CodeBlock title="styles.css" code={`:root {\n  --onl-radius: 10px;\n  --onl-font: "Your Brand Font", system-ui, sans-serif;\n  --onl-brand-light: #0b7a75;\n  --onl-brand-dark: #4fd1c5;\n}`} />
      <p>
        The <Link href="/themes">theme builder</Link> previews presets on real blocks for free. With Pro it also sets any brand and accent colour, radius, font and density, saves themes to your account and applies them to <Link href="/sites">site templates</Link> and code downloads.
      </p>
    </>
  );
}

/** Live preview above, copyable source below. */
const Demo = ({ children, code, title }: { children: React.ReactNode; code: string; title?: string }) => (
  <div className="site-demo">
    <div className="site-demo__preview">{children}</div>
    <div className="site-demo__code"><CodeBlock title={title} code={code} /></div>
  </div>
);

const GRID_COLUMNS = `<div class="onl-flexgrid">
  <div class="onl-col-12 onl-col-md-8">12 → md 8</div>
  <div class="onl-col-12 onl-col-md-4">12 → md 4</div>
  <div class="onl-col-6 onl-col-lg-3">6 → lg 3</div>
  <div class="onl-col-6 onl-col-lg-3">6 → lg 3</div>
  <div class="onl-col-6 onl-col-lg-3">6 → lg 3</div>
  <div class="onl-col-6 onl-col-lg-3">6 → lg 3</div>
  <div class="onl-col-sm">auto</div>
  <div class="onl-col-sm">auto</div>
  <div class="onl-col-sm-auto">fits content</div>
</div>`;

const GRID_EXTRAS = `<!-- 2 per row on phones, 4 from md, small gap -->
<div class="onl-flexgrid onl-flexgrid--cols-2 onl-flexgrid--cols-md-4 onl-flexgrid--gap-2">
  <div>1</div><div>2</div><div>3</div><div>4</div>
</div>

<!-- offset -->
<div class="onl-flexgrid">
  <div class="onl-col-md-4 onl-offset-md-4">md: offset 4</div>
</div>

<!-- visual order -->
<div class="onl-flexgrid">
  <div class="onl-col-md-6 onl-order-md-last">First in the markup, last from md</div>
  <div class="onl-col-md-6">Second in the markup</div>
</div>`;

const FLEX_UTILS = `<div class="onl-d-flex onl-flex-column onl-flex-md-row onl-items-md-center onl-justify-md-between onl-gap-3">
  <div>Stacked on phones</div>
  <div>a row from md</div>
  <div class="onl-d-none onl-d-lg-block">Only from lg</div>
</div>`;

const FLEX_LAYOUT = `<div onlFlexLayout="column" onlFlexLayout.gt-sm="row wrap" onlFlexLayoutGap="16px">
  <div onlFlex="100" onlFlex.gt-sm="33">onlFlex.gt-sm="33"</div>
  <div onlFlex="100" onlFlex.gt-sm="33">onlFlex.gt-sm="33"</div>
  <div onlFlex="100" onlFlex.gt-sm="33">onlFlex.gt-sm="33"</div>
  <div onlFlex="100" onlFlex.gt-sm="50">onlFlex.gt-sm="50"</div>
  <div onlFlex="100" onlFlex.gt-sm="50">onlFlex.gt-sm="50"</div>
</div>

<div onlFlexLayout="row" onlFlexLayoutAlign="space-between center" onlFlexLayoutGap="8px">
  <strong>space-between center</strong>
  <span onlHide.xs>hidden on xs</span>
  <span onlHide onlShow.gt-sm>shown from gt-sm</span>
  <button class="onl-btn onl-btn--sm">Action</button>
</div>`;

/** Adds the demo cell style to every child element of the grid / flex containers in a snippet. */
const withCells = (html: string) =>
  html
    .replace(/<!--[\s\S]*?-->\n?/g, "")
    .replace(/<(div|span|strong)((?![^>]*class="onl-flexgrid)(?![^>]*onlFlexLayout=)(?![^>]*onl-d-flex)[^>]*)>/g, (all, tag, attrs: string) =>
      attrs.includes('class="') ? `<${tag}${attrs.replace('class="', 'class="site-cell ')}>` : `<${tag} class="site-cell"${attrs}>`,
    );

function Grid() {
  return (
    <>
      <p className="onl-lead">
        A mobile-first, 12-column flex grid, flexbox utilities and Flex-Layout style attributes. All of it is written in SCSS and ships as plain CSS. Resize the window to watch
        the demos reflow.
      </p>
      <h2>Breakpoints</h2>
      <p>Styles without an infix apply at every size. An infix applies from that breakpoint <b>up</b>, so you write the phone layout first and add to it.</p>
      <table>
        <thead><tr><th>Name</th><th>Infix</th><th>From</th><th>Flex-Layout alias range</th></tr></thead>
        <tbody>
          <tr><td>xs</td><td>(none)</td><td>0</td><td>0–599px</td></tr>
          <tr><td>sm</td><td><code>-sm</code></td><td>600px</td><td>600–959px</td></tr>
          <tr><td>md</td><td><code>-md</code></td><td>960px</td><td>960–1279px</td></tr>
          <tr><td>lg</td><td><code>-lg</code></td><td>1280px</td><td>1280–1919px</td></tr>
          <tr><td>xl</td><td><code>-xl</code></td><td>1920px</td><td>1920px+</td></tr>
        </tbody>
      </table>

      <h2>Flex grid</h2>
      <p>
        Children of <code>.onl-flexgrid</code> stack full width on phones. <code>.onl-col-{"{bp}"}-{"{1–12}"}</code> sets a span from that breakpoint up,{" "}
        <code>.onl-col-{"{bp}"}</code> makes equal columns and <code>.onl-col-{"{bp}"}-auto</code> fits the content. Gutters are <code>gap</code>, and the column maths subtracts it, so
        twelve <code>.onl-col-1</code> fill one row exactly.
      </p>
      <Demo title="HTML" code={GRID_COLUMNS}>
        <div dangerouslySetInnerHTML={{ __html: withCells(GRID_COLUMNS) }} />
      </Demo>
      <h3>Equal columns, offsets and order</h3>
      <Demo title="HTML" code={GRID_EXTRAS}>
        <div className="onl-stack" dangerouslySetInnerHTML={{ __html: withCells(GRID_EXTRAS) }} />
      </Demo>
      <table>
        <thead><tr><th>Class</th><th>What it does</th></tr></thead>
        <tbody>
          <tr><td><code>onl-flexgrid</code></td><td>Wrapping flex row. Set the gutter with <code>--onl-gutter-x</code> and <code>--onl-gutter-y</code> (default <code>--onl-space-4</code>)</td></tr>
          <tr><td><code>onl-col{"{-bp}"}-{"{1–12}"}</code> · <code>onl-col{"{-bp}"}</code> · <code>onl-col{"{-bp}"}-auto</code></td><td>Span, equal width, content width</td></tr>
          <tr><td><code>onl-offset{"{-bp}"}-{"{0–11}"}</code></td><td>Pushes a column right by n columns</td></tr>
          <tr><td><code>onl-order{"{-bp}"}-{"{first, last, 0–6}"}</code></td><td>Visual order</td></tr>
          <tr><td><code>onl-flexgrid--cols{"{-bp}"}-{"{1–6}"}</code></td><td>N equal columns per row</td></tr>
          <tr><td><code>onl-flexgrid--gap{"{-bp}"}-{"{0–12}"}</code> · <code>--gx-*</code> · <code>--gy-*</code></td><td>Gutter from the spacing scale, which follows <code>data-density</code></td></tr>
        </tbody>
      </table>

      <h2>Flex utilities</h2>
      <p>These are responsive and use <code>!important</code>, so they win over component classes.</p>
      <Demo title="HTML" code={FLEX_UTILS}>
        <div dangerouslySetInnerHTML={{ __html: withCells(FLEX_UTILS) }} />
      </Demo>
      <p>
        The utilities are <code>onl-d{"{-bp}"}-*</code>, <code>onl-flex{"{-bp}"}-{"{row, column, wrap, nowrap, fill, 1, none, grow-0, shrink-0…}"}</code>,{" "}
        <code>onl-justify{"{-bp}"}-*</code>, <code>onl-items{"{-bp}"}-*</code>, <code>onl-self{"{-bp}"}-*</code>, <code>onl-content{"{-bp}"}-*</code> and{" "}
        <code>onl-gap{"{-bp}"}-*</code>.
      </p>

      <h2 id="flex-layout">Flex-layout attributes</h2>
      <p>
        These are modelled on the Angular <a href="https://github.com/angular/flex-layout" target="_blank" rel="noreferrer">Flex-Layout</a> plugin, with an <code>onl</code> prefix. They
        are pure CSS, so you don&apos;t need JavaScript or <code>@angular/flex-layout</code>, and they work in plain HTML, Angular templates and Vue. Load the extra stylesheet:
      </p>
      <CodeBlock code={`import "onlynify-ui/css/flex-layout";            // bundlers\n<link rel="stylesheet" href="…/dist/onlynify-flex-layout.css">   <!-- HTML -->\n"styles": ["node_modules/onlynify-ui/dist/onlynify-ui.css", "node_modules/onlynify-ui/dist/onlynify-flex-layout.css"]   // angular.json`} />
      <Demo title="HTML · Angular · Vue" code={FLEX_LAYOUT}>
        <div className="onl-stack" dangerouslySetInnerHTML={{ __html: withCells(FLEX_LAYOUT) }} />
      </Demo>
      <table>
        <thead><tr><th>Flex-Layout plugin</th><th>Onlynify UI</th><th>Values</th></tr></thead>
        <tbody>
          <tr><td><code>fxLayout</code></td><td><code>onlFlexLayout</code></td><td><code>row</code> · <code>column</code> · <code>row-reverse</code> · <code>column-reverse</code>, plus <code>wrap</code> and <code>inline</code></td></tr>
          <tr><td><code>fxLayoutAlign</code></td><td><code>onlFlexLayoutAlign</code></td><td>main axis <code>start center end space-between space-around space-evenly</code>, then cross axis <code>start center end stretch baseline</code></td></tr>
          <tr><td><code>fxLayoutGap</code></td><td><code>onlFlexLayoutGap</code></td><td>Common px, rem and em values. Any other value: <code>style=&quot;--onl-flex-gap: 18px&quot;</code></td></tr>
          <tr><td><code>fxFlex</code></td><td><code>onlFlex</code></td><td>Empty, <code>auto none grow nogrow noshrink initial</code>, or <code>5</code>–<code>100</code> in steps of 5, plus <code>33</code> and <code>66</code> (<code>%</code> optional)</td></tr>
          <tr><td><code>fxFlexOffset</code></td><td><code>onlFlexOffset</code></td><td>Same percentages</td></tr>
          <tr><td><code>fxFlexOrder</code></td><td><code>onlFlexOrder</code></td><td><code>-1</code>–<code>12</code></td></tr>
          <tr><td><code>fxFlexAlign</code></td><td><code>onlFlexAlign</code></td><td><code>start center end baseline stretch</code></td></tr>
          <tr><td><code>fxFlexFill</code> / <code>fxFill</code></td><td><code>onlFlexFill</code></td><td>Fills the parent</td></tr>
          <tr><td><code>fxShow</code> · <code>fxHide</code></td><td><code>onlShow</code> · <code>onlHide</code></td><td><code>onlHide.xs</code> hides on xs. <code>onlShow.gt-sm</code> means visible only on gt-sm</td></tr>
        </tbody>
      </table>
      <p>
        Every attribute takes the responsive aliases <code>.xs .sm .md .lg .xl</code>, <code>.lt-sm … .lt-xl</code> and <code>.gt-xs … .gt-lg</code>. When aliases conflict, the narrower
        one wins, in the same priority order as Flex-Layout. Percentage widths subtract <code>onlFlexLayoutGap</code>, so <code>onlFlex=&quot;50&quot;</code> twice fits on one row.
      </p>
      <Callout tone="warning" title="React and JSX">
        JSX can&apos;t write dotted attribute names like <code>onlFlex.gt-sm</code>, so use the <code>onl-col-*</code> classes and flex utilities in React.
      </Callout>
      <Callout title="Migrating from @angular/flex-layout">
        The <code>onl</code> names don&apos;t clash with the plugin, so both can run side by side while you swap templates over. To keep your existing <code>fx*</code> templates
        unchanged, recompile with <code>$flex-attrs</code> mapped back to the <code>fx*</code> names.
      </Callout>

      <h2>SCSS</h2>
      <p>The sources ship in <code>onlynify-ui/scss</code>. The index file holds settings and mixins only, and emits no CSS.</p>
      <CodeBlock title="styles.scss" code={`@use "onlynify-ui/scss" as onl;\n\n.panel {\n  padding: 12px;                          // phones first\n  @include onl.up(md) { padding: 24px; }  // 960px and wider\n  @include onl.between(sm, lg) { … }      // 600–1919px\n  @include onl.only(xs) { … }             // 0–599px\n  @include onl.down(md) { … }             // below 960px (use sparingly)\n}`} />
      <CodeBlock title="Recompile with your own settings" code={`// 24 columns and Bootstrap-like breakpoints\n@use "onlynify-ui/scss/onlynify-grid" with (\n  $grid-columns: 24,\n  $breakpoints: (xs: 0, sm: 576px, md: 768px, lg: 992px, xl: 1200px)\n);\n\n// flex-layout attributes, only the aliases you use (much smaller)\n@use "onlynify-ui/scss/onlynify-flex-layout" with ($flex-aliases: ("xs", "gt-xs", "gt-sm"));\n\n// or keep Flex-Layout's own fx* names\n@use "onlynify-ui/scss/onlynify-flex-layout" with ($flex-attrs: (\n  layout: "fxLayout", layout-align: "fxLayoutAlign", layout-gap: "fxLayoutGap", flex: "fxFlex",\n  offset: "fxFlexOffset", order: "fxFlexOrder", align: "fxFlexAlign", fill: "fxFlexFill",\n  show: "fxShow", hide: "fxHide"\n));`} />
    </>
  );
}

function Charts() {
  return (
    <>
      <p className="onl-lead"><code>&lt;onl-chart&gt;</code> is a dependency-free SVG Web Component.</p>
      <CodeBlock code={`<onl-chart type="bar" stacked format="compact" aria-label="Revenue by product"\n  labels='["Jun","Jul","Aug"]'\n  series='[{"name":"School","data":[210000,240000,232000]},{"name":"Shop","data":[120000,131000,148000]}]'>\n</onl-chart>`} />
      <table>
        <thead><tr><th>Attribute / property</th><th>Values</th></tr></thead>
        <tbody>
          <tr><td><code>type</code></td><td>bar · line · area · sparkline · donut · pie · hbar · combo · radar · scatter · bubble · gauge · radial · heatmap · funnel · treemap · waterfall</td></tr>
          <tr><td><code>labels</code>, <code>series</code></td><td>JSON attribute, or a JS property (recommended in frameworks)</td></tr>
          <tr><td><code>data</code></td><td><code>[{"{"}label, value{"}"}]</code> for donut, pie, hbar, radial, funnel, treemap, waterfall and gauge</td></tr>
          <tr><td><code>series[].type</code></td><td><code>"line"</code> draws that series as a line over the bars (combo)</td></tr>
          <tr><td>scatter / bubble</td><td>series points <code>{"{"}x, y, r?, label?{"}"}</code>; <code>x-label</code>, <code>y-label</code></td></tr>
          <tr><td>heatmap</td><td><code>labels</code> are columns; each series is a row</td></tr>
          <tr><td><code>max</code>, <code>value</code>, <code>color</code></td><td>gauge and radial bars</td></tr>
          <tr><td><code>total-label</code></td><td>waterfall total bar (<code>"false"</code> hides it)</td></tr>
          <tr><td><code>format</code></td><td>number · inr · currency · compact (12.5K / 12.5L / 2.5Cr) · percent</td></tr>
          <tr><td><code>stacked</code>, <code>legend="false"</code>, <code>grid="false"</code>, <code>height</code>, <code>center-label</code></td><td>display options</td></tr>
        </tbody>
      </table>
      <h2>In frameworks</h2>
      <CodeBlock code={`// React\nref.current.config = { labels, series };\n\n<!-- Vue -->\n<onl-chart type="line" :labels.prop="labels" :series.prop="series" />\n\n<!-- Angular -->\n<onl-chart type="line" [labels]="labels" [series]="series"></onl-chart>`} />
      <p>Colours come from <code>--onl-series-1…6</code> and follow the theme. Every chart also renders a visually hidden data table for screen readers.</p>
      <p><Link href="/docs/components/charts">See every chart type →</Link></p>
    </>
  );
}

function Cli() {
  return (
    <>
      <p className="onl-lead">Copy blocks straight into your project, already converted for your framework.</p>
      <CodeBlock code={`npx onlynify-ui init             # detects your framework, prints setup\nnpx onlynify-ui list             # all blocks, free and PRO\nnpx onlynify-ui add hero-01      # copies into src/components/onlynify\nnpx onlynify-ui add dashboard-01 --framework vue --out src/blocks`} />
      <h2>Premium blocks</h2>
      <p>After you buy Pro, your licence key is shown on your <Link href="/account">account page</Link>.</p>
      <CodeBlock code={`npx onlynify-ui login ONL-XXXX-XXXX-XXXX-XXXX   # saved to ~/.onlynify-ui.json\nnpx onlynify-ui add checkout-01\n\n# or, in CI\nONLYNIFY_UI_KEY=ONL-… npx onlynify-ui add invoice-01`} />
      <h2>Options</h2>
      <table>
        <thead><tr><th>Flag</th><th>Meaning</th></tr></thead>
        <tbody>
          <tr><td><code>--framework</code></td><td>html · react · vue · angular (default: detected from package.json)</td></tr>
          <tr><td><code>--out</code></td><td>Target folder</td></tr>
          <tr><td><code>--force</code></td><td>Overwrite existing files</td></tr>
          <tr><td><code>--registry</code></td><td>Self-hosted registry URL (or <code>ONLYNIFY_UI_REGISTRY</code>)</td></tr>
        </tbody>
      </table>
    </>
  );
}

function License() {
  return (
    <>
      <h2>Onlynify UI (core): MIT</h2>
      <p>The stylesheet, Web Components, tokens, CLI and every component on this site are MIT licensed. You can use them in personal, commercial and client projects for free, with no attribution required beyond keeping the licence file.</p>
      <h2>Onlynify UI Pro</h2>
      <ul>
        <li><b>Pro</b> covers one developer and unlimited projects, including commercial ones.</li>
        <li><b>Team</b> covers up to five developers and client work for agencies.</li>
        <li>You may modify premium blocks and ship them inside your products.</li>
        <li>You may not resell or redistribute premium blocks as a UI kit, template or theme, or publish their source in a public repository.</li>
        <li>Updates are included for life with a one-time payment.</li>
      </ul>
      <Callout tone="success" title="Refunds">If Pro isn't right for you, email us within 14 days of purchase for a full refund.</Callout>
      <p>The full licence terms are part of our <Link href="/terms#licences">Terms of Service</Link>. See also the <Link href="/privacy">Privacy Policy</Link>.</p>
      <div className="onl-row" style={{ marginTop: 20 }}>
        <Link className="onl-btn onl-btn--brand" href="/pricing">See pricing</Link>
      </div>
    </>
  );
}

const PAGES: Record<string, () => React.ReactNode> = { introduction: Introduction, installation: Installation, icons: Icons, theming: Theming, grid: Grid, charts: Charts, cli: Cli, license: License };

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = GUIDES.find((g) => g.slug === slug);
  const Page = PAGES[slug];
  if (!guide || !Page) notFound();
  const i = GUIDES.indexOf(guide);
  const next = GUIDES[i + 1];
  return (
    <article className="site-prose">
      <p className="onl-eyebrow">Getting started</p>
      <h1 className="onl-h1" style={{ fontSize: "2rem", marginTop: 6 }}>{guide.title}</h1>
      <Page />
      {next && (
        <p style={{ marginTop: 40 }}>
          <Link className="onl-btn" href={`/docs/${next.slug}`}>{next.title} →</Link>
        </p>
      )}
    </article>
  );
}
