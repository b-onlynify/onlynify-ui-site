"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { GUIDES } from "@/lib/guides";
import { COMPONENT_DOCS } from "@/lib/registry.ts";

export type ProLink = { slug: string; title: string; tier: string };
/** One sidebar button. `svg` is rendered on the server from the core + extended icon sets. */
export type NavItem = { href: string; label: string; svg: string; badge?: string; keywords?: string };

/** Free components A–Z for the mobile picker. */
const FREE = [...COMPONENT_DOCS].sort((a, b) => a.name.localeCompare(b.name));

function NavButton({ item, current, tone }: { item: NavItem; current: boolean; tone?: "pro" | "team" }) {
  return (
    <li>
      <Link className="site-navbtn" href={item.href} aria-current={current ? "page" : undefined}>
        <span className="site-navbtn__icon" dangerouslySetInnerHTML={{ __html: item.svg }} />
        <span className="site-navbtn__label">{item.label}</span>
        {item.badge && (
          <span className="site-navbtn__badge" data-tone={tone ?? (/^\d+$/.test(item.badge) ? "count" : "pro")}>
            {item.badge}
          </span>
        )}
      </Link>
    </li>
  );
}

export function DocsNav({
  guides,
  components,
  all,
  pro,
  proAll,
  proIcon,
  more,
}: {
  guides: NavItem[];
  components: NavItem[];
  all: NavItem;
  pro: ProLink[];
  proAll: NavItem;
  proIcon: string;
  more: NavItem[];
}) {
  const path = usePathname();
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const list = term ? components.filter((c) => c.label.toLowerCase().includes(term) || c.keywords?.includes(term)) : components;
  const proList = term ? pro.filter((p) => p.title.toLowerCase().includes(term)) : pro;

  return (
    <nav className="site-navbtns" aria-label="Documentation">
      <div className="site-navbtns__search">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input className="onl-input onl-input--sm" type="search" placeholder="Find a component…" aria-label="Find a component" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Escape" && setQ("")} />
      </div>

      {!term && (
        <div>
          <p className="site-navbtns__title">Getting started</p>
          <ul className="site-navbtns__list">{guides.map((g) => <NavButton key={g.href} item={g} current={path === g.href} />)}</ul>
        </div>
      )}

      <div>
        <p className="site-navbtns__title">
          Components <span className="site-navbtns__count">{term ? `${list.length} of ${components.length}` : components.length}</span>
        </p>
        <ul className="site-navbtns__list">
          {!term && <NavButton item={all} current={path === all.href} />}
          {list.map((c) => (
            <NavButton key={c.href} item={c} current={path === c.href} />
          ))}
          {term && list.length === 0 && <li className="site-navbtns__empty">No component matches “{q.trim()}”.</li>}
        </ul>
      </div>

      {proList.length > 0 && (
        <div>
          <p className="site-navbtns__title">Pro components</p>
          <ul className="site-navbtns__list">
            {!term && <NavButton item={proAll} current={path === proAll.href} />}
            {proList.map((p) => (
              <NavButton key={p.slug} item={{ href: `/pro/${p.slug}`, label: p.title, svg: proIcon, badge: p.tier === "team" ? "TEAM" : "PRO" }} current={path === `/pro/${p.slug}`} tone={p.tier === "team" ? "team" : "pro"} />
            ))}
          </ul>
        </div>
      )}

      {!term && (
        <div>
          <p className="site-navbtns__title">More</p>
          <ul className="site-navbtns__list">{more.map((m) => <NavButton key={m.href} item={m} current={path === m.href} />)}</ul>
        </div>
      )}
    </nav>
  );
}

export function DocsMobileNav({ pro }: { pro: ProLink[] }) {
  const path = usePathname();
  const router = useRouter();
  return (
    <select className="onl-select" aria-label="Go to page" value={path} onChange={(e) => router.push(e.target.value)}>
      <optgroup label="Getting started">
        {GUIDES.map((g) => (
          <option key={g.slug} value={`/docs/${g.slug}`}>
            {g.title}
          </option>
        ))}
      </optgroup>
      <optgroup label="Components">
        <option value="/docs/components">All components</option>
        {FREE.map((component) => (
          <option key={component.name} value={`/docs/components/${component.slug}`}>
            {component.name}
          </option>
        ))}
      </optgroup>
      <optgroup label="Pro components">
        <option value="/pro">All Pro components</option>
        {pro.map((p) => (
          <option key={p.slug} value={`/pro/${p.slug}`}>
            {p.title}
          </option>
        ))}
      </optgroup>
    </select>
  );
}
