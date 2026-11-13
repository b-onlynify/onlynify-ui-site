import { DocsNav, DocsMobileNav } from "./nav";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="onl-container onl-container--xl site-docs">
      <aside className="site-docs__nav">
        <DocsNav />
      </aside>
      <div style={{ minWidth: 0 }}>
        <div className="site-docs__mobile" style={{ marginBottom: 20 }}>
          <DocsMobileNav />
        </div>
        {children}
      </div>
    </div>
  );
}
