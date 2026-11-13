import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser } from "@/lib/auth.ts";
import { userPlan } from "@/lib/payments.ts";
import { PRO_COMPONENTS, proBySlug } from "@/lib/pro-components.ts";
import { COMPONENT_DOCS } from "@/lib/registry.ts";
import { read } from "@/lib/store.ts";
import { DEFAULT_THEME, decodeTheme, normalizeTheme } from "@/lib/theme.ts";
import { ProStudio } from "./studio";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = proBySlug((await params).slug);
  return p ? { title: `${p.title} · Pro component`, description: p.description } : {};
}

export default async function ProComponentPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ theme?: string }> }) {
  const { slug } = await params;
  const meta = proBySlug(slug);
  if (!meta) notFound();
  const user = await currentUser();
  const plan = await userPlan(user?.id);
  const saved = user ? (await read()).themes.filter((t) => t.userId === user.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) : [];
  const initial = decodeTheme((await searchParams).theme) ?? DEFAULT_THEME;
  const entitled = plan === "team" || (plan === "pro" && meta.tier === "pro");
  const basics = meta.components.map((name) => COMPONENT_DOCS.find((c) => c.name === name)).filter((c) => c !== undefined);
  const related = PRO_COMPONENTS.filter((p) => p.category === meta.category && p.slug !== slug).slice(0, 3);
  const tierBadge = meta.tier === "team" ? <span className="site-pro site-pro--team">TEAM</span> : <span className="site-pro">PRO</span>;

  return (
    <div className="onl-container onl-container--xl" style={{ paddingBlock: "28px 64px" }}>
      <nav aria-label="Breadcrumb">
        <ol className="onl-breadcrumb">
          <li><Link href="/pro">Pro components</Link></li>
          <li><Link href={`/pro?category=${encodeURIComponent(meta.category)}`}>{meta.category}</Link></li>
          <li><span aria-current="page">{meta.title}</span></li>
        </ol>
      </nav>
      <div className="onl-row onl-row--between" style={{ marginTop: 10, marginBottom: 18, alignItems: "flex-end" }}>
        <div>
          <div className="onl-row" style={{ ["--onl-gap" as string]: "10px" }}>
            <h1 className="onl-h1">{meta.title}</h1>
            {tierBadge}
            {meta.chart && <span className="onl-badge onl-badge--brand">Chart</span>}
          </div>
          <p className="onl-text-muted" style={{ marginTop: 6, maxWidth: 760 }}>{meta.description}</p>
          {basics.length > 0 && (
            <p className="onl-text-sm onl-text-muted" style={{ marginTop: 10 }}>
              Free basic version:{" "}
              {basics.map((b, i) => (
                <span key={b.slug}>
                  {i > 0 && ", "}
                  <Link href={`/docs/components/${b.slug}`}>{b.name}</Link>
                </span>
              ))}
            </p>
          )}
        </div>
        {entitled ? (
          <span className="onl-badge onl-badge--success">Unlocked with your {plan === "team" ? "Team" : "Pro"} licence</span>
        ) : (
          <Link href="/pricing" className="onl-btn onl-btn--gradient">{meta.tier === "team" ? (plan === "pro" ? "Upgrade to Team" : "Unlock with Team") : "Unlock with Pro"}</Link>
        )}
      </div>
      <ProStudio
        slug={slug}
        title={meta.title}
        height={meta.height}
        tier={meta.tier}
        plan={plan}
        signedIn={!!user}
        initialTheme={initial}
        saved={saved.map((t) => ({ id: t.id, name: t.name, theme: normalizeTheme(t.theme)!, updatedAt: t.updatedAt }))}
      />
      {related.length > 0 && (
        <>
          <h2 className="onl-h3" style={{ marginTop: 40 }}>More in {meta.category}</h2>
          <div className="onl-grid" style={{ ["--onl-min" as string]: "280px", marginTop: 14 }}>
            {related.map((p) => (
              <Link key={p.slug} href={`/pro/${p.slug}`} className="onl-card onl-card--interactive onl-card--pad site-plain" style={{ color: "inherit" }}>
                <div className="onl-row onl-row--between onl-row--nowrap">
                  <b>{p.title}</b>
                  {p.tier === "team" ? <span className="site-pro site-pro--team">TEAM</span> : <span className="site-pro">PRO</span>}
                </div>
                <p className="onl-text-sm onl-text-muted" style={{ marginTop: 4 }}>{p.description}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
