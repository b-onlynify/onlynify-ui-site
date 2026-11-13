import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@/lib/auth.ts";
import { userPlan } from "@/lib/payments.ts";
import { PRO_CATEGORIES, PRO_COMPONENTS } from "@/lib/pro-components.ts";
import { COMPONENT_DOCS } from "@/lib/registry.ts";

export const metadata: Metadata = {
  title: "Pro components",
  description: "Modern, professional Pro versions of every Onlynify UI component and chart, with code for HTML, React, Vue and Angular.",
};
export const dynamic = "force-dynamic";

export default async function ProGallery({ searchParams }: { searchParams: Promise<{ category?: string; tier?: string }> }) {
  const { category, tier } = await searchParams;
  const user = await currentUser();
  const plan = await userPlan(user?.id);
  const list = PRO_COMPONENTS.filter((p) => (!category || p.category === category) && (!tier || (tier === "charts" ? p.chart : tier === "team" ? p.tier === "team" : !p.chart)));
  const covered = new Set(PRO_COMPONENTS.flatMap((p) => p.components));
  const coverage = COMPONENT_DOCS.filter((c) => covered.has(c.name)).length;
  const charts = PRO_COMPONENTS.filter((p) => p.chart).length;
  const teamOnly = PRO_COMPONENTS.filter((p) => p.tier === "team").length;
  const href = (q: Record<string, string | undefined>) => {
    const p = new URLSearchParams(Object.entries({ category, tier, ...q }).filter(([, v]) => v) as [string, string][]);
    const s = p.toString();
    return s ? `/pro?${s}` : "/pro";
  };
  const unlocked = (t: "pro" | "team") => plan === "team" || (plan === "pro" && t === "pro");

  return (
    <div className="onl-container onl-container--xl" style={{ paddingBlock: "40px 64px" }}>
      <header className="site-pro-hero">
        <div style={{ maxWidth: 760 }}>
          <p className="onl-eyebrow">Pro components</p>
          <h1 className="onl-h1" style={{ fontSize: "2.4rem", marginTop: 8, letterSpacing: "-0.035em" }}>
            Every component, <span className="onl-gradient-text">fully finished</span>
          </h1>
          <p className="onl-lead" style={{ marginTop: 10 }}>
            The free kit gives you a clean basic version of every component. Pro gives you the polished, production-ready version: richer layouts, states and charts, ready to copy into HTML, React, Vue or Angular. Preview everything for free.
          </p>
        </div>
        <div className="onl-grid onl-grid--4" style={{ marginTop: 22 }}>
          <div className="onl-card onl-stat"><p className="onl-stat__label">Pro components</p><p className="onl-stat__value">{PRO_COMPONENTS.length - charts}</p></div>
          <div className="onl-card onl-stat"><p className="onl-stat__label">Pro charts</p><p className="onl-stat__value">{charts}</p></div>
          <div className="onl-card onl-stat"><p className="onl-stat__label">Kit components covered</p><p className="onl-stat__value">{coverage}/{COMPONENT_DOCS.length}</p></div>
          <div className="onl-card onl-stat"><p className="onl-stat__label">Your access</p><p className="onl-stat__value" style={{ fontSize: "1.25rem" }}>{plan === "team" ? "Team · everything" : plan === "pro" ? "Pro" : "Preview only"}</p></div>
        </div>
        <div className="site-tiers">
          <div><span className="onl-badge onl-badge--success">Free</span><p>Basic version of every component and chart (MIT kit).</p></div>
          <div><span className="site-pro">PRO</span><p>All {PRO_COMPONENTS.length - teamOnly} Pro components and charts, code for 4 frameworks, CLI, brand and style presets in the code.</p></div>
          <div><span className="site-pro site-pro--team">TEAM</span><p>Adds {teamOnly} Team components (app shell, data table, kanban, analytics dashboard) and fully customised code: your colours, radius, font and density.</p></div>
        </div>
      </header>

      <div className="onl-row onl-row--between" style={{ marginTop: 28 }}>
        <div className="onl-filters" role="group" aria-label="Category">
          <Link className="onl-chip site-plain" href={href({ category: undefined })} aria-pressed={!category}>All</Link>
          {PRO_CATEGORIES.map((c) => (
            <Link key={c} className="onl-chip site-plain" href={href({ category: c })} aria-pressed={category === c}>{c}</Link>
          ))}
        </div>
        <div className="onl-tabs onl-tabs--pill" role="tablist" aria-label="Type">
          <Link role="tab" className="onl-tab site-plain" href={href({ tier: undefined })} aria-selected={!tier}>All</Link>
          <Link role="tab" className="onl-tab site-plain" href={href({ tier: "components" })} aria-selected={tier === "components"}>Components</Link>
          <Link role="tab" className="onl-tab site-plain" href={href({ tier: "charts" })} aria-selected={tier === "charts"}>Charts</Link>
          <Link role="tab" className="onl-tab site-plain" href={href({ tier: "team" })} aria-selected={tier === "team"}>Team</Link>
        </div>
      </div>

      <div className="onl-grid" style={{ ["--onl-min" as string]: "320px", marginTop: 24 }}>
        {list.map((p) => (
          <Link key={p.slug} href={`/pro/${p.slug}`} className="onl-card onl-card--interactive site-block-card site-pro-thumb site-plain" style={{ color: "inherit" }}>
            <div className="onl-card__media">
              <iframe title={`${p.title} thumbnail`} src={`/preview/pro/${p.slug}?thumb=1`} loading="lazy" tabIndex={-1} aria-hidden="true" />
            </div>
            <div className="onl-card__body">
              <div className="onl-row onl-row--between onl-row--nowrap">
                <h2 className="onl-h4 onl-truncate">{p.title}</h2>
                <span className="onl-row onl-row--nowrap" style={{ ["--onl-gap" as string]: "6px" }}>
                  {unlocked(p.tier) && <span className="onl-badge onl-badge--success">Unlocked</span>}
                  {p.tier === "team" ? <span className="site-pro site-pro--team">TEAM</span> : <span className="site-pro">PRO</span>}
                </span>
              </div>
              <p className="onl-text-sm onl-text-muted" style={{ marginTop: 4 }}>{p.description}</p>
              <p className="onl-text-xs onl-text-muted" style={{ marginTop: 8 }}>{p.category} · upgrades {p.components.join(", ")}</p>
            </div>
          </Link>
        ))}
      </div>
      {list.length === 0 && (
        <div className="onl-empty"><p className="onl-empty__title">Nothing matches</p><Link href="/pro" className="onl-btn onl-btn--sm">Clear filters</Link></div>
      )}
    </div>
  );
}
