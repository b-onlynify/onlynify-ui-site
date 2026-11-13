"use client";

import { useEffect, useMemo, useState } from "react";
import { ThemePanel, type SavedTheme } from "@/components/theme-panel";
import { encodeTheme, needsPro, type Theme } from "@/lib/theme";

type SiteLink = { slug: string; title: string };

/** Theme builder: controls on the left, the theme applied to real blocks on the right. */
export function ThemeBuilder({ initial, pro, signedIn, saved: initialSaved, sites }: { initial: Theme; pro: boolean; signedIn: boolean; saved: SavedTheme[]; sites: SiteLink[] }) {
  const [theme, setTheme] = useState<Theme>(initial);
  const [saved, setSaved] = useState(initialSaved);
  const [mode, setMode] = useState<"light" | "dark">("light");
  // Debounce the iframe reload while a slider or colour picker is being dragged.
  const [applied, setApplied] = useState(theme);
  useEffect(() => {
    const h = setTimeout(() => setApplied(theme), 220);
    return () => clearTimeout(h);
  }, [theme]);
  const enc = useMemo(() => encodeTheme(applied), [applied]);
  const src = `/preview/theme?theme=${enc}&mode=${mode}`;

  return (
    <div className="site-studio">
      <aside className="onl-card onl-card--pad site-studio__panel">
        <ThemePanel value={theme} onChange={setTheme} pro={pro} signedIn={signedIn} saved={saved} onSaved={setSaved} />
      </aside>
      <div className="site-viewer">
        <div className="site-viewer__bar">
          <div className="onl-tabs onl-tabs--pill" role="tablist" aria-label="Mode">
            <button type="button" role="tab" className="onl-tab" aria-selected={mode === "light"} onClick={() => setMode("light")}>Light</button>
            <button type="button" role="tab" className="onl-tab" aria-selected={mode === "dark"} onClick={() => setMode("dark")}>Dark</button>
          </div>
          <div className="onl-row" style={{ ["--onl-gap" as string]: "6px" }}>
            {!pro && needsPro(theme) && <span className="site-pro">PRO theme</span>}
            <label className="onl-text-sm onl-text-muted" htmlFor="tb-site">Try on a site</label>
            <select id="tb-site" className="onl-select onl-input--sm" style={{ width: "auto", height: 30 }} defaultValue="" onChange={(e) => e.target.value && window.open(`/sites/${e.target.value}?theme=${encodeTheme(theme)}`, "_self")}>
              <option value="">Choose…</option>
              {sites.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="site-viewer__stage">
          <iframe title="Theme preview" src={src} className="site-viewer__frame" style={{ height: 1400 }} />
        </div>
      </div>
    </div>
  );
}
