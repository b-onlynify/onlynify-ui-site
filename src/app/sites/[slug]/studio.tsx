"use client";

import { useEffect, useMemo, useState } from "react";
import { CopyButton, FrameworkCode } from "@/components/client";
import { downloadText, ThemePanel, type SavedTheme } from "@/components/theme-panel";
import type { CodeFile } from "@/lib/convert";
import { BRAND_PRESETS, encodeTheme, FONTS, isHex, LAYOUT_INFO, needsPro, themeCss, type Theme } from "@/lib/theme";
import { zip } from "@/lib/zip";

const WIDTHS = { desktop: "100%", tablet: "820px", mobile: "390px" } as const;
const FRAMEWORKS = ["html", "react", "vue", "angular"] as const;

export type VariantCard = { id: string; name: string; tagline: string; description: string; theme: Theme };
const swatch = (c: string | undefined) => (c ? (isHex(c) ? c : BRAND_PRESETS[c]?.light) : undefined);

/**
 * Site studio: page tabs, device sizes, light/dark, live theme customisation and (Pro) the code.
 * The preview iframe is public; the code comes from /api/sites/<slug>, which checks the licence.
 */
export function SiteStudio({
  slug,
  pages,
  variants,
  initialVariant,
  initialTheme,
  pro,
  signedIn,
  saved: initialSaved,
}: {
  slug: string;
  pages: { slug: string; title: string; height: number }[];
  variants: VariantCard[];
  initialVariant: string;
  initialTheme: Theme;
  pro: boolean;
  signedIn: boolean;
  saved: SavedTheme[];
}) {
  const [variant, setVariant] = useState(initialVariant);
  const current = variants.find((v) => v.id === variant) ?? variants[0];
  const [page, setPage] = useState(pages[0].slug);
  const [width, setWidth] = useState<keyof typeof WIDTHS>("desktop");
  const [mode, setMode] = useState<"light" | "dark">("light");
  const [view, setView] = useState<"preview" | "code">("preview");
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [saved, setSaved] = useState(initialSaved);
  const [panel, setPanel] = useState(true);
  const [applied, setApplied] = useState(theme);
  const [files, setFiles] = useState<Record<string, CodeFile[]> | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const h = setTimeout(() => setApplied(theme), 220);
    return () => clearTimeout(h);
  }, [theme]);
  const enc = useMemo(() => encodeTheme(applied), [applied]);
  const src = `/preview/site/${slug}/${page}?variant=${variant}&theme=${enc}&mode=${mode}`;

  /** A variation replaces the copy on every page and the theme + layout; the theme panel then fine-tunes it. */
  function chooseVariant(v: VariantCard) {
    setVariant(v.id);
    setTheme(v.theme);
    setApplied(v.theme);
    setFiles(null);
    const u = new URL(window.location.href);
    u.searchParams.set("variant", v.id);
    u.searchParams.delete("theme");
    window.history.replaceState(null, "", u);
  }
  const height = pages.find((p) => p.slug === page)?.height ?? 2400;

  // Code follows the current theme; refetch when it changes while the code tab is open.
  useEffect(() => {
    if (view !== "code" || !pro) return;
    let cancelled = false;
    setLoading(true);
    setCodeError(null);
    Promise.all(
      FRAMEWORKS.map((fw) =>
        fetch(`/api/sites/${slug}?framework=${fw}&variant=${variant}&theme=${enc}&view=1`).then(async (r) => {
          const j = await r.json();
          if (!r.ok) throw new Error(j.message ?? "Couldn't load the code.");
          return [fw, (j.files as { path: string; content: string }[]).map((f) => ({ ...f, language: f.path.split(".").pop() ?? "txt" }))] as const;
        }),
      ),
    )
      .then((pairs) => !cancelled && setFiles(Object.fromEntries(pairs)))
      .catch((e: Error) => !cancelled && setCodeError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [view, pro, slug, enc, variant]);

  const cli = `npx onlynify-ui add ${slug}`;
  const custom = needsPro(theme);
  const [zipFw, setZipFw] = useState<(typeof FRAMEWORKS)[number]>("react");
  const [zipping, setZipping] = useState(false);
  async function downloadZip() {
    setZipping(true);
    try {
      const r = await fetch(`/api/sites/${slug}?framework=${zipFw}&variant=${variant}&theme=${encodeTheme(theme)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.message ?? "Download failed.");
      const blob = new Blob([zip(j.files)], { type: "application/zip" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${slug}${variant === "original" ? "" : `-${variant}`}-${zipFw}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } catch (e) {
      setCodeError((e as Error).message);
    } finally {
      setZipping(false);
    }
  }

  return (
    <>
    <section className="site-variants" aria-labelledby="pro-setup-title">
      <div className="onl-row onl-row--between" style={{ alignItems: "flex-end", marginBottom: 14 }}>
        <div style={{ maxWidth: 720 }}>
          <p className="onl-eyebrow">Pro setup <span className="site-pro">PRO</span></p>
          <h2 id="pro-setup-title" className="onl-h3" style={{ marginTop: 6 }}>Start from a ready-made variation</h2>
          <p className="onl-text-sm onl-text-muted" style={{ marginTop: 4 }}>
            Each variation changes the business name, headlines and copy on every page, and switches the theme and page layout. Then fine-tune colours, style and layout in the theme panel.
          </p>
        </div>
        <span className="onl-badge">{variants.length} variations</span>
      </div>
      <div className="site-variants__grid">
        {variants.map((v) => {
          const active = v.id === variant;
          return (
            <div key={v.id} className="onl-card onl-card--interactive site-block-card site-variant" data-active={active} onClick={() => !active && chooseVariant(v)}>
              <div className="onl-card__media">
                <iframe title={`${v.name} preview`} src={`/preview/site/${slug}/home?thumb=1&variant=${v.id}`} loading="lazy" tabIndex={-1} aria-hidden="true" />
              </div>
              <div className="onl-card__body">
                <div className="onl-row onl-row--between onl-row--nowrap" style={{ ["--onl-gap" as string]: "8px" }}>
                  <h3 className="onl-h4 onl-truncate">{v.name}</h3>
                  <span className="onl-row onl-row--nowrap" style={{ ["--onl-gap" as string]: "4px" }} aria-hidden="true">
                    <span className="site-swatch site-swatch--sm" style={{ background: swatch(v.theme.brand) }} />
                    {v.theme.accent && <span className="site-swatch site-swatch--sm" style={{ background: v.theme.accent }} />}
                  </span>
                </div>
                <p className="onl-text-xs onl-text-muted" style={{ marginTop: 2 }}>
                  {v.tagline} · {LAYOUT_INFO[v.theme.layout ?? "classic"].label} layout · <span style={{ textTransform: "capitalize" }}>{v.theme.style}</span>
                  {v.theme.font && v.theme.font !== "system" ? ` · ${FONTS[v.theme.font]?.label}` : ""}
                </p>
                <p className="onl-text-sm" style={{ marginTop: 8 }}>{v.description}</p>
                <button type="button" className={`onl-btn onl-btn--sm ${active ? "" : "onl-btn--brand"}`} style={{ marginTop: 12 }} aria-pressed={active} disabled={active} onClick={(e) => (e.stopPropagation(), chooseVariant(v))}>
                  {active ? "Selected" : "Use this variation"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
    <div className={`site-studio${panel ? "" : " site-studio--wide"}`}>
      {panel && (
        <aside className="onl-card onl-card--pad site-studio__panel">
          <div className="onl-row onl-row--between" style={{ marginBottom: 12 }}>
            <b>Theme</b>
            <button type="button" className="onl-btn onl-btn--ghost onl-btn--sm" onClick={() => setTheme(current.theme)}>
              Reset to {current.name}
            </button>
          </div>
          <ThemePanel value={theme} onChange={setTheme} pro={pro} signedIn={signedIn} saved={saved} onSaved={setSaved} compact />
        </aside>
      )}
      <div className="site-viewer">
        <div className="site-viewer__bar">
          <div className="onl-row" style={{ ["--onl-gap" as string]: "6px" }}>
            <button type="button" className="onl-btn onl-btn--ghost onl-btn--sm" aria-pressed={panel} onClick={() => setPanel((p) => !p)}>
              {panel ? "Hide theme" : "Theme"}
            </button>
            <div className="onl-tabs onl-tabs--pill" role="tablist" aria-label="View">
              <button type="button" role="tab" className="onl-tab" aria-selected={view === "preview"} onClick={() => setView("preview")}>Preview</button>
              <button type="button" role="tab" className="onl-tab" aria-selected={view === "code"} onClick={() => setView("code")}>Code</button>
            </div>
          </div>
          {view === "preview" ? (
            <div className="onl-row" style={{ ["--onl-gap" as string]: "6px" }}>
              <div className="onl-segmented" role="radiogroup" aria-label="Page">
                {pages.map((p) => (
                  <label key={p.slug}>
                    <input type="radio" name="studio-page" checked={page === p.slug} onChange={() => setPage(p.slug)} /> {p.title}
                  </label>
                ))}
              </div>
              <div className="onl-btn-group site-hide-xs" role="group" aria-label="Viewport">
                {(Object.keys(WIDTHS) as (keyof typeof WIDTHS)[]).map((w) => (
                  <button key={w} type="button" className="onl-btn onl-btn--sm" aria-pressed={width === w} onClick={() => setWidth(w)}>
                    {w[0].toUpperCase() + w.slice(1)}
                  </button>
                ))}
              </div>
              <button type="button" className="onl-btn onl-btn--sm" onClick={() => setMode((m) => (m === "light" ? "dark" : "light"))}>
                {mode === "light" ? "Dark" : "Light"}
              </button>
              <a className="onl-btn onl-btn--sm" href={src} target="_blank" rel="noopener">Open</a>
            </div>
          ) : (
            pro && (
              <div className="onl-row" style={{ ["--onl-gap" as string]: "6px" }}>
                <select className="onl-select" style={{ width: "auto", height: 30 }} aria-label="Framework for download" value={zipFw} onChange={(e) => setZipFw(e.target.value as (typeof FRAMEWORKS)[number])}>
                  {FRAMEWORKS.map((f) => <option key={f} value={f}>{f === "html" ? "HTML" : f[0].toUpperCase() + f.slice(1)}</option>)}
                </select>
                <button type="button" className="onl-btn onl-btn--brand onl-btn--sm" aria-busy={zipping} onClick={downloadZip}>Download .zip</button>
                <button type="button" className="onl-btn onl-btn--sm" onClick={() => downloadText("theme.css", themeCss(theme))}>theme.css</button>
                <span className="site-code site-hide-xs" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "2px 4px 2px 10px", fontFamily: "var(--onl-font-mono)", fontSize: 12 }}>
                  {cli}
                  <CopyButton text={cli} />
                </span>
              </div>
            )
          )}
        </div>

        {view === "preview" ? (
          <div className="site-viewer__stage">
            <iframe key={page} title={`${slug} ${page} preview`} src={src} className="site-viewer__frame" style={{ maxWidth: WIDTHS[width], height }} />
          </div>
        ) : !pro ? (
          <div className="site-lock">
            <span className="site-pro">PRO</span>
            <h3 className="onl-h3">Site templates are a Pro feature</h3>
            <p className="onl-text-muted" style={{ maxWidth: 460 }}>
              Get every page as HTML, React, Vue or Angular, with your theme applied and a ready <code>theme.css</code>, plus CLI access. Pay once and get updates for life.
            </p>
            <div className="onl-row" style={{ justifyContent: "center" }}>
              <a className="onl-btn onl-btn--brand" href="/pricing">View pricing</a>
              {!signedIn && <a className="onl-btn" href={`/login?next=/sites/${slug}`}>Sign in</a>}
            </div>
          </div>
        ) : codeError ? (
          <div className="site-lock"><p className="onl-text-muted">{codeError}</p></div>
        ) : loading || !files ? (
          <div className="site-lock"><span className="onl-spinner" aria-label="Loading code" /></div>
        ) : (
          <>
            {custom && <p className="onl-text-xs onl-text-muted" style={{ padding: "8px 14px" }}>Code includes your custom theme in theme.css.</p>}
            <FrameworkCode files={files} />
          </>
        )}
      </div>
    </div>
    </>
  );
}
