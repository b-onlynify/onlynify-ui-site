import type { Metadata } from "next";
import Link from "next/link";
import { BLOCKS, CATEGORIES } from "@/lib/registry.ts";

export const metadata: Metadata = { title: "Blocks", description: "Copy-paste page sections and full screens built with Onlynify UI, for HTML, React, Vue and Angular." };

export default async function Blocks({ searchParams }: { searchParams: Promise<{ category?: string; tier?: string }> }) {
  const { category, tier } = await searchParams;
  const list = BLOCKS.filter((b) => (!category || b.category === category) && (!tier || (tier === "pro" ? b.premium : !b.premium)));
  const href = (q: Record<string, string | undefined>) => {
    const p = new URLSearchParams(Object.entries({ category, tier, ...q }).filter(([, v]) => v) as [string, string][]);
    const s = p.toString();
    return s ? `/blocks?${s}` : "/blocks";
  };
  return (
    <div className="onl-container onl-container--xl" style={{ paddingBlock: "40px 64px" }}>
      <header style={{ maxWidth: 720 }}>
        <p className="onl-eyebrow">Blocks</p>
        <h1 className="onl-h1" style={{ fontSize: "2.25rem", marginTop: 8 }}>Ready-made sections and screens</h1>
        <p className="onl-lead" style={{ marginTop: 10 }}>
          Preview every block for free. Copy the free ones straight away. Pro unlocks the dashboards, storefront, checkout, invoice and settings screens.
        </p>
      </header>

      <div className="onl-row onl-row--between" style={{ marginTop: 24 }}>
        <div className="onl-filters" role="group" aria-label="Category">
          <Link className="onl-chip site-plain" href={href({ category: undefined })} aria-pressed={!category}>All</Link>
          {CATEGORIES.map((c) => (
            <Link key={c} className="onl-chip site-plain" href={href({ category: c })} aria-pressed={category === c}>{c}</Link>
          ))}
        </div>
        <div className="onl-tabs onl-tabs--pill" role="tablist" aria-label="Tier">
          <Link role="tab" className="onl-tab site-plain" href={href({ tier: undefined })} aria-selected={!tier}>All</Link>
          <Link role="tab" className="onl-tab site-plain" href={href({ tier: "free" })} aria-selected={tier === "free"}>Free</Link>
          <Link role="tab" className="onl-tab site-plain" href={href({ tier: "pro" })} aria-selected={tier === "pro"}>Pro</Link>
        </div>
      </div>

      <div className="onl-grid" style={{ ["--onl-min" as string]: "320px", marginTop: 24 }}>
        {list.map((b) => (
          <Link key={b.slug} href={`/blocks/${b.slug}`} className="onl-card onl-card--interactive site-block-card site-plain" style={{ color: "inherit" }}>
            <div className="onl-card__media">
              <iframe title={`${b.title} thumbnail`} src={`/preview/${b.slug}?thumb=1`} loading="lazy" tabIndex={-1} aria-hidden="true" />
            </div>
            <div className="onl-card__body">
              <div className="onl-row onl-row--between onl-row--nowrap">
                <h2 className="onl-h4 onl-truncate">{b.title}</h2>
                {b.premium ? <span className="site-pro">PRO</span> : <span className="onl-badge onl-badge--success">Free</span>}
              </div>
              <p className="onl-text-sm onl-text-muted" style={{ marginTop: 4 }}>{b.description}</p>
              <p className="onl-text-xs onl-text-muted" style={{ marginTop: 8 }}>{b.category}</p>
            </div>
          </Link>
        ))}
      </div>
      {list.length === 0 && (
        <div className="onl-empty"><p className="onl-empty__title">No blocks match</p><Link href="/blocks" className="onl-btn onl-btn--sm">Clear filters</Link></div>
      )}
    </div>
  );
}
