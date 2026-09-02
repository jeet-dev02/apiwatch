"use client";

import { useState } from "react";
// FIXED: Removed the unused 'Filter' import
import { BellRing, CheckCircle2, Search, X, Check, Activity, Clock, FileCode2 } from "lucide-react";
import { useAlerts, StatefulAlert } from "@/context/AlertContext";

export default function AlertsPage() {
  const { alerts, resolveAlert, resolveAll } = useAlerts();
  
  // Filter States
  const [activeTab, setActiveTab] = useState<"active" | "resolved">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");

  // Drawer States
  const [selectedAlert, setSelectedAlert] = useState<StatefulAlert | null>(null);

  // Derived Data
  const projectsList = ["All", ...Array.from(new Set(alerts.map(a => a.project)))];
  
  const filteredAlerts = alerts.filter(alert => {
    const matchesTab = alert.status === activeTab;
    const matchesSearch = alert.project.toLowerCase().includes(searchQuery.toLowerCase()) || alert.issue.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = projectFilter === "All" || alert.project === projectFilter;
    const matchesSeverity = severityFilter === "All" || alert.type === severityFilter;
    return matchesTab && matchesSearch && matchesProject && matchesSeverity;
  });

  const criticalCount = alerts.filter(a => a.status === "active" && a.type === "critical").length;
  const warningCount = alerts.filter(a => a.status === "active" && a.type === "warning").length;

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <BellRing color="#dc2626" /> Alert Center
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "8px 0 0" }}>
            Monitoring and triaging active failures across your workspaces.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ backgroundColor: "#fef2f2", color: "#dc2626", padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "1px solid #fecaca" }}>
            {criticalCount} Critical
          </div>
          <div style={{ backgroundColor: "#fffbeb", color: "#d97706", padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "1px solid #fde68a" }}>
            {warningCount} Warnings
          </div>
        </div>
      </div>

      {/* ── Tabs & Resolve All ──────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e7eb", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 24 }}>
          {(["active", "resolved"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ padding: "12px 4px", fontSize: 14, fontWeight: activeTab === tab ? 600 : 500, color: activeTab === tab ? "#2563eb" : "#6b7280", borderBottom: `2px solid ${activeTab === tab ? "#2563eb" : "transparent"}`, backgroundColor: "transparent", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", textTransform: "capitalize" }}
            >
              {tab} Alerts ({alerts.filter(a => a.status === tab).length})
            </button>
          ))}
        </div>
        {activeTab === "active" && (
          <button onClick={resolveAll} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#4b5563", backgroundColor: "#ffffff", padding: "6px 12px", borderRadius: 6, border: "1px solid #d1d5db", cursor: "pointer", transition: "all 0.2s ease" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f9fafb"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#ffffff"; }}>
            <CheckCircle2 size={16} /> Mark all resolved
          </button>
        )}
      </div>

      {/* ── Filter Bar ──────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={16} color="#9ca3af" style={{ position: "absolute", left: 12, top: 10 }} />
          <input type="text" placeholder="Search by project or issue..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: "100%", padding: "10px 12px 10px 36px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
        </div>
        <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} style={{ width: 180, padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, outline: "none", backgroundColor: "#fff" }}>
          {projectsList.map(p => <option key={p} value={p}>{p === "All" ? "All Projects" : p}</option>)}
        </select>
        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} style={{ width: 160, padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, outline: "none", backgroundColor: "#fff" }}>
          <option value="All">All Severities</option>
          <option value="critical">Critical Only</option>
          <option value="warning">Warnings Only</option>
        </select>
      </div>

      {/* ── Alerts List ─────────────────────────────────────────── */}
      <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)", overflow: "hidden" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {filteredAlerts.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>No alerts found matching these filters.</div>
          ) : (
            filteredAlerts.map((alert, index) => {
              const isCritical = alert.type === "critical";
              const isLast = index === filteredAlerts.length - 1;
              const bg = activeTab === "resolved" ? "#f9fafb" : (isCritical ? "#fef2f2" : "#fffbeb");
              
              return (
                <div key={alert.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: isLast ? "none" : "1px solid #e5e7eb", backgroundColor: bg }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      {activeTab === "active" && <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: isCritical ? "#ef4444" : "#f59e0b", boxShadow: `0 0 0 3px ${isCritical ? "#ef444433" : "#f59e0b33"}` }} />}
                      <span style={{ fontSize: 15, fontWeight: 700, color: activeTab === "resolved" ? "#6b7280" : "#111827", textDecoration: activeTab === "resolved" ? "line-through" : "none" }}>{alert.project}</span>
                      <span style={{ color: "#d1d5db" }}>|</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: activeTab === "resolved" ? "#9ca3af" : (isCritical ? "#dc2626" : "#d97706") }}>{alert.issue}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "#6b7280", paddingLeft: activeTab === "active" ? 16 : 0 }}>
                      <span style={{ fontFamily: "monospace", backgroundColor: "#ffffff80", padding: "2px 6px", borderRadius: 4 }}>{alert.path}</span>
                      <span style={{ margin: "0 8px", color: "#d1d5db" }}>—</span>
                      {alert.details}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#6b7280" }}>{alert.time}</div>
                      {activeTab === "resolved" && <div style={{ fontSize: 11, color: "#9ca3af" }}>Resolved: {alert.resolvedAt}</div>}
                    </div>
                    
                    <button onClick={() => setSelectedAlert(alert)} style={{ padding: "6px 12px", fontSize: 13, fontWeight: 600, color: "#2563eb", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#dbeafe"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#eff6ff"}>
                      Investigate
                    </button>

                    {/* Checkmark Button to Resolve Single Alert */}
                    {activeTab === "active" && (
                      <button onClick={() => resolveAlert(alert.id)} title="Mark as resolved" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "50%", color: "#10b981", backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#10b981"; e.currentTarget.style.color = "#ffffff"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#ecfdf5"; e.currentTarget.style.color = "#10b981"; }}>
                        <Check size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Investigate Drawer (Forensics) ──────────────────────── */}
      {selectedAlert && (
        <>
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(2px)", zIndex: 100 }} onClick={() => setSelectedAlert(null)} />
          <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "100%", maxWidth: 500, backgroundColor: "#ffffff", boxShadow: "-4px 0 24px rgba(0, 0, 0, 0.15)", zIndex: 101, display: "flex", flexDirection: "column", animation: "slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}>
            
            {/* Drawer Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: selectedAlert.type === "critical" ? "#fef2f2" : "#fffbeb" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                  <Activity size={20} color={selectedAlert.type === "critical" ? "#dc2626" : "#d97706"} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>Incident Forensics</h2>
                  <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6b7280" }}>{selectedAlert.project}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAlert(null)} style={{ background: "transparent", border: "none", cursor: "pointer" }}><X size={20} color="#6b7280" /></button>
            </div>

            {/* Drawer Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
              
              <div>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Error Summary</h3>
                <div style={{ fontSize: 18, fontWeight: 600, color: "#111827", marginBottom: 4 }}>{selectedAlert.issue}</div>
                <div style={{ fontSize: 14, color: "#4b5563" }}>Endpoint: <span style={{ fontFamily: "monospace", color: "#2563eb", backgroundColor: "#eff6ff", padding: "2px 4px", borderRadius: 4 }}>{selectedAlert.path}</span></div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ padding: 16, backgroundColor: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}><CheckCircle2 size={14} /> Expected</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#16a34a" }}>Status: 200 OK</div>
                </div>
                <div style={{ padding: 16, backgroundColor: "#fef2f2", borderRadius: 8, border: "1px solid #fee2e2" }}>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}><X size={14} /> Actual</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#dc2626" }}>Status: {selectedAlert.issue.split(" ")[0] || "500"}</div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}><Clock size={14} /> Request Metrics</h3>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e5e7eb", paddingBottom: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 14, color: "#4b5563" }}>Latency</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>1,402 ms</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e5e7eb", paddingBottom: 8 }}>
                  <span style={{ fontSize: 14, color: "#4b5563" }}>Time of Failure</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{selectedAlert.time}</span>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}><FileCode2 size={14} /> Response Body</h3>
                <div style={{ backgroundColor: "#1f2937", borderRadius: 8, padding: 16, overflowX: "auto" }}>
                  <pre style={{ margin: 0, color: "#e5e7eb", fontSize: 13, fontFamily: "monospace", lineHeight: 1.5 }}>
{`{
  "success": false,
  "error": {
    "code": "${selectedAlert.issue.split(" ")[0] || "ERROR"}",
    "message": "${selectedAlert.details}",
    "timestamp": "${new Date().toISOString()}"
  }
}`}
                  </pre>
                </div>
              </div>

            </div>

            {/* Drawer Footer */}
            {selectedAlert.status === "active" && (
              <div style={{ padding: 24, borderTop: "1px solid #e5e7eb", backgroundColor: "#fafafa" }}>
                <button onClick={() => { resolveAlert(selectedAlert.id); setSelectedAlert(null); }} style={{ width: "100%", padding: "12px", fontSize: 14, fontWeight: 600, color: "#ffffff", backgroundColor: "#10b981", border: "none", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#059669"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#10b981"}>
                  <CheckCircle2 size={18} /> Mark Alert as Resolved
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <style dangerouslySetInnerHTML={{ __html: `@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}} />
    </div>
  );
}