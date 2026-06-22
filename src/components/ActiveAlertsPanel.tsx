"use client";

import Link from "next/link";
import { useState } from "react";
import { useAlerts } from "@/context/AlertContext";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useNavigation } from "@/context/NavigationContext"; // ✨ Import Global Lock

const severityConfig = {
  critical: { bg: "#fef2f2", dot: "#dc2626", border: "#fee2e2" },
  warning:  { bg: "#fffbeb", dot: "#d97706", border: "#fef3c7" },
};

export default function ActiveAlertsPanel() {
  const { alerts, refreshAlerts } = useAlerts(); 
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  
  // ✨ Connect to Global Navigation Lock
  const { isNavigating, navigatingTo, startNavigation } = useNavigation();
  const alertsHref = "/alerts";
  const isNavigatingAlerts = navigatingTo === alertsHref;

  const activeAlerts = alerts.filter(a => a.status === "active").slice(0, 3);

  const handleResolve = async (alertId: string) => {
    setResolvingId(alertId);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
      const API_KEY = process.env.NEXT_PUBLIC_API_KEY as string;

      await fetch(`${API_URL}/alerts/${alertId}/resolve`, {
        method: "PATCH",
        headers: { "x-api-key": API_KEY }
      });
      
      if (refreshAlerts) await refreshAlerts();
    } catch (error) {
      console.error("Failed to resolve alert", error);
    } finally {
      setResolvingId(null);
    }
  };

  if (!activeAlerts || activeAlerts.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#10b981", border: "1px solid #e5e7eb", borderRadius: 12, backgroundColor: "#ffffff", fontWeight: 500 }}>
        ✅ All systems operational. No active alerts.
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24, boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" }}>
      
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Active Alerts</span>
        <Link 
          href={alertsHref} 
          onClick={(e) => {
            if (isNavigating) {
              e.preventDefault();
              return;
            }
            startNavigation(alertsHref);
          }}
          style={{ 
            display: "flex", alignItems: "center", gap: 8,
            fontSize: 13, fontWeight: 600, color: "#2563eb", backgroundColor: "#eff6ff", padding: "8px 16px", borderRadius: 8, textDecoration: "none", border: "1px solid #bfdbfe", transition: "all 0.2s ease",
            pointerEvents: isNavigating ? "none" : "auto", 
            opacity: isNavigating && !isNavigatingAlerts ? 0.4 : 1 // ✨ Visual dim
          }}
          onMouseEnter={(e) => { if(!isNavigating) { e.currentTarget.style.backgroundColor = "#dbeafe"; e.currentTarget.style.borderColor = "#93c5fd"; } }}
          onMouseLeave={(e) => { if(!isNavigating) { e.currentTarget.style.backgroundColor = "#eff6ff"; e.currentTarget.style.borderColor = "#bfdbfe"; } }}
        >
          {isNavigatingAlerts && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
          View all alerts →
        </Link>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {activeAlerts.map((alert) => {
          const config = severityConfig[alert.type as "critical" | "warning"] || severityConfig.warning;
          const isResolving = resolvingId === alert.id;

          return (
            <div key={alert.id} style={{ backgroundColor: config.bg, border: `1px solid ${config.border}`, borderRadius: 8, padding: "16px", display: "flex", alignItems: "flex-start", gap: 12, opacity: isResolving || isNavigating ? 0.6 : 1, transition: "opacity 0.2s", pointerEvents: isNavigating ? "none" : "auto" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: config.dot, flexShrink: 0, marginTop: 6 }} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", lineHeight: 1.4, marginBottom: 4 }}>
                  {alert.project} <span style={{ color: "#9ca3af", fontWeight: 400, margin: "0 4px" }}>—</span> {alert.issue}
                </div>
                <div style={{ fontSize: 13, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {alert.path} <span style={{ color: "#d1d5db", margin: "0 4px" }}>—</span> {alert.details}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: "#6b7280" }}>{alert.time}</span>
                
                <button 
                  onClick={() => handleResolve(alert.id)}
                  disabled={isResolving || isNavigating}
                  title="Mark as resolved"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 6, color: "#10b981", backgroundColor: "#ffffff", border: "1px solid #d1fae5", cursor: isResolving || isNavigating ? "not-allowed" : "pointer", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { if(!isResolving && !isNavigating){ e.currentTarget.style.backgroundColor = "#d1fae5"; e.currentTarget.style.borderColor = "#a7f3d0"; } }}
                  onMouseLeave={(e) => { if(!isResolving && !isNavigating){ e.currentTarget.style.backgroundColor = "#ffffff"; e.currentTarget.style.borderColor = "#d1fae5"; } }}
                >
                  {isResolving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle2 size={16} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}