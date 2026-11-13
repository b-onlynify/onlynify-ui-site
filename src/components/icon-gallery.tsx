"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "onlynify-ui";

export type GalleryIcon = { name: string; svg: string; aliases: string[] };
export type GalleryGroup = { id: string; title: string; icons: GalleryIcon[] };

type CopyMode = "tag" | "name" | "svg";
const COPY_LABEL: Record<CopyMode, string> = { tag: "<onl-icon>", name: "Name", svg: "SVG" };

const copyText = (mode: CopyMode, i: GalleryIcon) =>
  mode === "name" ? i.name : mode === "svg" ? i.svg : `<onl-icon name="${i.name}"></onl-icon>`;

/** Every search word must appear in the icon name, one of its aliases or its group. */
export function matchIcon(icon: GalleryIcon, group: GalleryGroup, term: string) {
  const words = term.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = [icon.name, ...icon.aliases, group.id, group.title.toLowerCase()].join(" ");
  return words.every((w) => hay.includes(w));
}

/** Searchable, filterable icon gallery. Click a tile to copy it. Press "/" to jump to search. */
export function IconGallery({ groups }: { groups: GalleryGroup[] }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");
  const [mode, setMode] = useState<CopyMode>("tag");
  const [copied, setCopied] = useState<string | null>(null);
  const term = useDeferredValue(query);
  const input = useRef<HTMLInputElement>(null);
  const total = useMemo(() => groups.reduce((n, g) => n + g.icons.length, 0), [groups]);

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

  const visible = useMemo(
    () =>
      groups
        .filter((g) => group === "all" || g.id === group)
        .map((g) => ({ ...g, icons: g.icons.filter((i) => matchIcon(i, g, term)) }))
        .filter((g) => g.icons.length > 0),
    [groups, group, term],
  );
  const shown = visible.reduce((n, g) => n + g.icons.length, 0);

  async function copy(i: GalleryIcon) {
    const text = copyText(mode, i);
    try {
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
            placeholder={`Search ${total} icons by name, e.g. calendar, file, arrow…`}
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

      <div className="icon-gallery__chips" role="group" aria-label="Filter by group">
        <button type="button" className="onl-chip" aria-pressed={group === "all"} onClick={() => setGroup("all")}>
          All <span className="onl-text-muted">{total}</span>
        </button>
        {groups.map((g) => (
          <button key={g.id} type="button" className="onl-chip" aria-pressed={group === g.id} onClick={() => setGroup(g.id)}>
            {g.title} <span className="onl-text-muted">{g.icons.length}</span>
          </button>
        ))}
      </div>

      <p className="onl-help" aria-live="polite">
        {shown
          ? `${shown} ${shown === 1 ? "icon" : "icons"}${term.trim() ? ` match “${term.trim()}”` : ""}. Click an icon to copy it.`
          : null}
      </p>

      {shown === 0 ? (
        <div className="onl-empty icon-gallery__empty">
          <p><b>No icons match “{term.trim()}”.</b></p>
          <p className="onl-text-muted">Try a shorter word or another group, or add your own icon with <code>registerIcons()</code> (see Usage below).</p>
          <button type="button" className="onl-btn onl-btn--sm" onClick={() => { setQuery(""); setGroup("all"); }}>Clear search</button>
        </div>
      ) : (
        visible.map((g) => (
          <section key={g.id} aria-label={g.title}>
            <h3 className="icon-gallery__group">{g.title} <span className="onl-text-muted">{g.icons.length}</span></h3>
            <div className="icon-gallery__grid">
              {g.icons.map((i) => (
                <button
                  key={i.name}
                  type="button"
                  className="icon-gallery__tile"
                  data-copied={copied === i.name ? "" : undefined}
                  title={i.aliases.length ? `${i.name} (also: ${i.aliases.join(", ")})` : i.name}
                  onClick={() => copy(i)}
                >
                  <span dangerouslySetInnerHTML={{ __html: i.svg }} />
                  <span className="icon-gallery__name">{copied === i.name ? "Copied" : i.name}</span>
                </button>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
