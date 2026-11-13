/**
 * Themes: one shape shared by the theme builder, site previews and code downloads.
 * Pure TypeScript with no Node or browser APIs, so it runs on the server and in the client.
 *
 * Free: brand presets + style presets (the same attributes the open-source kit ships).
 * Pro:  custom brand and accent colours, radius, font, density, saving and exporting.
 */

export const BRAND_PRESETS: Record<string, { light: string; dark: string; label: string }> = {
  onlynify: { light: "#1449a0", dark: "#74b6ff", label: "Onlynify blue" },
  indigo: { light: "#4338ca", dark: "#a5b4fc", label: "Indigo" },
  violet: { light: "#6d28d9", dark: "#b4a0ff", label: "Violet" },
  fuchsia: { light: "#a21caf", dark: "#f0abfc", label: "Fuchsia" },
  rose: { light: "#be123c", dark: "#fb7193", label: "Rose" },
  orange: { light: "#c2410c", dark: "#fdba74", label: "Orange" },
  amber: { light: "#a64b00", dark: "#fbbf24", label: "Amber" },
  lime: { light: "#3f6212", dark: "#bef264", label: "Lime" },
  emerald: { light: "#047857", dark: "#34d399", label: "Emerald" },
  teal: { light: "#0f766e", dark: "#2dd4bf", label: "Teal" },
  sky: { light: "#0369a1", dark: "#7dd3fc", label: "Sky" },
  slate: { light: "#334155", dark: "#cbd5e1", label: "Slate" },
};

export const STYLES = ["modern", "soft", "glass", "sharp", "bold"] as const;
export type StyleName = (typeof STYLES)[number];
export const STYLE_INFO: Record<StyleName, string> = {
  modern: "Hairline borders, layered shadows",
  soft: "Rounder, borderless, gentle shadows",
  glass: "Translucent cards with blur",
  sharp: "Tight corners, flat and crisp",
  bold: "Thick outlines, offset shadows",
};

/** Font stacks only: no web fonts are downloaded, so nothing new to install or license. */
export const FONTS: Record<string, { label: string; stack: string }> = {
  system: { label: "System", stack: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif' },
  humanist: { label: "Humanist", stack: 'Seravek, "Gill Sans Nova", Ubuntu, Calibri, "DejaVu Sans", source-sans-pro, sans-serif' },
  geometric: { label: "Geometric", stack: 'Avenir, Montserrat, Corbel, "URW Gothic", source-sans-pro, sans-serif' },
  rounded: { label: "Rounded", stack: 'ui-rounded, "Hiragino Maru Gothic ProN", Quicksand, Comfortaa, Manjari, "Arial Rounded MT", Calibri, sans-serif' },
  serif: { label: "Serif", stack: 'Charter, "Bitstream Charter", "Sitka Text", Cambria, Georgia, serif' },
  mono: { label: "Mono", stack: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas, monospace' },
};

export const DENSITIES = ["compact", "default", "comfortable"] as const;

/**
 * Page layouts for site templates: how heroes, section headings, navigation and surfaces are arranged.
 * Free, like style presets. Applied with data-layout on <html>; the CSS ships in onlynify-ui.css.
 */
export const LAYOUTS = ["classic", "centered", "editorial", "immersive", "minimal"] as const;
export type LayoutName = (typeof LAYOUTS)[number];
export const LAYOUT_INFO: Record<LayoutName, { label: string; text: string }> = {
  classic: { label: "Classic", text: "The template as designed" },
  centered: { label: "Centred", text: "Symmetric heroes and headings, centred navigation" },
  editorial: { label: "Editorial", text: "Left-aligned, ruled headings, magazine feel" },
  immersive: { label: "Immersive", text: "Full-colour hero, tinted sections" },
  minimal: { label: "Minimal", text: "No glow, flat cards, more white space" },
};

/** The layout rules ship in onlynify-ui.css (src/css/layouts.css in the kit); theme.css only notes the attribute. */
export const layoutNote = (layout: LayoutName | undefined) =>
  layout && layout !== "classic" ? `\n/* Layout: ${LAYOUT_INFO[layout].label}. Its styles are in onlynify-ui.css (1.3+): add data-layout="${layout}" to <html>. */\n` : "";
export type Density = (typeof DENSITIES)[number];

export type Theme = {
  name?: string;
  /** Preset id, or a #rrggbb colour (Pro). */
  brand: string;
  /** Dark-mode brand colour for a custom brand; derived when omitted. */
  brandDark?: string;
  /** Second colour used by gradients (Pro). */
  accent?: string;
  style: StyleName;
  /** Base corner radius in px (Pro). */
  radius?: number;
  /** Key of FONTS (Pro). */
  font?: string;
  density?: Density;
  /** Page layout for site templates (free). */
  layout?: LayoutName;
};

export const DEFAULT_THEME: Theme = { brand: "onlynify", style: "modern" };

const HEX = /^#[0-9a-f]{6}$/i;
export const isHex = (v: unknown): v is string => typeof v === "string" && HEX.test(v);

/** Mix a hex colour towards white (a > 0) or black (a < 0). */
export function shade(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  const target = a >= 0 ? 255 : 0;
  const k = Math.abs(a);
  const ch = (s: number) => Math.round(((n >> s) & 255) + (target - ((n >> s) & 255)) * k);
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, "0")).join("")}`;
}

/** WCAG relative luminance, used to pick readable text on the brand colour. */
export function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
}
export const contrast = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

/** Validate untrusted input (URL parameter, API body). Returns null when it isn't a theme. */
export function normalizeTheme(input: unknown): Theme | null {
  if (!input || typeof input !== "object") return null;
  const t = input as Record<string, unknown>;
  const brand = typeof t.brand === "string" && (t.brand in BRAND_PRESETS || isHex(t.brand)) ? t.brand.toLowerCase() : null;
  if (!brand) return null;
  const style = STYLES.includes(t.style as StyleName) ? (t.style as StyleName) : "modern";
  const out: Theme = { brand, style };
  if (typeof t.name === "string" && t.name.trim()) out.name = t.name.trim().slice(0, 40);
  if (isHex(t.brandDark)) out.brandDark = t.brandDark.toLowerCase();
  if (isHex(t.accent)) out.accent = t.accent.toLowerCase();
  if (typeof t.radius === "number" && Number.isFinite(t.radius)) out.radius = Math.max(0, Math.min(24, Math.round(t.radius)));
  if (typeof t.font === "string" && t.font in FONTS) out.font = t.font;
  if (DENSITIES.includes(t.density as Density)) out.density = t.density as Density;
  if (LAYOUTS.includes(t.layout as LayoutName) && t.layout !== "classic") out.layout = t.layout as LayoutName;
  return out;
}

/** Anything beyond a preset brand + style preset needs Pro. */
export function needsPro(t: Theme) {
  return isHex(t.brand) || Boolean(t.accent) || t.radius !== undefined || (t.font !== undefined && t.font !== "system") || (t.density !== undefined && t.density !== "default") || Boolean(t.brandDark);
}

/** Strip Pro-only settings (what a free account may preview and copy). */
export const freeSubset = (t: Theme): Theme => ({ brand: t.brand in BRAND_PRESETS ? t.brand : "onlynify", style: t.style, ...(t.layout ? { layout: t.layout } : {}) });

/** CSS custom properties for a theme (the attribute-driven parts are in themeAttrs). */
export function themeVars(t: Theme): Record<string, string> {
  const v: Record<string, string> = {};
  if (isHex(t.brand)) {
    v["--onl-brand-light"] = t.brand;
    v["--onl-brand-dark"] = t.brandDark ?? (luminance(t.brand) < 0.2 ? shade(t.brand, 0.45) : t.brand);
  }
  if (t.accent) {
    v["--onl-accent-light"] = t.accent;
    v["--onl-accent-dark"] = shade(t.accent, 0.35);
  }
  if (t.radius !== undefined) {
    const r = t.radius;
    v["--onl-radius-xs"] = `${Math.max(0, Math.round(r * 0.6))}px`;
    v["--onl-radius-sm"] = `${Math.max(0, Math.round(r * 0.8))}px`;
    v["--onl-radius"] = `${r}px`;
    v["--onl-radius-lg"] = `${Math.round(r * 1.4)}px`;
    v["--onl-radius-xl"] = `${Math.round(r * 2)}px`;
  }
  if (t.font && t.font !== "system") v["--onl-font"] = FONTS[t.font].stack;
  return v;
}

/** Attributes for <html> (or any wrapper). */
export function themeAttrs(t: Theme): Record<string, string> {
  const a: Record<string, string> = {};
  if (t.brand in BRAND_PRESETS && t.brand !== "onlynify") a["data-brand"] = t.brand;
  if (t.style !== "modern") a["data-style"] = t.style;
  if (t.density && t.density !== "default") a["data-density"] = t.density;
  if (t.layout && t.layout !== "classic") a["data-layout"] = t.layout;
  return a;
}

/**
 * Custom variables must be applied after the style preset (which also sets radius), so the
 * selector covers both the root and any element carrying data-style.
 */
export function themeCss(t: Theme) {
  const vars = themeVars(t);
  const body = Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`).join("\n");
  const attrs = themeAttrs(t);
  const attrLine = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(" ");
  const head = `/* Onlynify UI theme${t.name ? `: ${t.name}` : ""}\n   Put this after onlynify-ui.css${attrLine ? `, and add to <html>: ${attrLine}` : ""}. */`;
  const layoutBlock = layoutNote(t.layout);
  if (!body) return `${head}\n/* Presets only: no custom properties needed. */\n${layoutBlock}`;
  return `${head}\n:root,\n:root[data-style],\n[data-style] {\n${body}\n}\n${isHex(t.brand) ? `[data-brand] { --onl-brand: var(--onl-brand-light); }\n` : ""}${layoutBlock}`;
}

/* ---- compact URL form: base64url(JSON) */
const b64 = (s: string) => (typeof btoa === "function" ? btoa(unescape(encodeURIComponent(s))) : Buffer.from(s, "utf8").toString("base64"));
const unb64 = (s: string) => (typeof atob === "function" ? decodeURIComponent(escape(atob(s))) : Buffer.from(s, "base64").toString("utf8"));
export const encodeTheme = (t: Theme) => b64(JSON.stringify(t)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export function decodeTheme(s: string | null | undefined): Theme | null {
  if (!s || s.length > 1200) return null;
  try {
    return normalizeTheme(JSON.parse(unb64(s.replace(/-/g, "+").replace(/_/g, "/"))));
  } catch {
    return null;
  }
}
