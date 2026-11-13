import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlockViewer } from "@/components/client";
import { currentUser } from "@/lib/auth.ts";
import { blockFiles } from "@/lib/block-source.ts";
import { FRAMEWORKS, type CodeFile } from "@/lib/convert.ts";
import { userHasPremium } from "@/lib/payments.ts";
import { BLOCKS, blockBySlug } from "@/lib/registry.ts";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const b = blockBySlug((await params).slug);
  return b ? { title: `${b.title} block`, description: b.description } : {};
}

export default async function BlockPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const block = blockBySlug(slug);
  if (!block) notFound();
  const user = await currentUser();
  const unlocked = !block.premium || (await userHasPremium(user?.id));
  // Premium source never leaves the server unless the viewer holds a licence.
  const files = unlocked ? (Object.fromEntries(FRAMEWORKS.map((fw) => [fw, blockFiles(slug, fw)])) as Record<string, CodeFile[]>) : null;
  const related = BLOCKS.filter((b) => b.category === block.category && b.slug !== slug).slice(0, 3);
  return (
    <div className="onl-container onl-container--xl" style={{ paddingBlock: "28px 64px" }}>
      <nav aria-label="Breadcrumb">
        <ol className="onl-breadcrumb">
          <li><Link href="/blocks">Blocks</Link></li>
          <li><Link href={`/blocks?category=${encodeURIComponent(block.category)}`}>{block.category}</Link></li>
          <li><span aria-current="page">{block.title}</span></li>
        </ol>
      </nav>
      <div className="onl-row onl-row--between" style={{ marginTop: 10, marginBottom: 18, alignItems: "flex-end" }}>
        <div>
          <div className="onl-row" style={{ ["--onl-gap" as string]: "10px" }}>
            <h1 className="onl-h1">{block.title}</h1>
            {block.premium ? <span className="site-pro">PRO</span> : <span className="onl-badge onl-badge--success">Free</span>}
          </div>
          <p className="onl-text-muted" style={{ marginTop: 6, maxWidth: 720 }}>{block.description}</p>
        </div>
        {block.premium && !unlocked && (
          <Link href="/pricing" className="onl-btn onl-btn--brand">Unlock with Pro</Link>
        )}
        {block.premium && unlocked && <span className="onl-badge onl-badge--success">Unlocked with your licence</span>}
      </div>
      <BlockViewer slug={slug} height={block.height} files={files} locked={!unlocked} signedIn={!!user} />
      {related.length > 0 && (
        <>
          <h2 className="onl-h3" style={{ marginTop: 40 }}>More in {block.category}</h2>
          <div className="onl-grid" style={{ ["--onl-min" as string]: "280px", marginTop: 14 }}>
            {related.map((b) => (
              <Link key={b.slug} href={`/blocks/${b.slug}`} className="onl-card onl-card--interactive onl-card--pad site-plain" style={{ color: "inherit" }}>
                <div className="onl-row onl-row--between onl-row--nowrap">
                  <b>{b.title}</b>
                  {b.premium ? <span className="site-pro">PRO</span> : <span className="onl-badge onl-badge--success">Free</span>}
                </div>
                <p className="onl-text-sm onl-text-muted" style={{ marginTop: 4 }}>{b.description}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
