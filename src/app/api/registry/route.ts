import { json } from "@/lib/http.ts";
import { BLOCKS, COMPONENTS } from "@/lib/registry.ts";
import { PRO_COMPONENTS } from "@/lib/pro-components.ts";
import { SITES } from "@/lib/sites.ts";

/** Public catalogue for the CLI (`npx onlynify-ui list`). */
export function GET() {
  return json(
    {
      blocks: BLOCKS.map(({ slug, title, description, category, premium }) => ({ slug, title, description, category, premium })),
      components: COMPONENTS.map(({ slug, title }) => ({ slug, title })),
      pro: PRO_COMPONENTS.map(({ slug, title, description, category, tier }) => ({ slug, title, description, category, tier, premium: true })),
      sites: SITES.map(({ slug, title, description, industry, pages }) => ({ slug, title, description, category: industry, premium: true, pages: pages.map((x) => x.slug) })),
    },
    200,
    { "Cache-Control": "public, max-age=300" },
  );
}
