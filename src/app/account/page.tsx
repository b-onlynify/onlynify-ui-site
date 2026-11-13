import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CodeBlock, CopyButton, SignOutButton } from "@/components/client";
import { AccountCelebration } from "@/components/celebrate";
import { currentUser } from "@/lib/auth.ts";
import { planById } from "@/lib/plans.ts";
import { BLOCKS } from "@/lib/registry.ts";
import { SITES } from "@/lib/sites.ts";
import { read } from "@/lib/store.ts";

export const metadata: Metadata = { title: "Account" };
export const dynamic = "force-dynamic";

const date = (s?: string) => (s ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(s)) : "—");
const inr = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

export default async function Account({ searchParams }: { searchParams: Promise<{ welcome?: string; joined?: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login?next=/account");
  const { welcome, joined } = await searchParams;
  const db = await read();
  const licences = db.licences.filter((l) => l.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const orders = db.orders.filter((o) => o.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const active = licences.find((l) => !l.revokedAt);

  // Usage dashboard: downloads made with this user's licence keys (CLI) or from the site while signed in.
  const prefixes = new Set(licences.map((l) => l.key.slice(0, 8)));
  const downloads = db.events.filter((e) => e.type === "block.download" && (prefixes.has(String(e.data.licence)) || e.data.userId === user.id));
  const DAY = 86_400_000;
  const days = Array.from({ length: 30 }, (_, i) => new Date(Date.now() - (29 - i) * DAY).toISOString().slice(0, 10));
  const perDay = days.map((d) => downloads.filter((e) => e.at.slice(0, 10) === d).length);
  const last30 = perDay.reduce((a, b) => a + b, 0);
  const byFw = ["html", "react", "vue", "angular"].map((fw) => ({ label: fw === "html" ? "HTML" : fw[0].toUpperCase() + fw.slice(1), value: downloads.filter((e) => e.data.framework === fw).length })).filter((x) => x.value > 0);
  const counts = new Map<string, number>();
  for (const e of downloads) counts.set(String(e.data.slug), (counts.get(String(e.data.slug)) ?? 0) + 1);
  const title = (slug: string) => (slug.startsWith("site:") ? `${SITES.find((x) => x.slug === slug.slice(5))?.title ?? slug} (site)` : (BLOCKS.find((b) => b.slug === slug)?.title ?? slug));
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([slug, value]) => ({ label: title(slug), value }));
  const proBlocks = BLOCKS.filter((b) => b.premium);
  const usedBlocks = proBlocks.filter((b) => counts.has(b.slug)).length;
  const usedSites = SITES.filter((x) => counts.has(`site:${x.slug}`)).length;
  const themes = db.themes.filter((t) => t.userId === user.id).length;
  const json = (v: unknown) => JSON.stringify(v);

  return (
    <div className="onl-container onl-container--xl" style={{ paddingBlock: "36px 64px", maxWidth: 1100 }}>
      <div className="onl-page-header">
        <div>
          <h1 className="onl-page-header__title">Hi, {user.name.split(" ")[0]}</h1>
          <p className="onl-page-header__subtitle">{user.email}</p>
        </div>
        <SignOutButton />
      </div>

      {joined && <AccountCelebration title={`Congratulations, ${user.name.split(" ")[0]}! 🎉`} message="Your Onlynify UI account is ready. Browse the components, copy free blocks, and unlock Pro whenever you need it." cta="Start building" />}
      {welcome && active && <AccountCelebration title="Pro is unlocked! 🎉" message="Payment received. Every premium block now shows its code, and your licence key works with the CLI." cta="See my licence" />}
      {welcome && active && (
        <div className="onl-alert onl-alert--success" style={{ marginBottom: 20 }}>
          <div className="onl-alert__content">
            <p className="onl-alert__title">Payment received, and Pro is unlocked</p>
            <p className="onl-alert__body">Every premium block now shows its code. Use the licence key below with the CLI.</p>
          </div>
        </div>
      )}

      {active ? (
        <section style={{ marginBottom: 20 }}>
          <div className="onl-grid onl-grid--4">
            <div className="onl-card onl-stat"><p className="onl-stat__label">Downloads, 30 days</p><p className="onl-stat__value">{last30}</p><onl-chart type="sparkline" aria-label="Downloads trend" labels={json(days)} series={json([{ name: "Downloads", data: perDay }])} /></div>
            <div className="onl-card onl-stat"><p className="onl-stat__label">Premium blocks used</p><p className="onl-stat__value">{usedBlocks}<span className="onl-text-sm onl-text-muted"> / {proBlocks.length}</span></p></div>
            <div className="onl-card onl-stat"><p className="onl-stat__label">Sites downloaded</p><p className="onl-stat__value">{usedSites}<span className="onl-text-sm onl-text-muted"> / {SITES.length}</span></p></div>
            <div className="onl-card onl-stat"><p className="onl-stat__label">Saved themes</p><p className="onl-stat__value">{themes}</p><Link href="/themes" className="onl-text-xs">Open theme builder →</Link></div>
          </div>
          <div className="onl-grid onl-grid--2" style={{ marginTop: 16 }}>
            <div className="onl-card"><div className="onl-card__header"><h2 className="onl-card__title">Downloads per day</h2></div><div className="onl-card__body"><onl-chart type="area" format="number" legend="false" aria-label="Downloads per day, last 30 days" labels={json(days.map((d) => d.slice(8) + "/" + d.slice(5, 7)))} series={json([{ name: "Downloads", data: perDay }])} /></div></div>
            <div className="onl-card"><div className="onl-card__header"><h2 className="onl-card__title">By framework</h2></div><div className="onl-card__body">{byFw.length ? <onl-chart type="donut" center-label="Downloads" aria-label="Downloads by framework" data={json(byFw)} /> : <p className="onl-text-sm onl-text-muted">No downloads yet. Open a premium block or site and download its code.</p>}</div></div>
            <div className="onl-card"><div className="onl-card__header"><h2 className="onl-card__title">Most used</h2></div><div className="onl-card__body">{top.length ? <onl-chart type="hbar" aria-label="Most downloaded blocks and sites" data={json(top)} /> : <p className="onl-text-sm onl-text-muted">Your most used blocks and sites will show here.</p>}</div></div>
            <div className="onl-card"><div className="onl-card__header"><h2 className="onl-card__title">Library explored</h2></div><div className="onl-card__body"><onl-chart type="radial" max="100" format="percent" aria-label="Share of the Pro library you have used" data={json([{ label: "Premium blocks", value: Math.round((usedBlocks / Math.max(1, proBlocks.length)) * 100) }, { label: "Site templates", value: Math.round((usedSites / Math.max(1, SITES.length)) * 100) }])} /></div></div>
          </div>
        </section>
      ) : (
        <section className="onl-card onl-card--gradient-border onl-card--pad" style={{ marginBottom: 20 }}>
          <div className="onl-row onl-row--between">
            <div><b>Unlock your Pro dashboard</b><p className="onl-text-sm onl-text-muted">Download stats, saved themes, {proBlocks.length} premium blocks and {SITES.length} site templates.</p></div>
            <Link href="/pricing" className="onl-btn onl-btn--brand">See Pro</Link>
          </div>
        </section>
      )}

      <section className="onl-card">
        <div className="onl-card__header">
          <div>
            <h2 className="onl-card__title">Licences</h2>
            <p className="onl-card__subtitle">Use a key with the CLI to download premium blocks</p>
          </div>
          {!active && <Link href="/pricing" className="onl-btn onl-btn--brand onl-btn--sm">Get Pro</Link>}
        </div>
        {licences.length === 0 ? (
          <div className="onl-empty">
            <p className="onl-empty__title">No licence yet</p>
            <p className="onl-empty__text">Everything free is already yours. Pro unlocks premium blocks.</p>
          </div>
        ) : (
          <ul className="onl-list">
            {licences.map((l) => (
              <li key={l.key} className="onl-list__item" style={{ flexWrap: "wrap" }}>
                <div className="onl-grow" style={{ minWidth: 220 }}>
                  <div className="onl-row" style={{ ["--onl-gap" as string]: "8px" }}>
                    <b>{planById(l.plan)?.name ?? l.plan}</b>
                    <span className="onl-pill onl-badge" data-status={l.revokedAt ? "expired" : "active"}>{l.revokedAt ? "Revoked" : "Active"}</span>
                    <span className="onl-text-xs onl-text-muted">{l.seats} seat{l.seats === 1 ? "" : "s"}</span>
                  </div>
                  <code className="onl-code" style={{ display: "inline-block", marginTop: 6, fontSize: 13 }}>{l.key}</code>
                  <p className="onl-text-xs onl-text-muted" style={{ marginTop: 4 }}>
                    Issued {date(l.createdAt)} · {l.downloads} CLI download{l.downloads === 1 ? "" : "s"}{l.lastUsedAt ? ` · last used ${date(l.lastUsedAt)}` : ""}
                  </p>
                </div>
                <CopyButton text={l.key} label="Copy key" className="onl-btn onl-btn--sm" />
              </li>
            ))}
          </ul>
        )}
      </section>

      {active && (
        <section style={{ marginTop: 20 }}>
          <h2 className="onl-h4" style={{ marginBottom: 8 }}>Use it with the CLI</h2>
          <CodeBlock code={`npx onlynify-ui login ${active.key}\nnpx onlynify-ui add dashboard-01`} />
        </section>
      )}

      <section className="onl-card" style={{ marginTop: 20 }}>
        <div className="onl-card__header"><h2 className="onl-card__title">Payments</h2></div>
        {orders.length === 0 ? (
          <p className="onl-text-muted" style={{ padding: 16 }}>No payments yet.</p>
        ) : (
          <div className="onl-table-wrap">
            <table className="onl-table">
              <thead><tr><th>Date</th><th>Plan</th><th className="onl-num">Amount</th><th className="onl-hide-sm">Reference</th><th>Status</th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>{date(o.createdAt)}</td>
                    <td>{planById(o.plan)?.name ?? o.plan}</td>
                    <td className="onl-num">{inr(o.amount)}</td>
                    <td className="onl-hide-sm"><code className="onl-code">{o.paymentId ?? o.id}</code>{o.gateway === "test" && <span className="onl-badge onl-badge--warning" style={{ marginLeft: 6 }}>test</span>}</td>
                    <td><span className="onl-pill onl-badge" data-status={o.status === "paid" ? "paid" : o.status === "failed" ? "failed" : "pending"}>{o.status === "created" ? "Pending" : o.status[0].toUpperCase() + o.status.slice(1)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
