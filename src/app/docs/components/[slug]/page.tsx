import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Demo } from "@/components/client";
import { COMPONENT_FRAMEWORKS, toFramework, type CodeFile } from "@/lib/convert.ts";
import { fillPlaceholders } from "@/lib/placeholder.ts";
import { proForComponent } from "@/lib/pro-components.ts";
import { COMPONENTS, COMPONENT_DOCS, componentBySlug, componentDocBySlug } from "@/lib/registry.ts";

export const dynamicParams = false;
export const generateStaticParams = () =>
  [...new Set([...COMPONENTS.map((c) => c.slug), ...COMPONENT_DOCS.map((c) => c.slug)])].map((slug) => ({ slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = componentDocBySlug(slug) ?? componentBySlug(slug);
  return c ? { title: c.title, description: c.description } : {};
}

export default async function ComponentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const component = componentDocBySlug(slug);
  const c = component ?? componentBySlug(slug);
  if (!c) notFound();
  const sequence = component ? COMPONENT_DOCS : COMPONENTS;
  const i = sequence.indexOf(c);
  const prev = sequence[i - 1];
  const next = sequence[i + 1];
  const pros = component ? proForComponent(component.name) : [];
  return (
    <article>
      <nav aria-label="Breadcrumb">
        <ol className="onl-breadcrumb">
          <li><Link href="/docs/introduction">Docs</Link></li>
          <li><span>{c.group}</span></li>
          <li><span aria-current="page">{c.title}</span></li>
        </ol>
      </nav>
      <h1 className="onl-h1" style={{ marginTop: 10, fontSize: "2rem" }}>{c.title}</h1>
      <p className="onl-lead" style={{ marginTop: 8, maxWidth: 720 }}>{c.description}</p>
      <div className="onl-row" style={{ marginTop: 14, ["--onl-gap" as string]: "6px" }}>
        <span className="onl-badge onl-badge--success">Basic · Free · MIT</span>
        <span className="onl-badge">HTML</span>
        <span className="onl-badge">React</span>
        <span className="onl-badge">Vue</span>
        <span className="onl-badge">Angular</span>
        <span className="onl-badge">React Native · conversion</span>
      </div>

      <div className="onl-stack" style={{ marginTop: 28, ["--onl-gap" as string]: "32px" }}>
        {c.demos.map((d, n) => {
          const files = Object.fromEntries(COMPONENT_FRAMEWORKS.map((fw) => [fw, toFramework(d.html, fw, `${c.slug}-${n + 1}`, { title: `${c.title} · ${d.title}` })])) as Record<string, CodeFile[]>;
          const id = d.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
          return (
            <section key={d.title} id={id} style={{ scrollMarginTop: 80 }}>
              <h2 className="onl-h3" style={{ marginBottom: 6 }}>
                <a href={`#${id}`} style={{ color: "inherit" }}>{d.title}</a>
              </h2>
              {d.description && <p className="onl-text-muted" style={{ marginBottom: 10 }}>{d.description}</p>}
              <Demo html={fillPlaceholders(d.html)} muted={d.muted} files={files} />
            </section>
          );
        })}
      </div>

      {pros.length > 0 && (
        <section id="pro-versions" className="site-pro-versions" style={{ scrollMarginTop: 80 }}>
          <div className="onl-row onl-row--between" style={{ alignItems: "flex-end" }}>
            <div>
              <p className="onl-eyebrow">Pro</p>
              <h2 className="onl-h2" style={{ marginTop: 4 }}>{c.title}: the full Pro version</h2>
              <p className="onl-text-muted" style={{ marginTop: 6, maxWidth: 640 }}>
                The examples above are the free basic version. Pro adds richer, production-ready layouts and states. Preview for free; Pro and Team licences get the code.
              </p>
            </div>
            <Link href="/pro" className="onl-btn onl-btn--sm">All Pro components →</Link>
          </div>
          <div className="onl-grid" style={{ ["--onl-min" as string]: "280px", marginTop: 16 }}>
            {pros.map((p) => (
              <Link key={p.slug} href={`/pro/${p.slug}`} className="onl-card onl-card--interactive site-block-card site-pro-thumb site-plain" style={{ color: "inherit" }}>
                <div className="onl-card__media">
                  <iframe title={`${p.title} thumbnail`} src={`/preview/pro/${p.slug}?thumb=1`} loading="lazy" tabIndex={-1} aria-hidden="true" />
                </div>
                <div className="onl-card__body">
                  <div className="onl-row onl-row--between onl-row--nowrap">
                    <b className="onl-truncate">{p.title}</b>
                    {p.tier === "team" ? <span className="site-pro site-pro--team">TEAM</span> : <span className="site-pro">PRO</span>}
                  </div>
                  <p className="onl-text-sm onl-text-muted" style={{ marginTop: 4 }}>{p.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <nav className="onl-row onl-row--between" style={{ marginTop: 48 }} aria-label="Pagination">
        {prev ? <Link className="onl-btn" href={`/docs/components/${prev.slug}`}>← {"name" in prev && typeof prev.name === "string" ? prev.name : prev.title}</Link> : <span />}
        {next ? <Link className="onl-btn" href={`/docs/components/${next.slug}`}>{"name" in next && typeof next.name === "string" ? next.name : next.title} →</Link> : <Link className="onl-btn onl-btn--brand" href="/blocks">Browse blocks →</Link>}
      </nav>
    </article>
  );
}
