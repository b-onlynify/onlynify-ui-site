import { readFileSync } from "node:fs";
import { join } from "node:path";
import { toFramework, type Framework } from "./convert.ts";
import { blockBySlug, expandIcons } from "./registry.ts";

/** Block source. Premium source is only ever read on the server. */
export function blockHtml(slug: string): string {
  if (!/^[a-z0-9-]+$/.test(slug) || !blockBySlug(slug)) throw new Error("unknown block");
  return expandIcons(readFileSync(join(process.cwd(), "registry/blocks", `${slug}.html`), "utf8")).trim();
}

export function blockFiles(slug: string, framework: Framework) {
  const meta = blockBySlug(slug)!;
  return toFramework(blockHtml(slug), framework, slug, { title: meta.title });
}
