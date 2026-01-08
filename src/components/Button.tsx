"use client";

import Link from "next/link";
import { useState, useRef } from "react";

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
  const [active, setActive] = useState(false);

  // Logic for mobile long-press
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const className = "inline-block" as const;

  const style: React.CSSProperties = {
    border: hovered ? "1px solid #0000FF" : "1px solid #bbb",
    padding: "0 12px",
    height: "36px",
    borderRadius: 4,
    background: active ? "#f2f2f2" : "#fff",
    color: "#000",
    textDecoration: "none",
    fontSize: 13,
    cursor: (props as any).disabled ? "not-allowed" : "pointer",
    opacity: (props as any).disabled ? 0.5 : 1,
    userSelect: "none",
    boxShadow: "-2px 3px 5px rgba(0,0,0,0.1)",
    transition: "all 0.1s ease",
    verticalAlign: "middle",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
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
    WebkitTapHighlightColor: "transparent", // Clean up interactions on iOS
  };

  // Mouse handlers (Desktop)
  const handleMouseEnter = () => {
    // Only show on mouse hover
    if (window.matchMedia && window.matchMedia('(hover: hover)').matches) {
      setHovered(true);
    }
  };
  const handleMouseLeave = () => {
    setHovered(false);
    setActive(false);
  };
  const handleMouseDown = () => setActive(true);
  const handleMouseUp = () => setActive(false);

  // Touch handlers (Mobile)
  const handleTouchStart = () => {
    setActive(true);
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      setHovered(true); // Show tooltip
    }, 1000); // 1.0s long press
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setActive(false);
    setHovered(false); // Hide tooltip on release

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (isLongPress.current) {
      e.preventDefault(); // Prevent click action
    }
  };

  const content = "href" in props ? (
    <Link
      className={className}
      href={props.href}
      style={style}
      aria-disabled={!!props.disabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {props.children}
    </Link>
  ) : (
    <button
      type={props.type ?? "button"}
      style={style}
      onClick={props.disabled ? undefined : props.onClick}
      disabled={props.disabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {props.children}
    </button>
  );

  if (!props.tooltip) {
    return content;
  }

  return (
    <div style={wrapperStyle}>
      {content}
      {hovered && (
        <div style={tooltipStyle}>
          {props.tooltip}
        </div>
      )}
    </div>
  );
}
