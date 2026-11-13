import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@/lib/auth.ts";
import { userHasPremium } from "@/lib/payments.ts";
import { SITES } from "@/lib/sites.ts";

export const metadata: Metadata = { title: "Site templates", description: "Eight complete, multi-page website templates built with Onlynify UI. Pro: customise the theme and download HTML, React, Vue or Angular code." };
export const dynamic = "force-dynamic";

export default async function Sites() {
  const user = await currentUser();
  const pro = await userHasPremium(user?.id);
  return (
    <div className="onl-container onl-container--xl" style={{ paddingBlock: "40px 64px" }}>
      <header style={{ maxWidth: 760 }}>
        <p className="onl-eyebrow">Sites <span className="site-pro">PRO</span></p>
        <h1 className="onl-h1" style={{ fontSize: "2.25rem", marginTop: 8 }}>Complete sites, ready to make yours</h1>
        <p className="onl-lead" style={{ marginTop: 10 }}>
          Eight multi-page templates for real businesses, each with {SITES.reduce((n, s) => n + s.variants.length, 0) / SITES.length} ready-made variations that change the brand, copy, theme and layout on every page. Preview everything for free. With Pro, restyle any of them with your own colours, radius and font, then download the code for HTML, React, Vue or Angular.
        </p>
        {!pro && (
          <div className="onl-row" style={{ marginTop: 18 }}>
            <Link href="/pricing" className="onl-btn onl-btn--gradient">Unlock all sites with Pro</Link>
            <Link href="/themes" className="onl-btn">Try the theme builder</Link>
          </div>
        )}
      </header>

      <div className="onl-grid" style={{ ["--onl-min" as string]: "340px", marginTop: 32 }}>
        {SITES.map((s) => (
          <Link key={s.slug} href={`/sites/${s.slug}`} className="onl-card onl-card--interactive onl-card--lift site-block-card site-plain" style={{ color: "inherit" }}>
            <div className="onl-card__media">
              <iframe title={`${s.title} thumbnail`} src={`/preview/site/${s.slug}/home?thumb=1`} loading="lazy" tabIndex={-1} aria-hidden="true" />
            </div>
            <div className="onl-card__body">
              <div className="onl-row onl-row--between onl-row--nowrap">
                <h2 className="onl-h4 onl-truncate">{s.title}</h2>
                <span className="site-pro">PRO</span>
              </div>
              <p className="onl-text-sm onl-text-muted" style={{ marginTop: 4 }}>{s.description}</p>
              <div className="onl-row" style={{ ["--onl-gap" as string]: "6px", marginTop: 10 }}>
                <span className="onl-badge">{s.industry}</span>
                <span className="onl-badge">{s.pages.length} pages</span>
                <span className="onl-badge onl-badge--brand">{s.variants.length} variations</span>
              </div>
              <p className="onl-text-xs onl-text-muted" style={{ marginTop: 10 }}>
                {s.variants.map((v) => `${v.name} (${v.tagline})`).join(" · ")}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
