import Link from "next/link";

type Props =
  | { href: string; children: React.ReactNode; disabled?: boolean }
  | {
      children: React.ReactNode;
      disabled?: boolean;
      onClick?: () => void;
      type?: "button" | "submit";
    };

export default function Button(props: Props) {
  const className = "inline-block" as const;

  const style: React.CSSProperties = {
    border: "1px solid #000",
    padding: "10px 12px",
    borderRadius: 0,
    background: "#fff",
    color: "#000",
    textDecoration: "none",
    fontSize: 14,
    cursor: (props as any).disabled ? "not-allowed" : "pointer",
    opacity: (props as any).disabled ? 0.5 : 1,
    userSelect: "none",
  };

  if ("href" in props) {
    return (
      <Link className={className} href={props.href} style={style} aria-disabled={!!props.disabled}>
        {props.children}
      </Link>
    );
  }

  return (
    <button
      type={props.type ?? "button"}
      style={style}
      onClick={props.disabled ? undefined : props.onClick}
      disabled={props.disabled}
    >
      {props.children}
    </button>
  );
}
