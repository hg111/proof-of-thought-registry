// src/app/page.tsx
import Divider from "@/components/Divider";

export default function Home({
  searchParams,
}: {
  searchParams: { e?: string; next?: string };
}) {
  const hasError = searchParams?.e === "1";
  const next = searchParams?.next || "/consent";

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "36px 18px" }}>
      <div className="kicker">PROOF OF THOUGHT™</div>
      <h1 className="h1">Private Beta Access</h1>
      <p className="subhead">
        This system is currently in limited private use. Enter the access phrase provided to you.
      </p>

      <Divider />

      {hasError ? (
        <p className="small" style={{ color: "crimson", marginBottom: 10 }}>
          Access phrase incorrect.
        </p>
      ) : null}

      <form method="POST" action="/api/private-access">
        <input type="hidden" name="next" value={next} />
        <input
          name="phrase"
          type="password"
          placeholder="Access phrase"
          autoComplete="current-password"
          style={{
            width: "100%",
            padding: "12px 14px",
            border: "1px solid #ccc",
            borderRadius: 10,
            fontSize: 16,
          }}
        />
        <button
          type="submit"
          style={{
            marginTop: 12,
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #000",
            background: "#000",
            color: "#fff",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Enter Proof-of-Thought
        </button>
      </form>

      <Divider />

      <p className="small">
        If you don’t have an access phrase, this isn’t open yet.
      </p>
    </main>
  );
}