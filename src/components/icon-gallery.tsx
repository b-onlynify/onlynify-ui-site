"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "onlynify-ui";

export type GalleryIcon = { name: string; set: string; aliases: string[] };
export type GalleryGroup = { id: string; title: string; icons: GalleryIcon[] };

type CopyMode = "tag" | "name" | "svg";
const COPY_LABEL: Record<CopyMode, string> = { tag: "<onl-icon>", name: "Name", svg: "SVG" };

/** Every search word must appear in the icon name, one of its aliases, or its topic. */
export function matchIcon(icon: GalleryIcon, group: GalleryGroup, term: string) {
  const words = term.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = [icon.name, ...icon.aliases, group.id, group.title.toLowerCase()].join(" ");
  return words.every((w) => hay.includes(w));
}

/**
 * Searchable Onlyn.ify icon gallery (about 2,100 icons, one flat A–Z grid). Tiles draw from one cached sprite file, so
 * the page carries names only. Search also matches each icon's topic keywords. Click a tile to copy it; "SVG"
 * fetches that icon's file. Press "/" to jump to search.
 */
const CHUNK = 240;

export function IconGallery({ groups, sprite, files }: { groups: GalleryGroup[]; sprite: string; files: string }) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<CopyMode>("tag");
  const [copied, setCopied] = useState<string | null>(null);
  const term = useDeferredValue(query);
  const input = useRef<HTMLInputElement>(null);
  /** Every icon once, A–Z, with the topic it came from (used for search only). */
  const all = useMemo(() => {
    const seen = new Map<string, { icon: GalleryIcon; group: GalleryGroup }>();
    for (const g of groups) for (const i of g.icons) if (!seen.has(i.name)) seen.set(i.name, { icon: i, group: g });
    return [...seen.values()].sort((a, b) => a.icon.name.localeCompare(b.icon.name));
  }, [groups]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.key === "/" && !(t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)))) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const visible = useMemo(() => all.filter((x) => matchIcon(x.icon, x.group, term)).map((x) => x.icon), [all, term]);
  const chunks = useMemo(() => {
    const out: GalleryIcon[][] = [];
    for (let i = 0; i < visible.length; i += CHUNK) out.push(visible.slice(i, i + CHUNK));
    return out;
  }, [visible]);
  const shown = visible.length;

  async function copy(i: GalleryIcon) {
    let text = mode === "name" ? i.name : `<onl-icon name="${i.name}"></onl-icon>`;
    try {
      if (mode === "svg") {
        const res = await fetch(`${files}${i.name}.svg`);
        if (!res.ok) throw new Error(String(res.status));
        text = (await res.text()).trim();
      }
      await navigator.clipboard.writeText(text);
      setCopied(i.name);
      setTimeout(() => setCopied((c) => (c === i.name ? null : c)), 1200);
    } catch {
      toast({ kind: "info", title: "Copy this", text });
    }
  }

  return (
    <div className="icon-gallery">
      <div className="icon-gallery__bar">
        <div className="onl-input-group icon-gallery__search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={input}
            className="onl-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setQuery("")}
            placeholder={`Search ${all.length.toLocaleString("en-IN")} icons, e.g. calendar, school, invoice…`}
            aria-label="Search icons by name"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="icon-gallery__kbd" aria-hidden="true">/</kbd>
        </div>
        <label className="icon-gallery__mode">
          <span className="onl-text-sm onl-text-muted">Copy as</span>
          <select className="onl-select" value={mode} onChange={(e) => setMode(e.target.value as CopyMode)} aria-label="Copy icons as">
            {(Object.keys(COPY_LABEL) as CopyMode[]).map((m) => (
              <option key={m} value={m}>{COPY_LABEL[m]}</option>
            ))}
          </select>
        </label>
      </div>

      <p className="onl-help" aria-live="polite">
        {shown
          ? `${shown.toLocaleString("en-IN")} ${shown === 1 ? "icon" : "icons"}${term.trim() ? ` match “${term.trim()}”` : ""}. Click an icon to copy it.`
          : null}
      </p>

      {shown === 0 ? (
        <div className="onl-empty icon-gallery__empty">
          <p><b>No icons match “{term.trim()}”.</b></p>
          <p className="onl-text-muted">Try a shorter word, or add your own icon with <code>registerIcons()</code> (see Usage below).</p>
          <button type="button" className="onl-btn onl-btn--sm" onClick={() => setQuery("")}>Clear search</button>
        </div>
      ) : (
        chunks.map((c, n) => (
          <div key={n} className="icon-gallery__section icon-gallery__grid">
            {c.map((i) => (
              <button
                key={i.name}
                type="button"
                className="icon-gallery__tile"
                data-copied={copied === i.name ? "" : undefined}
                title={`${i.name}${i.aliases.length ? ` (also: ${i.aliases.join(", ")})` : ""}`}
                onClick={() => copy(i)}
              >
                <svg width="22" height="22" aria-hidden="true">
                  <use href={`${sprite}#i-${i.name}`} />
                </svg>
                <span className="icon-gallery__name">{copied === i.name ? "Copied" : i.name}</span>
              </button>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
