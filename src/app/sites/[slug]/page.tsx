import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser } from "@/lib/auth.ts";
import { userHasPremium } from "@/lib/payments.ts";
import { SITES, siteBySlug, variantOf } from "@/lib/sites.ts";
import { read } from "@/lib/store.ts";
import { decodeTheme, freeSubset, normalizeTheme } from "@/lib/theme.ts";
import { SiteStudio } from "./studio";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const s = siteBySlug((await params).slug);
  return s ? { title: `${s.title} site template`, description: s.description } : {};
}

export default async function SitePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ theme?: string; variant?: string }> }) {
  const { slug } = await params;
  const site = siteBySlug(slug);
  if (!site) notFound();
  const user = await currentUser();
  const pro = await userHasPremium(user?.id);
  const saved = user ? (await read()).themes.filter((t) => t.userId === user.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) : [];
  const sp = await searchParams;
  const variant = variantOf(site, sp.variant);
  const shared = decodeTheme(sp.theme);
  // Free accounts can try presets on any site; custom settings stay Pro.
  const initial = shared ? (pro ? shared : { ...variant.theme, ...freeSubset(shared) }) : variant.theme;
  const others = SITES.filter((s) => s.slug !== slug).slice(0, 3);
  return (
    <div className="onl-container onl-container--xl" style={{ paddingBlock: "28px 64px" }}>
      <nav aria-label="Breadcrumb">
        <ol className="onl-breadcrumb">
          <li><Link href="/sites">Sites</Link></li>
          <li><span aria-current="page">{site.title}</span></li>
        </ol>
      </nav>
      <div className="onl-row onl-row--between" style={{ marginTop: 10, marginBottom: 18, alignItems: "flex-end" }}>
        <div>
          <div className="onl-row" style={{ ["--onl-gap" as string]: "10px" }}>
            <h1 className="onl-h1">{site.title}</h1>
            <span className="site-pro">PRO</span>
          </div>
          <p className="onl-text-muted" style={{ marginTop: 6, maxWidth: 760 }}>{site.description}</p>
          <div className="onl-row" style={{ ["--onl-gap" as string]: "6px", marginTop: 10 }}>
            <span className="onl-chip">{site.variants.length} ready-made variations</span>
            {site.highlights.map((h) => (
              <span key={h} className="onl-chip">{h}</span>
            ))}
          </div>
        </div>
        {pro ? <span className="onl-badge onl-badge--success">Unlocked with your licence</span> : <Link href="/pricing" className="onl-btn onl-btn--gradient">Unlock with Pro</Link>}
      </div>
      <SiteStudio
        slug={slug}
        pages={site.pages}
        variants={site.variants.map(({ id, name, tagline, description, theme }) => ({ id, name, tagline, description, theme }))}
        initialVariant={variant.id}
        initialTheme={initial}
        pro={pro}
        signedIn={!!user}
        saved={saved.map((t) => ({ id: t.id, name: t.name, theme: normalizeTheme(t.theme)!, updatedAt: t.updatedAt }))}
      />
      <h2 className="onl-h3" style={{ marginTop: 40 }}>More sites</h2>
      <div className="onl-grid" style={{ ["--onl-min" as string]: "280px", marginTop: 14 }}>
        {others.map((s) => (
          <Link key={s.slug} href={`/sites/${s.slug}`} className="onl-card onl-card--interactive onl-card--pad site-plain" style={{ color: "inherit" }}>
            <div className="onl-row onl-row--between onl-row--nowrap"><b>{s.title}</b><span className="site-pro">PRO</span></div>
            <p className="onl-text-sm onl-text-muted" style={{ marginTop: 4 }}>{s.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
