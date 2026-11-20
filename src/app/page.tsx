import Link from "next/link";
import { CopyButton } from "@/components/client";
import { Icon } from "@/components/icon";
import { BLOCKS, COMPONENTS } from "@/lib/registry.ts";
import { SITES } from "@/lib/sites.ts";

const FRAMEWORKS = [
  { name: "Angular", color: "#dd0031" },
  { name: "React", color: "#61dafb" },
  { name: "Vue", color: "#42b883" },
  { name: "HTML", color: "#e34f26" },
  { name: "Next.js", color: "var(--onl-fg)" },
  { name: "React Native", color: "var(--onl-brand)" },
];

export default function Home() {
  const demoCount = COMPONENTS.reduce((a, c) => a + c.demos.length, 0);
  const pro = BLOCKS.filter((b) => b.premium).length;
  return (
    <>
      <section className="site-hero">
        <div className="onl-container">
          <Link href="/sites" className="onl-badge onl-badge--pill onl-badge--brand site-plain" style={{ padding: "4px 12px" }}>
            <span className="site-pro">NEW</span> {SITES.length} Pro site templates with {SITES.reduce((n, s) => n + s.variants.length, 0)} ready-made variations, page layouts and a theme customiser →
          </Link>
          <h1 className="site-hero__title">Beautiful UI that works in every framework</h1>
          <p className="site-hero__lead">
            Onlyn.ify UI is an open-source design system made of plain CSS and Web Components. You get buttons, cards, badges, forms, tables and charts with zero
            dependencies. Rich form inputs, 17 chart types, 12 brand colours and 5 modern styles. Copy them into Angular, React, Vue or plain HTML.
          </p>
          <div className="onl-row" style={{ justifyContent: "center", marginTop: 28 }}>
            <Link href="/docs/installation" className="onl-btn onl-btn--brand onl-btn--lg">
              Get started
            </Link>
            <Link href="/blocks" className="onl-btn onl-btn--lg">
              <Icon name="layers" /> Browse blocks
            </Link>
          </div>
          <div style={{ marginTop: 24 }}>
            <span className="site-install">
              <span>
                <span className="onl-text-muted">$</span> npm i onlynify-ui
              </span>
              <CopyButton text="npm i onlynify-ui" />
            </span>
          </div>
          <div className="onl-row" style={{ justifyContent: "center", marginTop: 24, ["--onl-gap" as string]: "8px" }}>
            {FRAMEWORKS.map((f) => (
              <span key={f.name} className="onl-badge onl-badge--pill" style={{ padding: "4px 10px", fontSize: 13 }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: f.color }} />
                {f.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* live showcase built from the kit itself */}
      <section className="onl-container onl-container--xl" style={{ paddingBottom: 64 }}>
        <div className="site-mosaic">
          <div className="onl-card onl-stat">
            <div className="onl-stat__head">
              <p className="onl-stat__label">Revenue</p>
              <span className="onl-icon-tile">
                <Icon name="rupee" />
              </span>
            </div>
            <p className="onl-stat__value">₹8.42L</p>
            <p className="onl-stat__foot">
              <span className="onl-trend onl-trend--up">12.5%</span> vs last month
            </p>
            <onl-chart type="sparkline" aria-label="Revenue trend" labels='["1","2","3","4","5","6","7","8","9","10"]' series='[{"name":"Revenue","data":[42,48,45,52,58,55,63,61,70,76]}]' />
          </div>

          <div className="onl-card">
            <div className="onl-card__header">
              <div>
                <h3 className="onl-card__title">Weekly orders</h3>
                <p className="onl-card__subtitle">by channel</p>
              </div>
            </div>
            <div className="onl-card__body">
              <onl-chart
                type="bar"
                stacked
                aria-label="Weekly orders"
                labels='["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]'
                series='[{"name":"Web","data":[42,51,48,61,57,88,74]},{"name":"App","data":[30,34,29,40,44,63,58]}]'
              />
            </div>
          </div>

          <div className="onl-card onl-card--pad">
            <h3 className="onl-card__title">Create account</h3>
            <div className="onl-stack" style={{ marginTop: 14, ["--onl-gap" as string]: "12px" }}>
              <div className="onl-field">
                <label className="onl-label" htmlFor="sh-email">Email</label>
                <input className="onl-input" id="sh-email" placeholder="you@company.com" />
              </div>
              <label className="onl-check">
                <input type="checkbox" defaultChecked /> Send me product updates
              </label>
              <button className="onl-btn onl-btn--brand onl-btn--block" type="button">
                Continue
              </button>
            </div>
          </div>

          <div className="onl-card onl-card--pad">
            <div className="onl-row onl-row--between">
              <h3 className="onl-card__title">Payments</h3>
              <span className="onl-pill onl-badge" data-status="live">Live</span>
            </div>
            <ul className="onl-list" style={{ marginTop: 8 }}>
              {[
                ["Ananya Rao", "₹4,500", "paid"],
                ["Vikram Kumar", "₹12,800", "overdue"],
                ["Sara Mathew", "₹2,250", "pending"],
              ].map(([n, a, s]) => (
                <li key={n} className="onl-list__item" style={{ paddingInline: 0 }}>
                  <span className="onl-avatar onl-avatar--sm" style={{ ["--hue" as string]: n.length * 37 }}>
                    {n.split(" ").map((x) => x[0]).join("")}
                  </span>
                  <div className="onl-grow">
                    <b>{n}</b>
                    <div className="onl-text-xs onl-text-muted onl-tabular">{a}</div>
                  </div>
                  <span className="onl-pill onl-badge" data-status={s}>
                    {s[0].toUpperCase() + s.slice(1)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="onl-card">
            <div className="onl-card__header">
              <h3 className="onl-card__title">Plans</h3>
            </div>
            <div className="onl-card__body">
              <onl-chart type="donut" center-label="Tenants" aria-label="Tenants by plan" data='[{"label":"Starter","value":64},{"label":"Growth","value":49},{"label":"Enterprise","value":15}]' />
            </div>
          </div>

          <div className="onl-card onl-card--pad">
            <div className="onl-stack" style={{ ["--onl-gap" as string]: "12px" }}>
              <div className="onl-row">
                <button className="onl-btn onl-btn--brand" type="button">Brand</button>
                <button className="onl-btn" type="button">Secondary</button>
                <button className="onl-btn onl-btn--ghost" type="button">Ghost</button>
              </div>
              <div className="onl-row" style={{ ["--onl-gap" as string]: "6px" }}>
                {["paid", "pending", "shipped", "low_stock", "admin"].map((s) => (
                  <span key={s} className="onl-pill onl-badge" data-status={s}>
                    {s.replace("_", " ")}
                  </span>
                ))}
              </div>
              <div className="onl-progress" role="progressbar" aria-label="Setup" aria-valuenow={72}>
                <div className="onl-progress__bar" style={{ ["--value" as string]: "72%" }} />
              </div>
              <div className="onl-switch-row" style={{ padding: 0 }}>
                <label htmlFor="sh-sw">Payment reminders</label>
                <input type="checkbox" role="switch" className="onl-switch" id="sh-sw" defaultChecked />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="onl-section onl-section--muted">
        <div className="onl-container">
          <div className="onl-grid onl-grid--3" style={{ ["--onl-gap" as string]: "28px" }}>
            {[
              ["code", "Any framework", "The same classes work in Angular, React, Vue and server-rendered HTML. Charts are a standard <onl-chart> custom element."],
              ["box", "Zero dependencies", "There's no CSS framework, no runtime framework and no chart library. The whole kit is about 67 KB of CSS and 45 KB of optional JS."],
              ["palette", "Themes and tenants", "Light and dark come built in, along with six brand presets. Pick any brand colour per tenant using data-brand."],
              ["chart", "Charts included", "Bar, stacked, line, area, donut and sparkline charts are theme-aware SVGs with tooltips and data tables for screen readers."],
              ["users", "Accessible by default", "State lives in ARIA attributes, overlays use native <dialog>, focus rings are visible and reduced motion is respected."],
              ["download", "CLI and copy-paste", "Run npx onlynify-ui add hero-01 to drop a block into your project, already converted for your framework."],
            ].map(([icon, title, text]) => (
              <div key={title} className="onl-stack" style={{ ["--onl-gap" as string]: "10px" }}>
                <span className="onl-icon-tile onl-icon-tile--lg">
                  <Icon name={icon} size={20} />
                </span>
                <h3 className="onl-h4">{title}</h3>
                <p className="onl-text-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="onl-section onl-section--muted">
        <div className="onl-container onl-container--xl">
          <div className="onl-row onl-row--between" style={{ alignItems: "flex-end", marginBottom: 20 }}>
            <div style={{ maxWidth: 640 }}>
              <p className="onl-eyebrow">Sites <span className="site-pro">PRO</span></p>
              <h2 className="onl-h1" style={{ marginTop: 8 }}>Whole websites, restyled in a click</h2>
              <p className="onl-text-muted" style={{ marginTop: 8 }}>
                {SITES.length} multi-page templates: SaaS, restaurant, real estate, clinic, agency, fitness, courses and a boutique hotel. Pro applies your own colours, radius and font, then hands you the code.
              </p>
            </div>
            <Link href="/sites" className="onl-btn onl-btn--brand">Browse sites</Link>
          </div>
          <div className="onl-grid" style={{ ["--onl-min" as string]: "260px" }}>
            {SITES.slice(0, 4).map((x) => (
              <Link key={x.slug} href={`/sites/${x.slug}`} className="onl-card onl-card--interactive site-block-card site-plain" style={{ color: "inherit" }}>
                <div className="onl-card__media">
                  <iframe title={`${x.title} thumbnail`} src={`/preview/site/${x.slug}/home?thumb=1`} loading="lazy" tabIndex={-1} aria-hidden="true" />
                </div>
                <div className="onl-card__body">
                  <b>{x.title}</b>
                  <p className="onl-text-xs onl-text-muted" style={{ marginTop: 2 }}>{x.industry}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="onl-section">
        <div className="onl-container" style={{ textAlign: "center" }}>
          <p className="onl-eyebrow">Free and open source</p>
          <h2 className="onl-h1" style={{ marginTop: 8 }}>
            {COMPONENTS.length} component groups and {demoCount} examples, free under MIT
          </h2>
          <p className="onl-lead" style={{ maxWidth: 620, margin: "12px auto 0" }}>
            Pro adds {pro} production-ready blocks, {SITES.length} complete site templates and the theme customiser. You pay once, keep it forever and get updates for life.
          </p>
          <div className="onl-row" style={{ justifyContent: "center", marginTop: 24 }}>
            <Link href="/docs/components/buttons" className="onl-btn onl-btn--lg">
              Explore components
            </Link>
            <Link href="/pricing" className="onl-btn onl-btn--brand onl-btn--lg">
              See pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
