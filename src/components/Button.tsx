"use client";

import Link from "next/link";
import { useState } from "react";

type Props =
  | { href: string; children: React.ReactNode; disabled?: boolean; tooltip?: React.ReactNode }
  | {
    children: React.ReactNode;
    disabled?: boolean;
    onClick?: () => void;
    type?: "button" | "submit";
    tooltip?: React.ReactNode;
  };

export default function Button(props: Props) {
  const [hovered, setHovered] = useState(false);

  const className = "inline-block" as const;

  const style: React.CSSProperties = {
    border: "1px solid #bbb",
    padding: "8px 12px",
    borderRadius: 4,
    background: "#fff",
    color: "#000",
    textDecoration: "none",
    fontSize: 13,
    cursor: (props as any).disabled ? "not-allowed" : "pointer",
    opacity: (props as any).disabled ? 0.5 : 1,
    userSelect: "none",
    boxShadow: "-2px 3px 5px rgba(0,0,0,0.1)",
    transition: "all 0.1s ease",
    marginRight: 10,
    marginBottom: 10,
  };

  const tooltipStyle: React.CSSProperties = {
    position: "absolute",
    top: "100%",
    left: 0,
    marginTop: 8,
    width: 260,
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    padding: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    fontSize: "0.85rem",
    lineHeight: "1.4",
    zIndex: 100,
    color: "#333",
    textAlign: "left",
    borderRadius: 4,
    whiteSpace: "normal",
  };

  const wrapperStyle: React.CSSProperties = {
    position: "relative",
    display: "inline-block",
  };

  const content = "href" in props ? (
    <Link className={className} href={props.href} style={style} aria-disabled={!!props.disabled}>
      {props.children}
    </Link>
  ) : (
    <button
      type={props.type ?? "button"}
      style={style}
      onClick={props.disabled ? undefined : props.onClick}
      disabled={props.disabled}
    >
      {props.children}
    </button>
  );

  if (!props.tooltip) {
    return content;
  }

  return (
    <div
      style={wrapperStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {content}
      {hovered && (
        <div style={tooltipStyle}>
          {props.tooltip}
        </div>
      )}
    </div>
  );
}
