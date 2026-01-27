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
    </main>
  );
}