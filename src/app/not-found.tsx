import Link from "next/link";

export default function NotFound() {
  return (
    <div className="onl-empty" style={{ paddingBlock: 96 }}>
      <p className="onl-eyebrow">404</p>
      <h1 className="onl-h1">Page not found</h1>
      <p className="onl-empty__text">The page may have moved. Try the docs or the blocks gallery.</p>
      <div className="onl-row" style={{ justifyContent: "center", marginTop: 12 }}>
        <Link className="onl-btn onl-btn--brand" href="/docs/introduction">Docs</Link>
        <Link className="onl-btn" href="/blocks">Blocks</Link>
      </div>
    </div>
  );
}
