"use client";

import { Plus } from "lucide-react";

export default function CreateProjectGhostCard() {
  return (
    <button
      style={{
        width: "100%",
        minHeight: 340, // Matches the approximate height of your Project Cards
        backgroundColor: "#f9fafb",
        border: "2px dashed #d1d5db",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.2s ease",
        padding: 24,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#2563eb";
        e.currentTarget.style.backgroundColor = "#eff6ff";
        const icon = e.currentTarget.querySelector('.ghost-icon') as HTMLElement;
        if (icon) icon.style.color = "#2563eb";
        const text = e.currentTarget.querySelector('.ghost-text') as HTMLElement;
        if (text) text.style.color = "#2563eb";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#d1d5db";
        e.currentTarget.style.backgroundColor = "#f9fafb";
        const icon = e.currentTarget.querySelector('.ghost-icon') as HTMLElement;
        if (icon) icon.style.color = "#9ca3af";
        const text = e.currentTarget.querySelector('.ghost-text') as HTMLElement;
        if (text) text.style.color = "#6b7280";
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          backgroundColor: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
          border: "1px solid #e5e7eb"
        }}
      >
        <Plus className="ghost-icon" size={24} color="#9ca3af" style={{ transition: "color 0.2s ease" }} />
      </div>
      <span className="ghost-text" style={{ fontSize: 16, fontWeight: 600, color: "#6b7280", transition: "color 0.2s ease" }}>
        Create New Project
      </span>
      <span style={{ fontSize: 13, color: "#9ca3af", marginTop: 8, textAlign: "center", maxWidth: 220, lineHeight: 1.4 }}>
        Set up a new monitoring container for your APIs
      </span>
    </button>
  );
}