"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useNavigation } from "@/context/NavigationContext"; // ✨ Import Global Lock

export default function SeeAllButton() {
  const { isNavigating, navigatingTo, startNavigation } = useNavigation();
  const href = "/projects";
  const isSpinning = navigatingTo === href;

  return (
    <Link
      href={href}
      onClick={(e) => {
        if (isNavigating) {
          e.preventDefault();
          return;
        }
        startNavigation(href);
      }}
      style={{
        backgroundColor: "transparent",
        color: "#6b7280",
        border: "1px solid #e5e7eb", 
        padding: "8px 16px",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 500,
        textDecoration: "none",
        transition: "all 0.2s ease",
        display: "flex",
        alignItems: "center",
        gap: 8,
        pointerEvents: isNavigating ? "none" : "auto", // ✨ Physical block
        opacity: isNavigating && !isSpinning ? 0.4 : 1, // ✨ Visual dim
      }}
      onMouseEnter={(e) => {
        if (!isNavigating) {
          e.currentTarget.style.backgroundColor = "#f9fafb"; 
          e.currentTarget.style.color = "#111827"; 
        }
      }}
      onMouseLeave={(e) => {
        if (!isNavigating) {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = "#6b7280";
        }
      }}
    >
      {isSpinning && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
      See all projects &rarr;
    </Link>
  );
}