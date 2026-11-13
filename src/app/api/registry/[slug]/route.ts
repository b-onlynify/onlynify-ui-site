import { currentUser } from "@/lib/auth.ts";
import { blockFiles } from "@/lib/block-source.ts";
import { FRAMEWORKS, type Framework } from "@/lib/convert.ts";
import { clientIp, error, json, rateLimit } from "@/lib/http.ts";
import { findLicence, recordDownload, userHasPremium } from "@/lib/payments.ts";
import { blockBySlug } from "@/lib/registry.ts";
import { siteBySlug } from "@/lib/sites.ts";
import { proBySlug } from "@/lib/pro-components.ts";
import { GET as siteGet } from "../../sites/[slug]/route.ts";
import { GET as proGet } from "../../pro/[slug]/route.ts";

/**
 * Block source for the CLI: GET /api/registry/<slug>?framework=react
 * Premium blocks need `Authorization: Bearer <licence>` (or a signed-in session).
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const block = blockBySlug(slug);
  // Site templates share the CLI command: forward to the site endpoint (Pro, same auth headers).
  if (!block && siteBySlug(slug)) {
    return siteGet(req, { params: Promise.resolve({ slug }) });
  }
  // Pro components too (`npx onlynify-ui add pro-buttons`).
  if (!block && proBySlug(slug)) {
    return proGet(req, { params: Promise.resolve({ slug }) });
  }
  if (!block) return error(404, "block.not_found", `No block named "${slug}".`);
  const fw = (new URL(req.url).searchParams.get("framework") ?? "html") as Framework;
  if (!FRAMEWORKS.includes(fw)) return error(400, "framework.invalid", `Framework must be one of ${FRAMEWORKS.join(", ")}.`);

  let licenceKey: string | null = null;
  if (block.premium) {
    if (!rateLimit(`registry:${clientIp(req)}`, 120, 60 * 60_000)) return error(429, "rate_limited", "Too many downloads. Try again later.");
    const auth = req.headers.get("authorization") ?? "";
    const key = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
    if (key) {
      const found = await findLicence(key);
      if (!found) return error(403, "licence.invalid", "This licence key is not valid or has been revoked.");
      licenceKey = found.licence.key;
    } else {
      const user = await currentUser();
      if (!(await userHasPremium(user?.id))) return error(402, "licence.required", "This is a premium block. A Pro licence is required.");
    }
  }

  const files = blockFiles(slug, fw).map(({ path, content }) => ({ path, content }));
  if (licenceKey) await recordDownload(licenceKey, slug, fw);
  return json(
    { slug, title: block.title, premium: block.premium, framework: fw, files },
    200,
    { "Cache-Control": block.premium ? "private, no-store" : "public, max-age=300" },
  );
}
