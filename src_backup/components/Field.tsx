export default function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 12, marginBottom: 6, color: "#333" }}>{label}</div>
      {children}
    </label>
  );
}
