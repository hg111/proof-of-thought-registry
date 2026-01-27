export default function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid #000", padding: 12 }}>
      <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 10 }}>
        {title}
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}
