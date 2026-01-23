export const metadata = {
  title: "Proof of Thought™ Public Registry",
  description: "Public cryptographic verification ledger",
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: 28 }}>
      {children}
    </main>
  );
}