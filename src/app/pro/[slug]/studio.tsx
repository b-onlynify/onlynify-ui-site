"use client";

import { useEffect, useMemo, useState } from "react";
import { CopyButton, FrameworkCode } from "@/components/client";
import { downloadText, ThemePanel, type SavedTheme } from "@/components/theme-panel";
import type { CodeFile } from "@/lib/convert";
import { DEFAULT_THEME, encodeTheme, freeSubset, needsPro, themeCss, type Theme } from "@/lib/theme";
import { zip } from "@/lib/zip";

const WIDTHS = { desktop: "100%", tablet: "820px", mobile: "390px" } as const;
const FRAMEWORKS = ["html", "react", "vue", "angular"] as const;
type Plan = "free" | "pro" | "team";

/**
 * Pro component studio: live preview (public), theme customiser and code.
 * Code access by licence type: Free → locked, Pro → Pro-tier components with brand/style presets,
 * Team → every component with the fully customised theme baked into the code.
 */
export function ProStudio({
  slug,
  title,
  height,
  tier,
  plan,
  signedIn,
  saved: initialSaved,
  initialTheme,
}: {
  slug: string;
  title: string;
  height: number;
  tier: "pro" | "team";
  plan: Plan;
  signedIn: boolean;
  saved: SavedTheme[];
  initialTheme: Theme;
}) {
  const team = plan === "team";
  const entitled = plan === "team" || (plan === "pro" && tier === "pro");
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
  const src = `/preview/pro/${slug}?theme=${enc}&mode=${mode}`;
  // What the code will actually contain for this licence (Pro: presets only).
  const codeTheme = team ? theme : freeSubset(theme);
  const reduced = !team && needsPro(theme);

  useEffect(() => {
    if (view !== "code" || !entitled) return;
    let cancelled = false;
    setLoading(true);
    setCodeError(null);
    Promise.all(
      FRAMEWORKS.map((fw) =>
        fetch(`/api/pro/${slug}?framework=${fw}&theme=${enc}&view=1`).then(async (r) => {
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
  }, [view, entitled, slug, enc]);

  const cli = `npx onlynify-ui add ${slug}`;
  const [zipFw, setZipFw] = useState<(typeof FRAMEWORKS)[number]>("react");
  const [zipping, setZipping] = useState(false);
  async function downloadZip() {
    setZipping(true);
    try {
      const r = await fetch(`/api/pro/${slug}?framework=${zipFw}&theme=${encodeTheme(theme)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.message ?? "Download failed.");
      const blob = new Blob([zip(j.files)], { type: "application/zip" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${slug}-${zipFw}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } catch (e) {
      setCodeError((e as Error).message);
    } finally {
      setZipping(false);
    }
  }

  return (
    <div className={`site-studio${panel ? "" : " site-studio--wide"}`}>
      {panel && (
        <aside className="onl-card onl-card--pad site-studio__panel">
          <div className="onl-row onl-row--between" style={{ marginBottom: 12 }}>
            <b>Customise</b>
            <button type="button" className="onl-btn onl-btn--ghost onl-btn--sm" onClick={() => setTheme(DEFAULT_THEME)}>
              Reset
            </button>
          </div>
          <p className="onl-text-xs onl-text-muted" style={{ marginBottom: 12 }}>
            {team
              ? "Team: everything you change here is built into the code you copy or download."
              : plan === "pro"
                ? "Pro: brand and style presets go into your code. Custom colours, radius, font and density need Team."
                : "Try any look in the preview. A licence puts it into the code."}
          </p>
          <ThemePanel value={theme} onChange={setTheme} pro={plan !== "free"} customAllowed={team} lockLabel="TEAM" signedIn={signedIn} saved={saved} onSaved={setSaved} compact />
        </aside>
      )}
      <div className="site-viewer">
        <div className="site-viewer__bar">
          <div className="onl-row" style={{ ["--onl-gap" as string]: "6px" }}>
            <button type="button" className="onl-btn onl-btn--ghost onl-btn--sm" aria-pressed={panel} onClick={() => setPanel((p) => !p)}>
              {panel ? "Hide panel" : "Customise"}
            </button>
            <div className="onl-tabs onl-tabs--pill" role="tablist" aria-label="View">
              <button type="button" role="tab" className="onl-tab" aria-selected={view === "preview"} onClick={() => setView("preview")}>Preview</button>
              <button type="button" role="tab" className="onl-tab" aria-selected={view === "code"} onClick={() => setView("code")}>Code</button>
            </div>
          </div>
          {view === "preview" ? (
            <div className="onl-row" style={{ ["--onl-gap" as string]: "6px" }}>
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
            entitled && (
              <div className="onl-row" style={{ ["--onl-gap" as string]: "6px" }}>
                <select className="onl-select" style={{ width: "auto", height: 30 }} aria-label="Framework for download" value={zipFw} onChange={(e) => setZipFw(e.target.value as (typeof FRAMEWORKS)[number])}>
                  {FRAMEWORKS.map((f) => <option key={f} value={f}>{f === "html" ? "HTML" : f[0].toUpperCase() + f.slice(1)}</option>)}
                </select>
                <button type="button" className="onl-btn onl-btn--brand onl-btn--sm" aria-busy={zipping} onClick={downloadZip}>Download .zip</button>
                <button type="button" className="onl-btn onl-btn--sm" onClick={() => downloadText("theme.css", themeCss(codeTheme))}>theme.css</button>
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
            <iframe title={`${title} preview`} src={src} className="site-viewer__frame" style={{ maxWidth: WIDTHS[width], height }} />
          </div>
        ) : !entitled ? (
          <div className="site-lock">
            <span className="site-pro">{tier === "team" ? "TEAM" : "PRO"}</span>
            <h3 className="onl-h3">{tier === "team" ? "This is a Team component" : "This is a Pro component"}</h3>
            <p className="onl-text-muted" style={{ maxWidth: 480 }}>
              {tier === "team"
                ? plan === "pro"
                  ? "Your Pro licence covers every Pro component. Team adds the Team-only components and fully customised code."
                  : "Get the source for HTML, React, Vue and Angular with a Team licence, including your own colours, radius, font and density."
                : "The free kit has the basic version of this component. Pro gives you this full version for HTML, React, Vue and Angular, plus CLI access."}
            </p>
            <div className="onl-row" style={{ justifyContent: "center" }}>
              <a className="onl-btn onl-btn--brand" href="/pricing">{tier === "team" && plan === "pro" ? "Upgrade to Team" : "View pricing"}</a>
              {!signedIn && <a className="onl-btn" href={`/login?next=/pro/${slug}`}>Sign in</a>}
            </div>
          </div>
        ) : codeError ? (
          <div className="site-lock"><p className="onl-text-muted">{codeError}</p></div>
        ) : loading || !files ? (
          <div className="site-lock"><span className="onl-spinner" aria-label="Loading code" /></div>
        ) : (
          <>
            {reduced && <p className="onl-text-xs onl-text-muted" style={{ padding: "8px 14px" }}>Your code uses the brand and style presets. Custom colours, radius, font and density are added to the code with a Team licence.</p>}
            {team && needsPro(theme) && <p className="onl-text-xs onl-text-muted" style={{ padding: "8px 14px" }}>Code includes your custom theme in theme.css.</p>}
            <FrameworkCode files={files} />
          </>
        )}
      </div>
    </div>
  );
}
