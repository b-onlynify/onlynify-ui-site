/**
 * Turn framework-agnostic Onlynify markup into idiomatic code for each framework.
 * The markup is trusted (it comes from our own registry), so a careful regex
 * transform is enough: no HTML parser dependency.
 */
export type Framework = "html" | "react" | "vue" | "angular";
export const FRAMEWORKS: Framework[] = ["html", "react", "vue", "angular"];
export type ComponentFramework = Framework | "react-native";
export const COMPONENT_FRAMEWORKS: ComponentFramework[] = [...FRAMEWORKS, "react-native"];

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr", "use", "circle", "path", "rect", "line", "polyline", "polygon", "ellipse", "stop"]);

const JSX_ATTR: Record<string, string> = {
  class: "className", for: "htmlFor", tabindex: "tabIndex", readonly: "readOnly", maxlength: "maxLength", minlength: "minLength",
  colspan: "colSpan", rowspan: "rowSpan", autocomplete: "autoComplete", inputmode: "inputMode", autofocus: "autoFocus",
  "stroke-width": "strokeWidth", "stroke-linecap": "strokeLinecap", "stroke-linejoin": "strokeLinejoin", "stroke-dasharray": "strokeDasharray",
  "fill-rule": "fillRule", "clip-rule": "clipRule", "stop-color": "stopColor", "stop-opacity": "stopOpacity", "font-size": "fontSize",
  "font-weight": "fontWeight", "font-family": "fontFamily", "text-anchor": "textAnchor", "dominant-baseline": "dominantBaseline",
  srcset: "srcSet", crossorigin: "crossOrigin", enctype: "encType", novalidate: "noValidate", spellcheck: "spellCheck", datetime: "dateTime",
  popovertarget: "popoverTarget", popovertargetaction: "popoverTargetAction", draggable: "draggable",
};

/** Placeholder images in the registry (`data-ph="Label|hue"`) become ordinary image paths in shipped code. */
export const resolvePlaceholders = (html: string) =>
  html.replace(/ data-ph="([^"|]+)\|\d+"/g, (_, label: string) => ` src="/images/${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.jpg"`);

const stripHandlers = (html: string) => html.replace(/\s+on[a-z]+="[^"]*"/gi, "");

export const pascal = (slug: string) => slug.replace(/(^|[-_ ]+)([a-z0-9])/gi, (_, __, ch: string) => ch.toUpperCase()).replace(/[^A-Za-z0-9]/g, "");

/* ------------------------------------------------------------------ pretty-print */
export function prettyHtml(input: string): string {
  const src = input.replace(/>\s+</g, "><").trim();
  const tokens = src.split(/(<[^>]+>)/).filter((t) => t.trim() !== "");
  const out: string[] = [];
  let depth = 0;
  let inline = "";
  const flush = () => {
    if (inline.trim()) out.push("  ".repeat(depth) + inline.trim());
    inline = "";
  };
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const close = /^<\//.test(t);
    const open = /^<[a-z]/i.test(t);
    const tag = (t.match(/^<\/?([a-z0-9-]+)/i)?.[1] ?? "").toLowerCase();
    const selfClosing = open && (/\/>$/.test(t) || VOID.has(tag));
    // keep short leaf elements on one line: <b>Text</b>
    if (open && !selfClosing && tokens[i + 2] && new RegExp(`^</${tag}>`, "i").test(tokens[i + 2]) && !/^</.test(tokens[i + 1]) && (t + tokens[i + 1] + tokens[i + 2]).length < 110) {
      flush();
      out.push("  ".repeat(depth) + t + tokens[i + 1].trim() + tokens[i + 2]);
      i += 2;
      continue;
    }
    if (close) {
      flush();
      depth = Math.max(0, depth - 1);
      out.push("  ".repeat(depth) + t);
    } else if (open) {
      flush();
      out.push("  ".repeat(depth) + t);
      if (!selfClosing) depth++;
    } else if (t.startsWith("<!--")) {
      flush();
      out.push("  ".repeat(depth) + t);
    } else inline += t;
  }
  flush();
  return out.join("\n");
}

/* ------------------------------------------------------------------ JSX */
const NUMERIC = new Set(["tabIndex", "colSpan", "rowSpan", "maxLength", "minLength", "rows", "cols", "size", "span", "aria-valuenow", "aria-valuemin", "aria-valuemax", "aria-level", "aria-posinset", "aria-setsize", "aria-colcount", "aria-rowcount"]);
const camel = (s: string) => s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

function styleToObject(style: string): string {
  const parts = style
    .split(";")
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => {
      const i = d.indexOf(":");
      const k = d.slice(0, i).trim();
      const v = d.slice(i + 1).trim().replace(/"/g, "'");
      const key = k.startsWith("--") ? JSON.stringify(k) : camel(k);
      return `${key}: ${JSON.stringify(v)}`;
    });
  const obj = `{ ${parts.join(", ")} }`;
  return parts.some((p) => p.startsWith('"--')) ? `{${obj} as React.CSSProperties}` : `{${obj}}`;
}

export function htmlToJsx(html: string): string {
  let s = stripHandlers(resolvePlaceholders(html));
  // <select> with a selected <option> → defaultValue on the select
  s = s.replace(/<select([^>]*)>([\s\S]*?)<\/select>/g, (all, attrs: string, body: string) => {
    const m = body.match(/<option([^>]*)\sselected([^>]*)>([\s\S]*?)<\/option>/);
    if (!m) return all;
    const val = (m[1] + m[2]).match(/value="([^"]*)"/)?.[1] ?? m[3].replace(/<[^>]+>/g, "").trim();
    return `<select${attrs} defaultValue=${JSON.stringify(val)}>${body.replace(/\sselected(?=[\s>])/g, "")}</select>`;
  });
  // text braces first, then comments (which introduce braces of their own)
  s = s.replace(/>([^<]*)</g, (_, text: string) => `>${text.replace(/[{}]/g, (b) => `{"${b}"}`)}<`);
  s = s.replace(/<!--([\s\S]*?)-->/g, (_, c: string) => `{/*${c}*/}`);
  // tags
  s = s.replace(/<([a-zA-Z][\w-]*)((?:\s+[^\s=>]+(?:="[^"]*"|='[^']*')?)*)\s*(\/?)>/g, (_, tag: string, attrs: string, selfClose: string) => {
    const isCustom = tag.includes("-");
    const out = attrs.replace(/\s+([^\s=>]+)(?:=("[^"]*"|'[^']*'))?/g, (__, name: string, value?: string) => {
      const lower = name.toLowerCase();
      if (lower === "style" && value) return ` style=${styleToObject(value.slice(1, -1))}`;
      if (isCustom) return value === undefined ? ` ${name}` : ` ${lower === "class" ? "className" : name}=${value}`;
      let n = JSX_ATTR[lower] ?? name;
      if (tag === "input" || tag === "textarea") {
        if (lower === "checked") n = "defaultChecked";
        if (lower === "value") n = "defaultValue";
      }
      // bare `popover` means popover="auto"; JSX needs the explicit value
      if (value === undefined && lower === "popover") return ` popover="auto"`;
      if (lower === "draggable" && value) return ` draggable={${value.slice(1, -1) === "true"}}`;
      if (value === undefined) return ` ${n}`;
      if (NUMERIC.has(n) && /^["']-?\d+(\.\d+)?["']$/.test(value)) return ` ${n}={${value.slice(1, -1)}}`;
      return ` ${n}=${value}`;
    });
    const isVoid = VOID.has(tag.toLowerCase());
    return `<${tag}${out}${isVoid || selfClose ? " />" : ">"}`;
  });
  // void elements written with explicit close tags (</use>, </path>) are now self-closed twice
  s = s.replace(/<\/(use|path|circle|rect|line|stop|polyline|polygon|ellipse)>/g, "");
  return s;
}

/* ------------------------------------------------------------------ Angular */
const angularText = (html: string) =>
  html.replace(/>([^<]*)</g, (_, text: string) => `>${text.replace(/@/g, "&#64;").replace(/[{}]/g, (c) => `{{ '${c}' }}`)}<`);

/* ------------------------------------------------------------------ files */
export type CodeFile = { path: string; content: string; language: string };

const NATIVE_TAGS: Record<string, string> = {
  article: "View", aside: "View", blockquote: "Text", body: "View", caption: "Text", code: "Text", dd: "Text", details: "View",
  div: "View", dl: "View", dt: "Text", em: "Text", fieldset: "View", figcaption: "Text", figure: "View", footer: "View",
  form: "View", h1: "Text", h2: "Text", h3: "Text", h4: "Text", h5: "Text", h6: "Text", header: "View", label: "Text",
  legend: "Text", li: "Text", main: "View", mark: "Text", nav: "View", ol: "View", option: "Text", p: "Text", pre: "Text",
  section: "View", small: "Text", span: "Text", strong: "Text", summary: "Text", table: "View", tbody: "View", td: "Text",
  textarea: "TextInput", tfoot: "View", th: "Text", thead: "View", time: "Text", tr: "View", u: "Text", ul: "View",
};
const NATIVE_VOID = new Set(["br", "hr", "img", "input"]);
const NATIVE_STYLES: Array<[RegExp, string]> = [
  [/\bonl-row\b/, "row"],
  [/\bonl-stack\b/, "stack"],
  [/\bonl-grid\b/, "grid"],
  [/\bonl-card\b|\bonl-stat\b/, "card"],
  [/\bonl-btn\b/, "button"],
  [/\bonl-badge\b|\bonl-pill\b|\bonl-chip\b/, "badge"],
  [/\bonl-(input|select|textarea)\b/, "input"],
  [/\bonl-text-muted\b/, "muted"],
];

function nativeStyleProps(tag: string, attrs: string): string {
  const classes = attrs.match(/\bclass=["']([^"']*)["']/i)?.[1] ?? "";
  const isLinkButton = /\bonl-btn--link\b/.test(classes);
  const styles = NATIVE_STYLES.filter(([pattern, style]) => pattern.test(classes) && !(style === "button" && isLinkButton)).map(([, style]) => `styles.${style}`);
  if (/^h[1-6]$/.test(tag)) styles.push("styles.heading");
  if (tag === "button" && !styles.includes("styles.button")) styles.push("styles.button");
  if (tag === "a") styles.push("styles.link");
  if (tag === "img") styles.push("styles.image");
  if (tag === "hr") styles.push("styles.separator");
  if (tag === "table" || tag === "tbody" || tag === "thead" || tag === "tfoot" || tag === "tr") styles.push("styles.table");
  if ((tag === "input" || tag === "textarea") && !styles.includes("styles.input")) styles.push("styles.input");
  if (tag === "td" || tag === "th") styles.push("styles.tableCell");
  if (tag === "TextInput" && !styles.includes("styles.input")) styles.push("styles.input");
  if (!styles.length) return "";
  return styles.length === 1 ? ` style={${styles[0]}}` : ` style={[${styles.join(", ")}]}`;
}

function nativeProps(tag: string, rawAttrs: string): string {
  const attrs: string[] = [];
  const attrPattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of rawAttrs.matchAll(attrPattern)) {
    const [, name, doubleQuoted, singleQuoted, bare] = match;
    const lower = name.toLowerCase();
    const value = doubleQuoted ?? singleQuoted ?? bare;
    if (lower === "type" && tag === "input" && value === "password") {
      attrs.push("secureTextEntry={true}");
      continue;
    }
    if (lower === "type" && tag === "input" && (value === "number" || value === "tel")) {
      attrs.push(`keyboardType=${JSON.stringify(value === "tel" ? "phone-pad" : "numeric")}`);
      continue;
    }
    if (lower === "type" && tag === "input" && value === "email") {
      attrs.push('keyboardType="email-address"');
      continue;
    }
    if (lower === "class" || lower === "style" || lower.startsWith("on") || lower.startsWith("data-") || lower === "href" || lower === "for" || lower === "type") continue;
    if (lower === "src" && tag === "img" && value) {
      attrs.push(`source={{ uri: ${JSON.stringify(value)} }}`);
      continue;
    }
    if (lower === "alt" && value) {
      attrs.push(`accessibilityLabel=${JSON.stringify(value)}`);
      continue;
    }
    if (lower === "aria-label" && value) {
      attrs.push(`accessibilityLabel=${JSON.stringify(value)}`);
      continue;
    }
    if (lower === "title" && value) {
      attrs.push(`accessibilityHint=${JSON.stringify(value)}`);
      continue;
    }
    if (lower === "id" && value) {
      attrs.push(`nativeID=${JSON.stringify(value)}`);
      continue;
    }
    if (lower === "value" && value && (tag === "input" || tag === "textarea" || tag === "TextInput")) {
      attrs.push(`defaultValue=${JSON.stringify(value)}`);
      continue;
    }
    if (lower === "disabled" || lower === "selected" || lower === "multiline" || lower === "editable") {
      attrs.push(`${lower}={${value === undefined || value === "true"}}`);
      continue;
    }
    if (lower === "placeholder" || lower === "maxlength" || lower === "numberoflines" || lower === "testid") {
      const prop = lower === "maxlength" ? "maxLength" : lower === "numberoflines" ? "numberOfLines" : lower === "testid" ? "testID" : lower;
      if (value !== undefined) attrs.push(`${prop}={${/^(maxLength|numberOfLines)$/.test(prop) && /^\d+$/.test(value) ? value : JSON.stringify(value)}}`);
    }
  }
  return attrs.length ? ` ${attrs.join(" ")}` : "";
}

/** Convert registry HTML into an editable React Native starting point, mapping common UI-kit classes to native styles. */
export function htmlToReactNative(input: string): string {
  let html = stripHandlers(resolvePlaceholders(input))
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<onl-chart\b([^>]*)>(?:[\s\S]*?<\/onl-chart>)?/gi, (_all, attrs: string) => {
      const type = attrs.match(/\btype=["']([^"']+)["']/i)?.[1];
      return `<View style={styles.chart}><Text>${type ? `Chart preview: ${type}` : "Chart preview"} (replace with a native chart library)</Text></View>`;
    });

  html = html.replace(/<\/?([a-z][\w:-]*)\b([^>]*)>/gi, (whole, rawTag: string, attrs: string) => {
    const tag = rawTag.toLowerCase();
    if (whole.startsWith("</")) {
      if (tag === "view" || tag === "text") return whole;
      if (NATIVE_VOID.has(tag)) return "";
      if (tag === "button" || tag === "a") return "</Text></Pressable>";
      if (tag === "onl-chart") return "";
      return `</${NATIVE_TAGS[tag] ?? "View"}>`;
    }
    if (tag === "view" || tag === "text") return whole;
    if (tag === "br") return `<Text>{"\\n"}</Text>`;
    if (tag === "hr") return `<View${nativeStyleProps(tag, attrs)} />`;
    if (tag === "input" && /\btype=["'](?:checkbox|radio)["']/i.test(attrs)) {
      const checked = /\bchecked(?:\s|=|$)/i.test(attrs);
      return `<Text accessibilityRole="${tag === "input" && /\bradio\b/i.test(attrs) ? "radio" : "checkbox"}" accessibilityState={{ checked: ${checked} }}>${checked ? "☑" : "☐"}</Text>`;
    }
    if (tag === "input") return `<TextInput${nativeStyleProps("TextInput", attrs)}${nativeProps(tag, attrs)} />`;
    if (tag === "button" || tag === "a") {
      const role = tag === "button" ? "button" : "link";
      const accessibility = attrs.match(/\baria-label=["']([^"']*)["']/i)?.[1];
      return `<Pressable accessibilityRole="${role}"${accessibility ? ` accessibilityLabel=${JSON.stringify(accessibility)}` : ""}${nativeStyleProps(tag, attrs)}${nativeProps(tag, attrs)}><Text style={styles.${tag === "button" ? "buttonText" : "linkText"}}>`;
    }
    if (tag === "img") return `<Image${nativeStyleProps(tag, attrs)}${nativeProps(tag, attrs)} />`;
    const component = NATIVE_TAGS[tag] ?? "View";
    if (component === "TextInput") return `<TextInput${nativeStyleProps(tag, attrs)}${nativeProps(component, attrs)} />`;
    const style = nativeStyleProps(tag, attrs);
    const props = nativeProps(tag, attrs);
    return `<${component}${style}${props}${NATIVE_VOID.has(tag) || /\/\s*>$/.test(whole) ? " />" : ">"}`;
  });
  return html;
}

/** Code for one framework. `name` is a slug like "pricing-01". */
export function toFramework(html: string, framework: ComponentFramework, name: string, opts: { title?: string; usesChart?: boolean } = {}): CodeFile[] {
  const Comp = pascal(name);
  const usesChart = opts.usesChart ?? html.includes("<onl-chart");
  const header = opts.title ? `Onlynify UI · ${opts.title}` : `Onlynify UI · ${name}`;
  switch (framework) {
    case "react-native": {
      const nativeHtml = htmlToReactNative(html);
      const jsx = prettyHtml(nativeHtml)
        .split("\n")
        .map((l) => "      " + l)
        .join("\n");
      const imports = ["View", "Text", "StyleSheet"];
      if (/<(?:button|a)\b/i.test(html)) imports.push("Pressable");
      if (/<img\b/i.test(html)) imports.push("Image");
      if (/<(?:input|textarea)\b/i.test(html)) imports.push("TextInput");
      return [{
        path: `${Comp}.tsx`,
        language: "tsx",
        content: `// ${header}\n// Conversion starter: web-only interactions and styling may need native equivalents.\nimport { ${imports.join(", ")} } from "react-native";\n\nexport function ${Comp}() {\n  return (\n    <View style={styles.container}>\n${jsx}\n    </View>\n  );\n}\n\nconst styles = StyleSheet.create({\n  container: { gap: 12 },\n  row: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },\n  stack: { gap: 12 },\n  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },\n  card: { padding: 16, borderWidth: 1, borderColor: "#d8dee8", borderRadius: 12, gap: 8 },\n  button: { alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: "#155eef" },\n  buttonText: { color: "#fff", fontWeight: "600" },\n  link: { alignSelf: "flex-start" },\n  linkText: { color: "#155eef" },\n  badge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: "#eef2f8" },\n  input: { minHeight: 40, paddingHorizontal: 10, borderWidth: 1, borderColor: "#d8dee8", borderRadius: 8 },\n  heading: { fontSize: 22, fontWeight: "700" },\n  muted: { color: "#64748b" },\n  image: { width: 160, height: 100, resizeMode: "cover" },\n  separator: { height: 1, backgroundColor: "#d8dee8" },\n  table: { gap: 4 },\n  tableCell: { padding: 8 },\n  chart: { minHeight: 120, justifyContent: "center", alignItems: "center", padding: 16, borderWidth: 1, borderColor: "#d8dee8", borderRadius: 8 },\n});\n`,
      }];
    }
    case "react": {
      const jsx = prettyHtml(htmlToJsx(html))
        .split("\n")
        .map((l) => "      " + l)
        .join("\n");
      return [
        {
          path: `${Comp}.tsx`,
          language: "tsx",
          content: `// ${header}\n// Requires: import "onlynify-ui/css" and init() once in your app entry.\n\nexport function ${Comp}() {\n  return (\n    <>\n${jsx}\n    </>\n  );\n}\n`,
        },
      ];
    }
    case "vue": {
      const tpl = prettyHtml(stripHandlers(resolvePlaceholders(html)))
        .split("\n")
        .map((l) => "  " + l)
        .join("\n");
      return [
        {
          path: `${Comp}.vue`,
          language: "vue",
          content: `<!-- ${header}${usesChart ? "\n     <onl-chart> needs compilerOptions.isCustomElement: (t) => t.startsWith(\"onl-\")" : ""} -->\n<template>\n${tpl}\n</template>\n`,
        },
      ];
    }
    case "angular": {
      const tpl = prettyHtml(angularText(stripHandlers(resolvePlaceholders(html))))
        .replace(/`/g, "\\`")
        .replace(/\$\{/g, "\\${")
        .split("\n")
        .map((l) => "    " + l)
        .join("\n");
      return [
        {
          path: `${name}.component.ts`,
          language: "ts",
          content: `// ${header}\nimport { Component${usesChart ? ", CUSTOM_ELEMENTS_SCHEMA" : ""} } from "@angular/core";\n\n@Component({\n  selector: "onl-${name}",\n  standalone: true,${usesChart ? "\n  schemas: [CUSTOM_ELEMENTS_SCHEMA]," : ""}\n  template: \`\n${tpl}\n  \`,\n})\nexport class ${Comp}Component {}\n`,
        },
      ];
    }
    default:
      return [{ path: `${name}.html`, language: "html", content: `<!-- ${header} -->\n${prettyHtml(resolvePlaceholders(html))}\n` }];
  }
}
