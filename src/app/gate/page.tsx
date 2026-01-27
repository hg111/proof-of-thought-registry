export default function GatePage({
  searchParams,
}: {
  searchParams: { next?: string; e?: string };
}) {
  const next = searchParams?.next || "/";
  const err = searchParams?.e ? "Incorrect password." : "";

  return (
    <main style={{ maxWidth: 520, margin: "48px auto", padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Private Preview</h1>
      <p style={{ marginTop: 8, opacity: 0.85 }}>
        Enter the access password to continue.
      </p>

      {err ? (
        <p style={{ marginTop: 12, color: "crimson" }}>{err}</p>
      ) : null}

      <form method="POST" action="/api/private-access" style={{ marginTop: 16 }}>
        <input type="hidden" name="next" value={next} />
        <input
          name="phrase"
          type="password"
          placeholder="Password"
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 10,
            border: "1px solid #ccc",
          }}
          autoFocus
        />
        <button
          type="submit"
          style={{
            marginTop: 12,
            width: "100%",
            padding: 12,
            borderRadius: 10,
            border: "1px solid #000",
            background: "#000",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Unlock
        </button>
      </form>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid #eee', fontSize: 13, lineHeight: 1.6, opacity: 0.7, color: '#666' }}>
        <p style={{ fontWeight: 600, marginBottom: 8 }}>Proof of Thought is currently in private beta.</p>
        <p>
          Access is limited and granted selectively to creators, researchers, and partners exploring provenance, custody, and controlled disclosure.
        </p>
        <p style={{ marginTop: 12 }}>
          Contact us below to request an invitation:<br />
          <a href="mailto:team.proofofthought@gmail.com" style={{ color: 'inherit', textDecoration: 'underline' }}>team.proofofthought@gmail.com</a>
        </p>
      </div>
    </main>
  );
}