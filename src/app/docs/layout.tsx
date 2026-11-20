import { icon } from "onlynify-ui";
import { loadAllIcons } from "onlynify-ui/icons/all";
import { componentIcon } from "@/lib/component-icons";
import { GUIDES } from "@/lib/guides";
import { PRO_COMPONENTS } from "@/lib/pro-components";
import { COMPONENT_DOCS } from "@/lib/registry.ts";
import { DocsMobileNav, DocsNav, type NavItem, type ProLink } from "./nav";

loadAllIcons();
const svg = (name: string) => icon(name, { size: 16 });

/** Pro components for the sidebar, A–Z (listed after the free components). */
const PRO: ProLink[] = PRO_COMPONENTS.map((p) => ({ slug: p.slug, title: p.title, tier: p.tier })).sort((a, b) => a.title.localeCompare(b.title));

/** One button per free component, A–Z, with its icon (rendered here, so the icon set never reaches the browser). No badge: only paid items (the Pro list) carry PRO / TEAM. */
const COMPONENTS: NavItem[] = [...COMPONENT_DOCS]
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((c) => ({ href: `/docs/components/${c.slug}`, label: c.name, svg: svg(componentIcon(c.slug)), keywords: `${c.group ?? ""} ${c.description ?? ""}`.toLowerCase() }));

const GUIDE_ICONS: Record<string, string> = { introduction: "book-open", installation: "download", icons: "shapes", theming: "palette", grid: "layout-grid", charts: "chart-column", cli: "square-terminal", license: "scale" };
const GUIDE_ITEMS: NavItem[] = GUIDES.map((g) => ({ href: `/docs/${g.slug}`, label: g.title, svg: svg(GUIDE_ICONS[g.slug] ?? "book-open") }));
const MORE_ITEMS: NavItem[] = [
  { href: "/blocks", label: "Blocks", svg: svg("blocks") },
  { href: "/sites", label: "Site templates", svg: svg("layout-template") },
  { href: "/themes", label: "Theme builder", svg: svg("paintbrush") },
];
const ALL = { href: "/docs/components", label: "All components", svg: svg("layout-grid"), badge: String(COMPONENT_DOCS.length) };
const PRO_ALL = { href: "/pro", label: "All Pro components", svg: svg("sparkles"), badge: String(PRO.length) };
const PRO_ICON = svg("gem");

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-docs">
      <aside className="site-docs__nav">
        <DocsNav guides={GUIDE_ITEMS} components={COMPONENTS} all={ALL} pro={PRO} proAll={PRO_ALL} proIcon={PRO_ICON} more={MORE_ITEMS} />
      </aside>
      <div style={{ minWidth: 0 }}>
        <div className="site-docs__mobile" style={{ marginBottom: 20 }}>
          <DocsMobileNav pro={PRO} />
        </div>
        {children}
      </div>
    </div>
  );
}
