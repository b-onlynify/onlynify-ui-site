"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { GUIDES } from "@/lib/guides";
import { COMPONENT_DOCS } from "@/lib/registry.ts";

export function DocsNav() {
  const path = usePathname();
  const activeComponent = COMPONENT_DOCS.find((component) => path === `/docs/components/${component.slug}`);
  const link = (href: string, label: string, key: string, current = path === href) => (
    <li key={key}>
      <Link className="onl-nav__link" href={href} aria-current={current ? "page" : undefined}>
        {label}
      </Link>
    </li>
  );
  return (
    <nav className="onl-nav" aria-label="Documentation">
      <div>
        <p className="onl-nav__title">Getting started</p>
        <ul className="onl-nav__list">{GUIDES.map((g) => link(`/docs/${g.slug}`, g.title, g.slug))}</ul>
      </div>
      <div>
        <p className="onl-nav__title">Components</p>
        <ul className="onl-nav__list">
          {link("/docs/components", "All components", "all-components")}
          {COMPONENT_DOCS.map((component) =>
            link(
              `/docs/components/${component.slug}`,
              component.name,
              component.name,
              component === activeComponent,
            ),
          )}
        </ul>
      </div>
      <div>
        <p className="onl-nav__title">More</p>
        <ul className="onl-nav__list">
          {link("/pro", "Pro components", "pro")}
          {link("/blocks", "Blocks", "blocks")}
          {link("/sites", "Site templates", "sites")}
          {link("/themes", "Theme builder", "themes")}
        </ul>
      </div>
    </nav>
  );
}

export function DocsMobileNav() {
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
        {COMPONENT_DOCS.map((component) => (
          <option key={component.name} value={`/docs/components/${component.slug}`}>
            {component.name}
          </option>
        ))}
      </optgroup>
    </select>
  );
}
