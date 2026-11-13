import { currentUser } from "@/lib/auth.ts";
import { error, json, sameOrigin } from "@/lib/http.ts";
import { write } from "@/lib/store.ts";

/** Delete one of your saved themes. */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return error(403, "csrf", "Cross-site request refused.");
  const user = await currentUser();
  if (!user) return error(401, "auth.required", "Sign in first.");
  const { id } = await params;
  const removed = await write((db) => {
    const i = db.themes.findIndex((t) => t.id === id && t.userId === user.id);
    if (i < 0) return false;
    db.themes.splice(i, 1);
    return true;
  });
  return removed ? json({ ok: true }) : error(404, "theme.not_found", "That saved theme doesn't exist.");
}
