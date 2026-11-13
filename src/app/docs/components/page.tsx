import type { Metadata } from "next";
import Link from "next/link";
import { CATALOG, CHART_TYPES } from "@/lib/catalog";
import { PRO_COMPONENTS } from "@/lib/pro-components.ts";
import { COMPONENT_DOCS, COMPONENTS } from "@/lib/registry.ts";

export const metadata: Metadata = { title: "All components", description: "Every Onlynify UI component in one list: inputs, overlays, data, charts, marketing sections and app patterns." };

/** "All components" index: the coverage check a buyer does before paying. */
export default function AllComponents() {
  const list = COMPONENT_DOCS;
  const fresh = list.filter((c) => c.isNew);
  const demos = list.reduce((count, component) => count + component.demos.length, 0);
  const withPro = new Set(PRO_COMPONENTS.flatMap((p) => p.components));
  const link = (c: (typeof list)[number]) => (
    <Link key={c.name} href={`/docs/components/${c.slug}`} className="site-catalog__item site-plain">
      {c.name}
      {c.isNew && <span className="site-catalog__dot" aria-label="new" />}
      {withPro.has(c.name) && <span className="site-pro" style={{ fontSize: 9, padding: "0 5px", marginInlineStart: 6 }}>PRO</span>}
    </Link>
  );
  return (
    <div className="site-prose" style={{ maxWidth: 900 }}>
      <p className="onl-eyebrow">Components</p>
      <h1 className="onl-h1" style={{ fontSize: "2rem" }}>All components</h1>
      <p className="onl-lead">
        {list.length} components and {CHART_TYPES.length} chart types across {COMPONENTS.length} documentation pages with {demos} live examples. Every one has a free basic version under the MIT licence, with HTML, React, Vue and Angular examples plus React Native conversion starters. {list.filter((c) => withPro.has(c.name)).length} of them also have a polished <Link href="/pro">Pro version</Link>, alongside {PRO_COMPONENTS.filter((p) => p.chart).length} Pro chart cards.
      </p>

      <div className="onl-grid onl-grid--4" style={{ marginTop: 20 }}>
        <div className="onl-card onl-stat"><p className="onl-stat__label">Components</p><p className="onl-stat__value">{list.length}</p></div>
        <div className="onl-card onl-stat"><p className="onl-stat__label">Chart types</p><p className="onl-stat__value">{CHART_TYPES.length}</p></div>
        <div className="onl-card onl-stat"><p className="onl-stat__label">Live examples</p><p className="onl-stat__value">{demos}</p></div>
        <div className="onl-card onl-stat"><p className="onl-stat__label">Pro versions</p><p className="onl-stat__value">{PRO_COMPONENTS.length}</p></div>
      </div>

      <h2>New in this release</h2>
      <div className="site-catalog">{fresh.map(link)}</div>

      <h2>All components</h2>
      <div className="site-catalog">{list.map(link)}</div>

      <h2>Charts</h2>
      <div className="site-catalog">
        {CHART_TYPES.map((t) => (
          <Link key={t} href="/docs/components/charts" className="site-catalog__item site-plain">{t}</Link>
        ))}
      </div>

      <p style={{ marginTop: 32, paddingTop: 16, borderTop: "1px solid var(--onl-line)" }}>
        Need full screens instead of parts? See <Link href="/blocks">blocks</Link> and the Pro <Link href="/sites">site templates</Link>.
      </p>
    </div>
  );
}
