import components from "../../registry/components.json" with { type: "json" };
import icons from "../../registry/icons.json" with { type: "json" };
import blocksMeta from "../../registry/blocks.json" with { type: "json" };
import { CATALOG, type CatalogEntry } from "./catalog.ts";

export type Demo = { title: string; description?: string; muted?: boolean; html: string };
export type ComponentDoc = { slug: string; title: string; group: string; description: string; demos: Demo[] };
export type BlockMeta = { slug: string; title: string; description: string; category: string; premium: boolean; height: number; tags?: string[] };

export const COMPONENTS = components as ComponentDoc[];
export const BLOCKS = blocksMeta as BlockMeta[];

export const componentBySlug = (slug: string) => COMPONENTS.find((c) => c.slug === slug);
export const blockBySlug = (slug: string) => BLOCKS.find((b) => b.slug === slug);

export type ComponentEntry = CatalogEntry & { slug: string; title: string; group: string; description: string; demos: Demo[] };

const COMPONENT_DEMO_ALIASES: Record<string, string> = {
  Announcement: "Call to action",
  Bubble: "Chat",
  Button: "Variants",
  "Button Group": "Sizes, icons & states",
  Chart: "Bar · two series",
  Dialog: "Modal, confirm & drawer",
  Input: "Fields",
  "Input Group": "Fields",
  "Input OTP": "One-time code",
  Kbd: "Search with shortcut",
  Label: "Fields",
  Marker: "Typography",
  Sidebar: "Dashboard",
  Spinner: "Progress",
  "Style Presets": "Modern (default)",
  Switch: "Switches & range",
  Textarea: "Fields",
};

const COMPONENT_DEMO_CLASSES: Record<string, string> = {
  "Alert Dialog": "onl-modal--alert",
  Attachment: "onl-attachments",
  "Aspect Ratio": "onl-aspect",
  Checkbox: "onl-check",
  Collapsible: "onl-collapsible",
  "Dropdown Menu": "onl-dropdown",
  "Empty State": "onl-empty",
  "File Drop Zone": "onl-drop",
  "Radio Group": "onl-radio",
  Sheet: "onl-drawer",
  Skeleton: "onl-skeleton",
  Tooltip: "onl-tooltip",
};

const VOID_ELEMENTS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);

function elementAt(html: string, start: number): { html: string; end: number } | null {
  const first = /^<([a-z][\w:-]*)\b([^>]*)>/i.exec(html.slice(start));
  if (!first) return null;
  const tag = first[1].toLowerCase();
  const openingEnd = start + first[0].length;
  if (VOID_ELEMENTS.has(tag) || /\/\s*>$/.test(first[0])) return { html: first[0], end: openingEnd };

  const tokens = /<\/?([a-z][\w:-]*)\b[^>]*>/gi;
  tokens.lastIndex = start;
  let depth = 0;
  let token: RegExpExecArray | null;
  while ((token = tokens.exec(html))) {
    if (token[1].toLowerCase() !== tag) continue;
    if (/^<\//.test(token[0])) {
      depth -= 1;
      if (depth === 0) return { html: html.slice(start, tokens.lastIndex), end: tokens.lastIndex };
    } else if (!/\/\s*>$/.test(token[0]) && !VOID_ELEMENTS.has(tag)) {
      depth += 1;
    }
  }
  return null;
}

function elementsWithClass(html: string, target: string): string[] {
  const results: string[] = [];
  const openings = /<([a-z][\w:-]*)\b([^>]*)>/gi;
  let match: RegExpExecArray | null;
  while ((match = openings.exec(html))) {
    const classes = /\bclass=["']([^"']*)["']/i.exec(match[2])?.[1].split(/\s+/) ?? [];
    if (!classes.includes(target)) continue;
    const element = elementAt(html, match.index);
    if (!element) continue;
    results.push(element.html);
    openings.lastIndex = element.end;
  }
  return results;
}

function componentDemoHtml(name: string, html: string): string {
  const targetClass = COMPONENT_DEMO_CLASSES[name];
  if (!targetClass) return html;
  const selected = elementsWithClass(html, targetClass);
  if (!selected.length) return html;

  const parts = selected.flatMap((element) => {
    const id = /\bid=["']([^"']+)["']/i.exec(element)?.[1];
    if (!id) return [element];
    const trigger = new RegExp(`<([a-z][\\\\w:-]*)\\\\b([^>]*\\\\bdata-onl-open=["']#${id}["'][^>]*)>[\\\\s\\\\S]*?<\\\\/\\\\1>`, "i").exec(html);
    return trigger ? [trigger[0], element] : [element];
  });
  return `<div class="onl-stack" style="--onl-gap:12px">${parts.join("\n")}</div>`;
}

function componentDemos(name: string, demo: Demo): Demo[] {
  if (name !== "Accordion") return [{ ...demo, html: componentDemoHtml(name, demo.html) }];

  const accordions = elementsWithClass(demo.html, "onl-accordion");
  if (!accordions.length) return [{ ...demo, html: componentDemoHtml(name, demo.html) }];

  return accordions.map((html, index) => {
    const summary = /<summary\b[^>]*>([\s\S]*?)<\/summary>/i.exec(html)?.[1].replace(/<[^>]*>/g, "").trim();
    return {
      ...demo,
      title: summary || `Accordion example ${index + 1}`,
      html,
    };
  });
}

const tokens = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((word) => word && !["a", "an", "and", "by", "for", "in", "of", "on", "the", "to", "with"].includes(word))
    .map((word) => (word.endsWith("ies") ? `${word.slice(0, -3)}y` : word.endsWith("es") ? word.slice(0, -2) : word.endsWith("s") ? word.slice(0, -1) : word));

function matchingDemo(entry: CatalogEntry, page: ComponentDoc): Demo {
  const alias = COMPONENT_DEMO_ALIASES[entry.name];
  if (alias) {
    const exact = page.demos.find((demo) => demo.title.toLowerCase() === alias.toLowerCase());
    if (exact) return exact;
  }
  const wanted = new Set(tokens(entry.name));
  return page.demos.reduce((best, demo) => {
    const score = tokens(demo.title).filter((word) => wanted.has(word)).length;
    const bestScore = tokens(best.title).filter((word) => wanted.has(word)).length;
    return score > bestScore ? demo : best;
  }, page.demos[0]);
}

const componentSlug = (name: string) =>
  name.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const COMPONENT_DOCS: ComponentEntry[] = CATALOG.flatMap((entry) => {
  const page = componentBySlug(entry.page);
  if (!page || !page.demos.length) return [];
  const demo = matchingDemo(entry, page);
  return [{
    ...entry,
    slug: componentSlug(entry.name),
    title: entry.name,
    group: page.group,
    description: demo.description || page.description,
    demos: componentDemos(entry.name, demo),
  }];
});

export const componentDocBySlug = (slug: string) => COMPONENT_DOCS.find((c) => c.slug === slug);

const ICONS = icons as Record<string, { attrs: string; body: string }>;

/** `<svg data-icon="search"></svg>` (optionally with class/width) → full inline SVG. */
export const expandIcons = (html: string) =>
  html.replace(/<svg data-icon="([\w-]+)"([^>]*)><\/svg>/g, (all, name: string, extra: string) => {
    const i = ICONS[name];
    return i ? `<svg${extra} ${i.attrs} aria-hidden="true">${i.body}</svg>` : all;
  });

export const CATEGORIES = Array.from(new Set(BLOCKS.map((b) => b.category)));
