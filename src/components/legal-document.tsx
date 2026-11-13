import Link from "next/link";
import legal from "@/content/legal.json";

/* Generated content: edit E:\ONLYN-IFY\legal\policies.mjs, then run `node legal/sync.mjs`. */
type Section = { id: string; heading: string; paragraphs: string[]; bullets?: string[] };
type Doc = { title: string; intro: string; sections: Section[] };

export function LegalDocument({ which }: { which: "terms" | "privacy" }) {
  const doc = legal[which] as Doc;
  const other = which === "terms" ? { href: "/privacy", label: "Privacy Policy" } : { href: "/terms", label: "Terms of Service" };
  return (
    <div className="onl-container onl-container--md" style={{ paddingBlock: "40px 64px" }}>
      <p className="onl-eyebrow">Legal</p>
      <h1 className="onl-h1" style={{ fontSize: "2rem", marginTop: 6 }}>{doc.title}</h1>
      <p className="onl-lead" style={{ marginTop: 8 }}>{doc.intro}</p>
      <p className="onl-text-sm onl-text-muted" style={{ marginTop: 6 }}>
        Effective {legal.effective} · <Link href={other.href}>{other.label}</Link>
      </p>
      {legal.draft && (
        <div className="onl-alert onl-alert--warning" role="note" style={{ marginTop: 20 }}>
          <div className="onl-alert__content">
            <p className="onl-alert__title">Draft</p>
            <p className="onl-alert__body">This policy is awaiting legal review and may change before launch.</p>
          </div>
        </div>
      )}
      <nav aria-label="Contents" className="onl-card onl-card--pad" style={{ marginTop: 24 }}>
        <p className="onl-card__title">Contents</p>
        <ol className="onl-grid" style={{ ["--onl-min" as string]: "240px", ["--onl-gap" as string]: "4px 16px", margin: "8px 0 0", padding: 0, listStyle: "none" }}>
          {doc.sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="onl-text-sm">{s.heading}</a>
            </li>
          ))}
        </ol>
      </nav>
      <article className="onl-card onl-card--pad-lg site-prose" style={{ marginTop: 24, maxWidth: "none" }}>
        {doc.sections.map((s) => (
          <section key={s.id} id={s.id} style={{ scrollMarginTop: 80 }}>
            <h2 style={{ marginTop: 0 }}>{s.heading}</h2>
            {s.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            {s.bullets && <ul>{s.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>}
          </section>
        ))}
      </article>
    </div>
  );
}
