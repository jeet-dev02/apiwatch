"use client";

import Link from "next/link";
import { useAlerts } from "@/context/AlertContext";

/* ── Severity palette ─────────────────────────────────────────────────── */
const severityConfig = {
  critical: { bg: "#fef2f2", dot: "#dc2626", border: "#fee2e2" },
  warning:  { bg: "#fffbeb", dot: "#d97706", border: "#fef3c7" },
};

export default function ActiveAlertsPanel() {
  // 1. Hook into our new Global Alerts Context
  const { alerts } = useAlerts();
  
  // 2. Filter to ONLY show 'active' alerts, and take the 3 newest ones
  const activeAlerts = alerts.filter(a => a.status === "active").slice(0, 3);

  // 3. Display a success message if all alerts are resolved!
  if (!activeAlerts || activeAlerts.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#10b981", border: "1px solid #e5e7eb", borderRadius: 12, backgroundColor: "#ffffff", fontWeight: 500 }}>
        ✅ All systems operational. No active alerts.
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 24,
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
      }}
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
          Active Alerts
        </span>
        
        {/* Highly visible link button */}
        <Link 
          href="/alerts" 
          style={{ 
            fontSize: 13, 
            fontWeight: 600, 
            color: "#2563eb", 
            backgroundColor: "#eff6ff", 
            padding: "8px 16px", 
            borderRadius: 8, 
            textDecoration: "none", 
            border: "1px solid #bfdbfe", 
            transition: "all 0.2s ease" 
          }}
          onMouseEnter={(e) => { 
            e.currentTarget.style.backgroundColor = "#dbeafe"; 
            e.currentTarget.style.borderColor = "#93c5fd"; 
          }}
          onMouseLeave={(e) => { 
            e.currentTarget.style.backgroundColor = "#eff6ff"; 
            e.currentTarget.style.borderColor = "#bfdbfe"; 
          }}
        >
          View all alerts →
        </Link>
      </div>

      {/* ── Alert rows ──────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {activeAlerts.map((alert) => {
          // Use type assertion as fallback just in case
          const config = severityConfig[alert.type as "critical" | "warning"] || severityConfig.warning;

          return (
            <div
              key={alert.id}
              style={{
                backgroundColor: config.bg,
                border: `1px solid ${config.border}`,
                borderRadius: 8,
                padding: "16px",
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              {/* Colored dot */}
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: config.dot,
                  flexShrink: 0,
                  marginTop: 6,
                }}
              />

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#111827",
                    lineHeight: 1.4,
                    marginBottom: 4,
                  }}
                >
                  {alert.project} <span style={{ color: "#9ca3af", fontWeight: 400, margin: "0 4px" }}>—</span> {alert.issue}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#6b7280",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {alert.path} <span style={{ color: "#d1d5db", margin: "0 4px" }}>—</span> {alert.details}
                </div>
              </div>

              {/* Time ago */}
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#6b7280",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                }}
              >
                {alert.time}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}