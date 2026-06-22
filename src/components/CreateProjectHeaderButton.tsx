"use client";

import { Plus, Loader2 } from "lucide-react";
import { useNavigation } from "@/context/NavigationContext"; // ✨ Import Global Lock

interface CreateProjectHeaderButtonProps {
  onClick?: () => void;
  isLoading?: boolean; 
}

export default function CreateProjectHeaderButton({ onClick, isLoading }: CreateProjectHeaderButtonProps) {
  const { isNavigating } = useNavigation();
  
  // Disable and dim the button if it's currently loading its modal OR if a global navigation is happening
  const isLocked = isLoading || isNavigating;

  return (
    <button
      onClick={onClick}
      disabled={isLocked} // ✨ Disable if globally locked
      style={{
        backgroundColor: "#2563eb",
        color: "#ffffff",
        padding: "10px 16px",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        border: "none",
        cursor: isLocked ? "not-allowed" : "pointer", 
        display: "flex",
        alignItems: "center",
        gap: 8,
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        transition: "background-color 0.2s ease, opacity 0.2s ease",
        opacity: isLocked ? 0.5 : 1, // ✨ Grey out if locked
      }}
      onMouseEnter={(e) => {
        if (!isLocked) e.currentTarget.style.backgroundColor = "#1d4ed8";
      }}
      onMouseLeave={(e) => {
        if (!isLocked) e.currentTarget.style.backgroundColor = "#2563eb";
      }}
    >
      {isLoading ? (
        <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
      ) : (
        <Plus size={18} />
      )}
      {isLoading ? "Loading..." : "Create Project"}
    </button>
  );
}