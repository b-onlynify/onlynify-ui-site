import type { Metadata } from "next";
import Link from "next/link";
import { BuyButton } from "@/components/client";
import { currentUser } from "@/lib/auth.ts";
import { gatewayMode, userHasPremium } from "@/lib/payments.ts";
import { PLANS, priceLabel } from "@/lib/plans.ts";
import { BLOCKS, COMPONENTS } from "@/lib/registry.ts";
import { SITES } from "@/lib/sites.ts";
import { CATALOG, CHART_TYPES } from "@/lib/catalog";

export const metadata: Metadata = { title: "Pricing", description: "Onlynify UI is free and open source. Pro unlocks premium blocks with a one-time payment." };
export const dynamic = "force-dynamic";

const FAQ = [
  ["Is the core kit really free?", "Yes. Components, tokens, charts and the CLI are MIT licensed. Use them in commercial and client projects with no fee."],
  ["Is Pro a subscription?", "No. You pay once and get every premium block, plus all future ones, for life."],
  ["Which frameworks do premium blocks support?", "Every block ships as HTML, React, Vue and Angular code. The CLI converts it to your framework automatically."],
  ["How do I pay?", "Through our secure payment gateway: UPI, cards, net banking and wallets. A GST invoice is emailed after payment."],
  ["Can I get a refund?", "Yes. Email us within 14 days for a full refund, no questions asked."],
  ["Do I keep the code if I stop paying?", "There is nothing to stop: Pro is a one-time payment. Code you have downloaded is yours to keep and ship, even after a refund window has passed."],
  ["Can I use Pro in client projects?", "Pro covers your own products. Use a Team licence (5 seats) for client and agency work."],
  ["What's in the updates?", "Every new premium block, site template and theme feature we release, at no extra cost. The free kit keeps getting new components too."],
  ["Do you see my card details?", "No. Payment happens on the gateway's hosted page; we only receive a payment reference and verify its signature."],
  ["Can I try before buying?", "Yes: every component and chart is free, every premium block and site has a live preview, and the theme builder lets you try all presets without an account."],
];

/** What a buyer should verify before paying, each with a link to check it themselves. */
const CHECKS: [string, string, string, string][] = [
  ["Component coverage", "Every component you need, in one list with live examples.", "/docs/components", "See all components"],
  ["Charts on real dashboards", "17 SVG chart types; the analytics and finance dashboards use them.", "/blocks/analytics-01", "Preview the analytics dashboard"],
  ["Your brand, your style", "Brand colours and style presets free; Pro sets any colour, radius, font and density.", "/themes", "Open the theme builder"],
  ["Full sites, not just parts", "Multi-page templates you can restyle and download.", "/sites", "Preview the site templates"],
  ["Works in your framework", "Every block and site as HTML, React, Vue and Angular code.", "/docs/installation", "Check installation"],
  ["Accessible and RTL ready", "Keyboard support, ARIA state, focus rings, screen-reader chart tables and right-to-left layouts.", "/docs/components/direction", "See the RTL demo"],
  ["Dark mode everywhere", "Every component, chart and template follows light and dark themes.", "/docs/components/styles", "Compare styles"],
  ["No dependencies", "One stylesheet and an optional script. Nothing else to install, audit or update.", "/docs/introduction", "Read why"],
  ["Clear licence", "MIT core; Pro and Team terms in plain English.", "/docs/license", "Read the licence"],
  ["Safe payment and refunds", "Hosted payment page, GST invoice, 14-day full refund.", "/terms", "Read the terms"],
];

export default async function Pricing({ searchParams }: { searchParams: Promise<{ failed?: string }> }) {
  const { failed } = await searchParams;
  const user = await currentUser();
  const owned = await userHasPremium(user?.id);
  const proCount = BLOCKS.filter((b) => b.premium).length;
  return (
    <div className="onl-container" style={{ paddingBlock: "48px 72px" }}>
      <header style={{ textAlign: "center", maxWidth: 680, margin: "0 auto" }}>
        <p className="onl-eyebrow">Pricing</p>
        <h1 className="onl-h1" style={{ fontSize: "2.4rem", marginTop: 8 }}>Free forever. Pro when you want to ship faster.</h1>
        <p className="onl-lead" style={{ marginTop: 12 }}>The kit is open source. Pro adds {proCount} premium blocks, {SITES.length} site templates and the theme customiser, plus everything we add later, for a single payment.</p>
      </header>

      {failed && (
        <div className="onl-alert onl-alert--danger" role="alert" style={{ maxWidth: 640, margin: "24px auto 0" }}>
          <div className="onl-alert__content"><p className="onl-alert__title">The payment didn't go through</p><p className="onl-alert__body">You weren't charged. Please try again.</p></div>
        </div>
      )}
      {owned && (
        <div className="onl-alert onl-alert--success" style={{ maxWidth: 640, margin: "24px auto 0" }}>
          <div className="onl-alert__content"><p className="onl-alert__title">You already have Pro</p><p className="onl-alert__body">Your licence is on your <Link href="/account">account page</Link>.</p></div>
        </div>
      )}

      <div className="onl-grid onl-grid--3" style={{ marginTop: 40, alignItems: "start", paddingTop: 12 }}>
        {PLANS.map((p) => {
          const hl = p.id === "pro";
          return (
            <div key={p.id} className={`onl-card onl-pricing${hl ? " onl-card--brand" : ""}`}>
              {hl && <span className="onl-pricing__badge">Most popular</span>}
              <h2 className="onl-pricing__name">{p.name}</h2>
              <p className="onl-pricing__desc">{p.tagline}</p>
              <p className="onl-pricing__price">
                <span className="onl-pricing__amount">{priceLabel(p)}</span>
                <span className="onl-pricing__period">{p.amount ? "one-time" : "forever"}</span>
              </p>
              <div style={{ marginTop: 20 }}>
                {p.purchasable ? (
                  <BuyButton plan={p.id} label={owned ? `Buy another ${p.name} licence` : `Get ${p.name}`} signedIn={!!user} highlighted={hl} email={user?.email} name={user?.name} />
                ) : (
                  <Link className="onl-btn onl-btn--block onl-btn--lg" href="/docs/installation">Start free</Link>
                )}
              </div>
              <ul className="onl-pricing__features">
                {p.features.map((f) => <li key={f}>{f}</li>)}
                {p.missing?.map((f) => <li key={f} data-off="">{f}</li>)}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="onl-text-xs onl-text-muted" style={{ textAlign: "center", marginTop: 16 }}>
        Prices in INR including GST. Secure online payments{gatewayMode() === "test" ? " (test mode: no real charges)" : ""}.
      </p>

      <section style={{ marginTop: 64 }}>
        <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 24px" }}>
          <p className="onl-eyebrow">Before you buy</p>
          <h2 className="onl-h1" style={{ marginTop: 8 }}>Check everything first</h2>
          <p className="onl-text-muted" style={{ marginTop: 8 }}>Here is what we would check before paying for a UI kit, and where to verify each point yourself.</p>
        </div>
        <div className="site-checklist">
          {CHECKS.map(([title, text, href, cta]) => (
            <div key={title} className="onl-card site-check">
              <span className="site-check__icon" aria-hidden="true">✓</span>
              <b>{title}</b>
              <div>
                <p>{text}</p>
                <Link href={href}>{cta} →</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="onl-card" style={{ marginTop: 40 }}>
        <div className="onl-card__header"><h2 className="onl-card__title">Compare plans</h2></div>
        <div className="onl-table-wrap">
          <table className="onl-table">
            <thead><tr><th>What you get</th><th>Free</th><th>Pro</th><th>Team</th></tr></thead>
            <tbody>
              <tr><td>Components ({CATALOG.length}) and documentation ({COMPONENTS.length} pages)</td><td>✓</td><td>✓</td><td>✓</td></tr>
              <tr><td>Chart types ({CHART_TYPES.length})</td><td>✓</td><td>✓</td><td>✓</td></tr>
              <tr><td>Free blocks ({BLOCKS.length - proCount})</td><td>✓</td><td>✓</td><td>✓</td></tr>
              <tr><td>Brand presets (12) and style presets (5)</td><td>✓</td><td>✓</td><td>✓</td></tr>
              <tr><td>Premium blocks ({proCount}): dashboards with charts, forms, commerce</td><td>Preview</td><td>✓</td><td>✓</td></tr>
              <tr><td>Site templates ({SITES.length}, multi-page)</td><td>Preview</td><td>✓</td><td>✓</td></tr>
              <tr><td>Theme customiser: any colour, accent, radius, font, density</td><td>Try presets</td><td>✓</td><td>✓</td></tr>
              <tr><td>Saved themes applied to code downloads</td><td>—</td><td>✓</td><td>✓</td></tr>
              <tr><td>CLI downloads with a licence key</td><td>Free blocks</td><td>✓</td><td>✓</td></tr>
              <tr><td>Developer seats</td><td>—</td><td>1</td><td>5</td></tr>
              <tr><td>Client and agency projects</td><td>Core kit only</td><td>—</td><td>✓</td></tr>
              <tr><td>Support</td><td>Community</td><td>Email</td><td>Priority</td></tr>
              <tr><td>Price</td><td>₹0</td><td>{priceLabel(PLANS[1])} once</td><td>{priceLabel(PLANS[2])} once</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ maxWidth: 720, margin: "56px auto 0" }}>
        <h2 className="onl-h2" style={{ marginBottom: 8 }}>Questions</h2>
        {FAQ.map(([q, a], i) => (
          <details key={q} className="onl-accordion" open={i === 0}>
            <summary>{q}</summary>
            <div>{a}</div>
          </details>
        ))}
      </section>
    </div>
  );
}
