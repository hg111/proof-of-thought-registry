export default function MonoBlock({ label, value, mode }: { label: string; value: string; mode?: 'light' | 'dark' }) {
  const isDark = mode === 'dark';
  return (
    <div style={{ marginBottom: 10 }}>
      {/* Label: Dark mode uses var(--muted) color equivalent ~ #a6b0c5 */}
      <div style={{ fontSize: 12, color: isDark ? "#a6b0c5" : "#333", marginBottom: 4 }}>{label}</div>
      <div className="mono" style={{
        border: isDark ? "1px solid rgba(255,255,255,0.2)" : "1px solid #000",
        padding: 10,
        color: isDark ? "#e9edf7" : "inherit"
      }}>
        {value}
      </div>
    </div>
  );
}
