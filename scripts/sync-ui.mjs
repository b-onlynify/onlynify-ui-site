// Copies the built onlynify-ui dist into public/ui so block previews (iframes) can load it.
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
const here = dirname(fileURLToPath(import.meta.url));
const ui = join(here, "../../onlynify-ui");
execFileSync(process.execPath, [join(ui, "scripts/build.mjs")], { stdio: "inherit" });
mkdirSync(join(here, "../public/ui"), { recursive: true });
cpSync(join(ui, "dist"), join(here, "../public/ui"), { recursive: true });
console.log("synced onlynify-ui → public/ui");
