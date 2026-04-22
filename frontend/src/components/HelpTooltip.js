import React, { useState } from "react";

export default function HelpTooltip({ content }) {
  const [open, setOpen] = useState(false);

  if (!content) return null;

  return (
    <span style={{ position: "relative", marginLeft: "6px" }}>
      <span
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        style={{
          cursor: "pointer",
          background: "#e5e7eb",
          borderRadius: "50%",
          padding: "2px 6px",
          fontSize: "12px",
          fontWeight: "bold",
          display: "inline-block",
          lineHeight: 1.2
        }}
      >
        ?
      </span>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "24px",
            left: 0,
            width: "260px",
            background: "#111827",
            color: "#fff",
            padding: "10px",
            borderRadius: "8px",
            fontSize: "13px",
            zIndex: 1000,
            boxShadow: "0 8px 20px rgba(0,0,0,0.2)"
          }}
        >
          <strong>{content.title}</strong>
          <div style={{ marginTop: "4px" }}>{content.text}</div>
        </div>
      )}
    </span>
  );
}