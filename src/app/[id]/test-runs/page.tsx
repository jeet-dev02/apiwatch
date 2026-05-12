"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useState } from "react";

// --- Initial Mock Data ---
const initialTableData = [
  { id: 1, method: "GET", path: "/api/users/me", status: 200, time: 112, consistency: "✓ Stable", auth: "✓ Valid JWT", result: "Pass", timeWidth: "15%" },
  { id: 2, method: "POST", path: "/api/auth/login", status: 201, time: 340, consistency: "✓ Stable", auth: "— Public", result: "Pass", timeWidth: "40%" },
  { id: 3, method: "GET", path: "/api/products", status: 200, time: 88, consistency: "✓ Stable", auth: "✓ API Key", result: "Pass", timeWidth: "10%" },
  { id: 4, method: "GET", path: "/api/payments/list", status: 429, time: 0, consistency: "⚠ Rate limited", auth: "✓ Bearer", result: "Warn", timeWidth: "0%" },
  { id: 5, method: "DEL", path: "/api/reports/old", status: 500, time: 2410, consistency: "✗ 3/5 failed", auth: "✗ 401 on retry", result: "Fail", timeWidth: "100%" },
  { id: 6, method: "PUT", path: "/api/profile/update", status: 200, time: 95, consistency: "✓ Stable", auth: "✓ Valid JWT", result: "Pass", timeWidth: "12%" },
];

const initialChartData = [
  { time: 112, height: "20%", color: "#10b981" },
  { time: 340, height: "45%", color: "#10b981" },
  { time: 88, height: "15%", color: "#10b981" },
  { time: 429, height: "55%", color: "#f59e0b" },
  { time: 2410, height: "100%", color: "#ef4444" },
  { time: 95, height: "18%", color: "#10b981" },
];

const initialStats = {
  health: "82%", avgResp: "248 ms", success: "83%", slowest: "2.4s",
  passed: 4, failed: 1, warnings: 1, slowestColor: "#dc2626"
};

// --- Helpers ---
const getMethodStyle = (method: string) => {
  switch (method) {
    case "GET": return { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" };
    case "POST": return { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" };
    case "DEL": return { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" };
    case "PUT": return { bg: "#fffbeb", text: "#d97706", border: "#fde68a" };
    default: return { bg: "#f3f4f6", text: "#4b5563", border: "#d1d5db" };
  }
};

const getBadgeStyle = (result: string) => {
  switch (result) {
    case "Pass": return { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" };
    case "Fail": return { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" };
    case "Warn": return { bg: "#fffbeb", text: "#d97706", border: "#fde68a" };
    default: return { bg: "#f3f4f6", text: "#4b5563", border: "#d1d5db" };
  }
};

export default function TestRunsPage() {
  const params = useParams();
  const projectId = params.id as string;

  // --- State Management ---
  const [isRunning, setIsRunning] = useState(false);
  const [tableData, setTableData] = useState(initialTableData);
  const [chartData, setChartData] = useState(initialChartData);
  const [stats, setStats] = useState(initialStats);
  const [isFixed, setIsFixed] = useState(false); // Tracks if we simulated the "fix"

  // --- Run Suite Simulation ---
  const handleRunSuite = () => {
    if (isRunning) return;
    setIsRunning(true);

    // Simulate network delay of 2 seconds
    setTimeout(() => {
      // Simulate fixing the broken API (/api/reports/old)
      const newTableData = [...tableData];
      newTableData[4] = { 
        ...newTableData[4], status: 200, time: 145, 
        consistency: "✓ Stable", auth: "✓ Valid JWT", result: "Pass", timeWidth: "20%" 
      };

      const newChartData = [...chartData];
      newChartData[4] = { time: 145, height: "25%", color: "#10b981" };

      setTableData(newTableData);
      setChartData(newChartData);
      setStats({
        health: "100%", avgResp: "155 ms", success: "100%", slowest: "340ms",
        passed: 5, failed: 0, warnings: 1, slowestColor: "#111827"
      });
      
      setIsFixed(true);
      setIsRunning(false);
    }, 2000);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb", padding: "32px 24px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
        
        {/* ── 1. Header Section ─────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link 
              href="/projects" 
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: "50%", color: "#6b7280", backgroundColor: "#ffffff", border: "1px solid #d1d5db", transition: "all 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f3f4f6"; e.currentTarget.style.color = "#111827"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#ffffff"; e.currentTarget.style.color = "#6b7280"; }}
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>Test Run Results</h1>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 12, backgroundColor: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", transition: "all 0.3s" }}>{stats.passed} Passed</span>
                  {stats.failed > 0 && <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 12, backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", transition: "all 0.3s" }}>{stats.failed} Failed</span>}
                  <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 12, backgroundColor: "#fffbeb", color: "#d97706", border: "1px solid #fde68a", transition: "all 0.3s" }}>{stats.warnings} Warning</span>
                </div>
              </div>
              <p style={{ fontSize: 14, color: "#6b7280", margin: 0, textTransform: "capitalize" }}>
                {projectId.replace(/-/g, " ")} · 6 endpoints · {isFixed ? "run just now" : "run 2 mins ago"}
              </p>
            </div>
          </div>
          
          {/* UPDATED BUTTON: Primary Blue Color with Loading State */}
          <button 
            onClick={handleRunSuite}
            disabled={isRunning}
            style={{ 
              display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", 
              backgroundColor: isRunning ? "#93c5fd" : "#2563eb", 
              border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#ffffff", 
              cursor: isRunning ? "not-allowed" : "pointer", 
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", transition: "all 0.2s" 
            }}
            onMouseEnter={(e) => { if(!isRunning) e.currentTarget.style.backgroundColor = "#1d4ed8"; }}
            onMouseLeave={(e) => { if(!isRunning) e.currentTarget.style.backgroundColor = "#2563eb"; }}
          >
            <RefreshCw size={16} style={{ animation: isRunning ? "spin 1s linear infinite" : "none" }} /> 
            {isRunning ? "Running..." : "Re-run suite"}
          </button>
        </div>

        {/* ── MAIN CONTENT WRAPPER (Dims when running) ──────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24, opacity: isRunning ? 0.6 : 1, pointerEvents: isRunning ? "none" : "auto", transition: "opacity 0.3s ease" }}>
          
          {/* ── 2. KPI Cards ──────────────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
            {[
              { label: "HEALTH SCORE", value: stats.health, color: "#16a34a" },
              { label: "AVG RESPONSE", value: stats.avgResp, color: "#111827" },
              { label: "SUCCESS RATE", value: stats.success, color: "#16a34a" },
              { label: "SLOWEST API", value: stats.slowest, color: stats.slowestColor },
              { label: "TOTAL TESTS", value: "6", color: "#111827" },
            ].map((stat, i) => (
              <div key={i} style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: "0.05em", marginBottom: 8 }}>{stat.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: stat.color, transition: "color 0.3s" }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* ── 3. Visualizer (Response Time Bar Chart) ───────────────────── */}
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24, boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: "0 0 24px 0" }}>Response time per endpoint (ms)</h3>
            <div style={{ height: 160, display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 20px", position: "relative" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, borderBottom: "1px dashed #e5e7eb", width: "100%" }} />
              <div style={{ position: "absolute", top: "50%", left: 0, right: 0, borderBottom: "1px dashed #e5e7eb", width: "100%" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, borderBottom: "1px solid #d1d5db", width: "100%" }} />

              {chartData.map((bar, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", width: "12%", height: "100%", zIndex: 1 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 8, transition: "all 0.3s" }}>{bar.time}</span>
                  <div style={{ height: bar.height, width: "100%", backgroundColor: bar.color, borderRadius: "4px 4px 0 0", opacity: 0.9, transition: "all 0.4s ease", cursor: "pointer" }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = "0.9"}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── 4. Detailed Test Results Table ────────────────────────────── */}
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", backgroundColor: "#fafafa" }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0 }}>Detailed test results</h3>
            </div>
            
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: "16px 24px", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Method</th>
                  <th style={{ padding: "16px 24px", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Endpoint</th>
                  <th style={{ padding: "16px 24px", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Status</th>
                  <th style={{ padding: "16px 24px", fontSize: 13, fontWeight: 600, color: "#6b7280", width: "20%" }}>Response time</th>
                  <th style={{ padding: "16px 24px", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Consistency (5x)</th>
                  <th style={{ padding: "16px 24px", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Auth</th>
                  <th style={{ padding: "16px 24px", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Result</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row) => {
                  const methodStyle = getMethodStyle(row.method);
                  const badgeStyle = getBadgeStyle(row.result);
                  const barColor = row.result === "Pass" ? "#10b981" : row.result === "Fail" ? "#ef4444" : "#f59e0b";

                  return (
                    <tr key={row.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "16px 24px" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 6, backgroundColor: methodStyle.bg, color: methodStyle.text, border: `1px solid ${methodStyle.border}` }}>
                          {row.method}
                        </span>
                      </td>
                      <td style={{ padding: "16px 24px", fontSize: 14, fontWeight: 500, color: "#111827", fontFamily: "monospace" }}>{row.path}</td>
                      <td style={{ padding: "16px 24px", fontSize: 14, fontWeight: 600, color: row.status >= 500 ? "#ef4444" : row.status >= 400 ? "#f59e0b" : "#111827", transition: "color 0.3s" }}>
                        {row.status}
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        {row.time > 0 ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontSize: 14, fontWeight: 500, color: "#374151", width: 48, transition: "color 0.3s" }}>{row.time}ms</span>
                            <div style={{ flex: 1, height: 6, backgroundColor: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
                              <div style={{ width: row.timeWidth, height: "100%", backgroundColor: barColor, borderRadius: 3, transition: "all 0.5s ease" }} />
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: 14, color: "#9ca3af" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "16px 24px", fontSize: 13, color: row.consistency.includes("Stable") ? "#4b5563" : "#dc2626", fontWeight: row.consistency.includes("Stable") ? 500 : 600, transition: "color 0.3s" }}>{row.consistency}</td>
                      <td style={{ padding: "16px 24px", fontSize: 13, color: row.auth.includes("401") ? "#dc2626" : "#4b5563", fontWeight: row.auth.includes("401") ? 600 : 500 }}>{row.auth}</td>
                      <td style={{ padding: "16px 24px" }}>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 6, backgroundColor: badgeStyle.bg, color: badgeStyle.text, border: `1px solid ${badgeStyle.border}`, transition: "all 0.3s" }}>
                          {row.result}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── 5. Forensic Footer (Dynamic based on simulation) ────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
            
            {/* Status Code Distribution */}
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24, display: "flex", alignItems: "center", gap: 32, boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" }}>
              <div style={{ position: "relative", width: 80, height: 80, borderRadius: "50%", background: isFixed ? "conic-gradient(#10b981 0% 83%, #f59e0b 83% 100%)" : "conic-gradient(#10b981 0% 66%, #f59e0b 66% 83%, #ef4444 83% 100%)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.5s" }}>
                <div style={{ width: 60, height: 60, backgroundColor: "#ffffff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#111827" }}>
                  6
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 12px 0" }}>Status Distribution</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#4b5563" }}><span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#10b981" }}/> 2xx Success — {isFixed ? "5" : "4"}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#4b5563" }}><span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#f59e0b" }}/> 4xx Client error — 1</div>
                  {!isFixed && <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#4b5563" }}><span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#ef4444" }}/> 5xx Server error — 1</div>}
                </div>
              </div>
            </div>

            {/* Dynamic Flapping Box */}
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", justifyContent: "center", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 8px 0" }}>Repeat request handling (5x same endpoint)</h4>
              <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 16px 0" }}><code style={{ backgroundColor: "#f3f4f6", padding: "2px 6px", borderRadius: 4, color: isFixed ? "#16a34a" : "#dc2626" }}>/api/reports/old</code> fired 5 times consecutively:</p>
              
              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  {[1, 2, 3, 4, 5].map((label, i) => {
                    const status = isFixed ? 200 : (i === 3 ? 200 : 500); // Turns all green if fixed
                    return (
                      <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: status === 200 ? "#f0fdf4" : "#fef2f2", border: `1px solid ${status === 200 ? "#bbf7d0" : "#fecaca"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: status === 200 ? "#16a34a" : "#dc2626", transition: "all 0.3s" }}>
                          {status}
                        </div>
                        <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>{label}</span>
                      </div>
                    )
                  })}
                </div>
                {isFixed ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#16a34a", fontSize: 14, fontWeight: 500, padding: "8px 16px", backgroundColor: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0", animation: "fadeIn 0.5s" }}>
                    <CheckCircle2 size={16} /> Stabilized — 100% success rate
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#dc2626", fontSize: 14, fontWeight: 500, padding: "8px 16px", backgroundColor: "#fef2f2", borderRadius: 8, border: "1px solid #fecaca" }}>
                    <AlertTriangle size={16} /> Inconsistent — flapping detected
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
      
      {/* CSS For the spinning icon */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}} />
    </div>
  );
}