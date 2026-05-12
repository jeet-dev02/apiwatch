"use client";

import Link from "next/link";

export default function SeeAllButton() {
  return (
    <Link
      href="/projects"
      style={{
        backgroundColor: "transparent",
        color: "#6b7280", // Subtle gray text
        border: "1px solid #e5e7eb", // Matches the card borders
        padding: "8px 16px",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 500,
        textDecoration: "none",
        transition: "all 0.2s ease",
        display: "inline-block",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#f9fafb"; // Slight hover effect
        e.currentTarget.style.color = "#111827"; // Darken text on hover
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.color = "#6b7280";
      }}
    >
      See all projects &rarr;
    </Link>
  );
}