import type { Metadata } from "next";
import { currentUser } from "@/lib/auth.ts";
import { userHasPremium } from "@/lib/payments.ts";
import { SITES } from "@/lib/sites.ts";
import { read } from "@/lib/store.ts";
import { decodeTheme, DEFAULT_THEME, freeSubset, normalizeTheme, type Theme } from "@/lib/theme.ts";
import { ThemeBuilder } from "./builder";

export const metadata: Metadata = { title: "Theme builder", description: "Pick a brand colour and style preset, preview Onlynify UI live on real blocks, and with Pro customise colours, radius, font and density, save themes and export CSS." };
export const dynamic = "force-dynamic";

export default async function Themes({ searchParams }: { searchParams: Promise<{ theme?: string }> }) {
  const user = await currentUser();
  const pro = await userHasPremium(user?.id);
  const saved = user ? (await read()).themes.filter((t) => t.userId === user.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) : [];
  const shared = decodeTheme((await searchParams).theme);
  const initial: Theme = shared ? (pro ? shared : freeSubset(shared)) : DEFAULT_THEME;
  return (
    <div className="onl-container onl-container--xl" style={{ paddingBlock: "40px 64px" }}>
      <header style={{ maxWidth: 720, marginBottom: 24 }}>
        <p className="onl-eyebrow">Themes</p>
        <h1 className="onl-h1" style={{ fontSize: "2.25rem", marginTop: 8 }}>Make it yours</h1>
        <p className="onl-lead" style={{ marginTop: 10 }}>
          Pick one of 12 brand colours and 5 modern styles for free. With <span className="site-pro">PRO</span> you can also set any brand and accent colour, the radius, font and density, save themes to your account and apply them to every site template.
        </p>
      </header>
      <ThemeBuilder
        initial={initial}
        pro={pro}
        signedIn={!!user}
        saved={saved.map((t) => ({ id: t.id, name: t.name, theme: normalizeTheme(t.theme)!, updatedAt: t.updatedAt }))}
        sites={SITES.map(({ slug, title }) => ({ slug, title }))}
      />
    </div>
  );
}
