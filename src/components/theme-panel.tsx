"use client";

import { useState } from "react";
import { BRAND_PRESETS, contrast, DENSITIES, encodeTheme, FONTS, isHex, LAYOUT_INFO, LAYOUTS, needsPro, STYLE_INFO, STYLES, themeCss, type Density, type LayoutName, type StyleName, type Theme } from "@/lib/theme";

export type SavedTheme = { id: string; name: string; theme: Theme; updatedAt?: string };

const Lock = ({ label = "PRO" }: { label?: string }) => <span className="site-pro" title={`${label === "PRO" ? "Pro" : "Team"} feature`}>{label}</span>;

/** Copy text, or download it as a file. */
async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
export function downloadText(name: string, text: string, type = "text/css") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/**
 * Theme controls. Free: brand presets and style presets. Pro: custom brand and accent colours, radius,
 * font, density, saving to the account and exporting the CSS. Locked controls stay visible so
 * people can see what Pro unlocks; the server enforces saving and code downloads.
 */
export function ThemePanel({
  value,
  onChange,
  pro,
  signedIn,
  saved,
  onSaved,
  compact,
  customAllowed,
  lockLabel = "PRO",
}: {
  value: Theme;
  onChange: (t: Theme) => void;
  pro: boolean;
  signedIn: boolean;
  saved: SavedTheme[];
  onSaved: (list: SavedTheme[]) => void;
  compact?: boolean;
  /** Custom colours, radius, font and density (defaults to `pro`). */
  customAllowed?: boolean;
  lockLabel?: string;
}) {
  const canCustom = customAllowed ?? pro;
  const [name, setName] = useState(value.name ?? "");
  const [msg, setMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<Theme>) => onChange({ ...value, ...patch });
  const custom = isHex(value.brand);
  const brandHex = custom ? value.brand : BRAND_PRESETS[value.brand]?.light ?? "#1449a0";
  const lowContrast = custom && contrast(value.brand, "#ffffff") < 3;
  const flash = (tone: "success" | "danger", text: string) => {
    setMsg({ tone, text });
    setTimeout(() => setMsg(null), 3500);
  };

  async function save() {
    if (!name.trim()) return flash("danger", "Give the theme a name.");
    setBusy(true);
    try {
      const r = await fetch("/api/themes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, theme: value }) });
      const j = await r.json();
      if (!r.ok) return flash("danger", j.message ?? "Couldn't save.");
      onSaved([j, ...saved.filter((t) => t.id !== j.id)]);
      flash("success", `Saved "${j.name}".`);
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    const r = await fetch(`/api/themes/${id}`, { method: "DELETE" });
    if (r.ok) onSaved(saved.filter((t) => t.id !== id));
  }

  const css = themeCss(value);
  const exportable = canCustom || !needsPro(value);

  return (
    <div className="onl-stack" style={{ ["--onl-gap" as string]: compact ? "16px" : "20px" }}>
      <fieldset className="onl-fieldset">
        <legend>Brand colour</legend>
        <div className="onl-row" style={{ ["--onl-gap" as string]: "8px" }}>
          {Object.entries(BRAND_PRESETS).map(([id, p]) => (
            <button key={id} type="button" aria-label={p.label} title={p.label} aria-pressed={value.brand === id} onClick={() => set({ brand: id, brandDark: undefined })} className="site-swatch" style={{ background: p.light }} />
          ))}
        </div>
        <div className="onl-row" style={{ ["--onl-gap" as string]: "8px", marginTop: 10 }}>
          <label className="onl-chip" style={{ cursor: canCustom ? "pointer" : "not-allowed", opacity: canCustom ? 1 : 0.6 }} aria-pressed={custom}>
            <input type="color" disabled={!canCustom} value={brandHex} onChange={(e) => set({ brand: e.target.value })} aria-label="Custom brand colour" style={{ width: 18, height: 18, border: 0, padding: 0, background: "none" }} />
            Custom colour
          </label>
          <label className="onl-chip" style={{ cursor: canCustom ? "pointer" : "not-allowed", opacity: canCustom ? 1 : 0.6 }} aria-pressed={Boolean(value.accent)}>
            <input type="color" disabled={!canCustom} value={value.accent ?? "#db2777"} onChange={(e) => set({ accent: e.target.value })} aria-label="Accent colour" style={{ width: 18, height: 18, border: 0, padding: 0, background: "none" }} />
            Accent
          </label>
          {value.accent && canCustom && (
            <button type="button" className="onl-btn onl-btn--ghost onl-btn--sm" onClick={() => set({ accent: undefined })}>
              Reset accent
            </button>
          )}
          {!canCustom && <Lock label={lockLabel} />}
        </div>
        {lowContrast && <p className="onl-help" style={{ color: "var(--onl-warning)", marginTop: 6 }}>Low contrast with white text ({contrast(value.brand, "#ffffff").toFixed(1)}:1). Pick a darker colour for buttons.</p>}
      </fieldset>

      <fieldset className="onl-fieldset">
        <legend>Style</legend>
        <div className="onl-choices" style={{ ["--onl-min" as string]: compact ? "120px" : "140px" }}>
          {STYLES.map((s) => (
            <label key={s} className="onl-choice" style={{ padding: 10 }}>
              <input type="radio" name="tp-style" checked={value.style === s} onChange={() => set({ style: s as StyleName })} />
              <span>
                <span className="onl-choice__title" style={{ textTransform: "capitalize" }}>{s}</span>
                {!compact && <span className="onl-choice__desc">{STYLE_INFO[s as StyleName]}</span>}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="onl-fieldset">
        <legend>Layout</legend>
        <div className="onl-choices" style={{ ["--onl-min" as string]: compact ? "120px" : "140px" }}>
          {LAYOUTS.map((l) => (
            <label key={l} className="onl-choice" style={{ padding: 10 }}>
              <input type="radio" name="tp-layout" checked={(value.layout ?? "classic") === l} onChange={() => set({ layout: l === "classic" ? undefined : (l as LayoutName) })} />
              <span>
                <span className="onl-choice__title">{LAYOUT_INFO[l].label}</span>
                {!compact && <span className="onl-choice__desc">{LAYOUT_INFO[l].text}</span>}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="onl-fieldset" disabled={!canCustom} style={{ opacity: canCustom ? 1 : 0.6 }}>
        <legend>
          Shape &amp; type {!canCustom && <Lock label={lockLabel} />}
        </legend>
        <div className="onl-stack" style={{ ["--onl-gap" as string]: "14px" }}>
          <div className="onl-slider">
            <div className="onl-slider__head">
              <label htmlFor="tp-radius">Corner radius</label>
              <output>{value.radius ?? "style default"}{value.radius !== undefined ? "px" : ""}</output>
            </div>
            <input type="range" className="onl-range" id="tp-radius" min={0} max={24} value={value.radius ?? 10} onChange={(e) => set({ radius: Number(e.target.value) })} />
          </div>
          <div className="onl-field">
            <label className="onl-label" htmlFor="tp-font">Font</label>
            <select className="onl-select" id="tp-font" value={value.font ?? "system"} onChange={(e) => set({ font: e.target.value })}>
              {Object.entries(FONTS).map(([k, f]) => (
                <option key={k} value={k}>
                  {f.label}
                </option>
              ))}
            </select>
            <p className="onl-help">System font stacks: nothing to download or license.</p>
          </div>
          <div>
            <p className="onl-label">Density</p>
            <div className="onl-segmented onl-segmented--block" role="radiogroup" aria-label="Density">
              {DENSITIES.map((d) => (
                <label key={d} style={{ textTransform: "capitalize" }}>
                  <input type="radio" name="tp-density" checked={(value.density ?? "default") === d} onChange={() => set({ density: d as Density })} /> {d}
                </label>
              ))}
            </div>
          </div>
          {canCustom && (value.radius !== undefined || value.font || value.density) && (
            <button type="button" className="onl-btn onl-btn--ghost onl-btn--sm" style={{ alignSelf: "flex-start" }} onClick={() => set({ radius: undefined, font: undefined, density: undefined })}>
              Reset shape &amp; type
            </button>
          )}
        </div>
      </fieldset>

      <fieldset className="onl-fieldset">
        <legend>Save &amp; export {!pro && <Lock />}</legend>
        {pro ? (
          <div className="onl-stack" style={{ ["--onl-gap" as string]: "10px" }}>
            <div className="onl-row onl-row--nowrap" style={{ ["--onl-gap" as string]: "6px" }}>
              <input className="onl-input onl-input--sm" placeholder="Theme name" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} aria-label="Theme name" />
              <button type="button" className="onl-btn onl-btn--brand onl-btn--sm" aria-busy={busy} onClick={save}>
                Save
              </button>
            </div>
            {saved.length > 0 && (
              <ul className="onl-stack" style={{ ["--onl-gap" as string]: "6px", listStyle: "none", padding: 0, margin: 0 }}>
                {saved.map((t) => (
                  <li key={t.id} className="onl-row onl-row--between onl-row--nowrap" style={{ ["--onl-gap" as string]: "6px" }}>
                    <button type="button" className="onl-btn onl-btn--ghost onl-btn--sm" style={{ justifyContent: "flex-start", flex: 1 }} onClick={() => (onChange(t.theme), setName(t.name))}>
                      <span className="site-swatch site-swatch--sm" style={{ background: isHex(t.theme.brand) ? t.theme.brand : BRAND_PRESETS[t.theme.brand]?.light }} />
                      {t.name}
                    </button>
                    <button type="button" className="onl-btn onl-btn--ghost onl-btn--icon onl-btn--sm" aria-label={`Delete ${t.name}`} onClick={() => remove(t.id)}>
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <p className="onl-text-sm onl-text-muted">
            Pro saves your themes to your account and applies them to every site template and code download. {signedIn ? <a href="/pricing">Upgrade</a> : <a href="/login?next=/themes">Sign in</a>}
          </p>
        )}
        <div className="onl-row" style={{ ["--onl-gap" as string]: "6px", marginTop: 10 }}>
          <button type="button" className="onl-btn onl-btn--sm" disabled={!exportable} onClick={async () => flash((await copy(css)) ? "success" : "danger", "CSS copied.")}>
            Copy CSS
          </button>
          <button type="button" className="onl-btn onl-btn--sm" disabled={!exportable} onClick={() => downloadText(`${(value.name || name || "theme").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.css`, css)}>
            Download theme.css
          </button>
          <button type="button" className="onl-btn onl-btn--ghost onl-btn--sm" onClick={async () => flash((await copy(`${location.origin}${location.pathname}?theme=${encodeTheme(value)}`)) ? "success" : "danger", "Share link copied.")}>
            Share link
          </button>
        </div>
      </fieldset>
      {msg && (
        <p className={`onl-badge onl-badge--${msg.tone}`} role="status" style={{ alignSelf: "flex-start" }}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
