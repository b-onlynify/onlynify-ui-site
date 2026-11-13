import { destroySession } from "@/lib/auth.ts";
import { error, json, sameOrigin } from "@/lib/http.ts";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return error(403, "csrf", "Cross-site request blocked.");
  await destroySession();
  return json({ ok: true });
}
