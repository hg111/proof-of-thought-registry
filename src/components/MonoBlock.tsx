export default function MonoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 12, color: "#333", marginBottom: 4 }}>{label}</div>
      <div className="mono" style={{ border: "1px solid #000", padding: 10 }}>
        {value}
      </div>
    </div>
  );
}
