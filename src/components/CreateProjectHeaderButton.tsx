"use client";

import { Plus } from "lucide-react";

interface CreateProjectHeaderButtonProps {
  onClick?: () => void;
}

export default function CreateProjectHeaderButton({ onClick }: CreateProjectHeaderButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: "#2563eb",
        color: "#ffffff",
        padding: "10px 16px",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 8,
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        transition: "background-color 0.2s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1d4ed8")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
    >
      <Plus size={18} />
      Create Project
    </button>
  );
}