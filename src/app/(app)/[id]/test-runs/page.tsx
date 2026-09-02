"use client";

import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, AlertTriangle, CheckCircle2, Loader2, Terminal } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { useProjects } from "@/context/ProjectContext";
import OverallPerformanceChart from "@/components/OverallPerformanceChart"; 
import PageSkeleton from "@/components/ui/PageSkeleton"; 
import { api, ApiResponse } from "@/lib/api";

interface TestResult {
  id: string;
  endpointId: string;
  statusCode: number | null;
  responseTimeMs: number;
  result: "PASS" | "WARN" | "FAIL";
  errorMessage: string | null;
  consistencyStable: boolean;
  consistencyResults: string; 
  endpoint: { method: string; path: string };
  authResult: string;
}

interface TestRun {
  id: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  startedAt: string;
  completedAt: string | null;
  totalTests: number;
  passed: number;
  failed: number;
  warned: number;
  healthScore: number;
  avgResponseTime: number;
  slowestTime: number;
  results: TestResult[];
}

const getMethodStyle = (method: string) => {
  switch (method) {
    case "GET": return { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" };
    case "POST": return { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" };
    case "DELETE": return { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" };
    case "PUT": return { bg: "#fffbeb", text: "#d97706", border: "#fde68a" };
    default: return { bg: "#f3f4f6", text: "#4b5563", border: "#d1d5db" };
  }
};

const getBadgeStyle = (result: string) => {
  switch (result) {
    case "PASS": return { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" };
    case "FAIL": return { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" };
    case "WARN": return { bg: "#fffbeb", text: "#d97706", border: "#fde68a" };
    default: return { bg: "#f3f4f6", text: "#4b5563", border: "#d1d5db" };
  }
};

const DiagnosticTerminal = () => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);

  const phases = [
    "Initializing worker queue & engine...",
    "Decrypting secured vault tokens...",
    "Executing 10-ping concurrent burst...",
    "Aggregating latency & consistency metrics...",
    "Finalizing health scores & assertions..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = p + Math.floor(Math.random() * 2) + 1;
        return next > 99 ? 99 : next;
      });
    }, 350); 
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress > 85) setPhase(4);
    else if (progress > 65) setPhase(3);
    else if (progress > 40) setPhase(2);
    else if (progress > 20) setPhase(1);
  }, [progress]);

  return (
    <div style={{
      position: "fixed", inset: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      backgroundColor: "rgba(249, 250, 251, 0.65)", backdropFilter: "blur(6px)",
      zIndex: 999
    }}>
      <div style={{
        width: 520, backgroundColor: "#111827", borderRadius: 12, padding: 32,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)", border: "1px solid #374151",
        animation: "fadeIn 0.2s ease-out"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, borderBottom: "1px solid #374151", paddingBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Terminal color="#10b981" size={24} />
            <h3 style={{ margin: 0, color: "#f3f4f6", fontSize: 18, fontWeight: 600 }}>Diagnostic Engine</h3>
          </div>
          <span style={{ color: "#10b981", fontSize: 24, fontWeight: 700, fontFamily: "monospace" }}>{progress}%</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: "monospace", fontSize: 14 }}>
          {phases.map((text, i) => {
            const isActive = phase === i;
            const isDone = phase > i;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, opacity: isDone || isActive ? 1 : 0.4, color: isDone ? "#10b981" : isActive ? "#60a5fa" : "#9ca3af", transition: "all 0.2s ease" }}>
                {isDone ? (
                  <CheckCircle2 size={18} />
                ) : isActive ? (
                  <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <div style={{ width: 18, height: 18, border: "2px solid #4b5563", borderRadius: "50%" }} />
                )}
                {text}
              </div>
            );
          })}
        </div>
        
        <div style={{ marginTop: 32, width: "100%", height: 6, backgroundColor: "#374151", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", backgroundColor: "#10b981", transition: "width 0.3s ease-out" }} />
        </div>
      </div>
    </div>
  );
};

function TestRunsContent() {
  const params = useParams();
  const searchParams = useSearchParams(); 
  const projectSlugFromUrl = params.id as string;
  
  const { projects, runAllTests } = useProjects();
  const currentProject = projects.find(p => p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') === projectSlugFromUrl) 
                         || projects.find(p => p.id === projectSlugFromUrl);

  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [forceHollywoodDelay, setForceHollywoodDelay] = useState(searchParams?.get("activeRun") === "true");

  useEffect(() => {
    if (forceHollywoodDelay) {
      const timer = setTimeout(() => {
        setForceHollywoodDelay(false);
        window.history.replaceState(null, '', `/${projectSlugFromUrl}/test-runs`);
      }, 3500); 
      return () => clearTimeout(timer);
    }
  }, [forceHollywoodDelay, projectSlugFromUrl]);

  useEffect(() => {
    if (!currentProject) return;
    
    let timerId: NodeJS.Timeout;
    let pollDelay = 2000; // Start at 2 seconds

    const fetchLatestRun = async () => {
      try {
        const json = await api.get<ApiResponse<TestRun[]>>(`/projects/${currentProject.id}/test-runs`);

        if (json.success && json.data.length > 0) {
          setTestRuns(json.data); 
          const latest = json.data[0];
          
          setIsInitialLoad(false); 
          
          if (latest.status === "COMPLETED" || latest.status === "FAILED") {
            setIsRunning(false);
            return; // Exit the loop entirely
          } else {
            setIsRunning(true);
            // Exponential backoff: increase delay by 1.5x, cap at 10 seconds
            pollDelay = Math.min(pollDelay * 1.5, 10000);
            timerId = setTimeout(fetchLatestRun, pollDelay);
          }
        } else {
          setIsInitialLoad(false);
        }
      } catch (err) {
        console.error("Failed to fetch runs", err);
        setIsInitialLoad(false);
        // Retry on failure, but back off slightly to give the server breathing room
        pollDelay = Math.min(pollDelay * 1.5, 10000);
        timerId = setTimeout(fetchLatestRun, pollDelay);
      }
    };

    fetchLatestRun();

    return () => clearTimeout(timerId);
  }, [currentProject]);
  const displayAsRunning = isRunning || forceHollywoodDelay;

  if (!currentProject) {
    return <PageSkeleton />;
  }

  if (isInitialLoad && !forceHollywoodDelay) {
    return <PageSkeleton />;
  }

  const latestRun = testRuns.length > 0 ? testRuns[0] : null;
  const results = latestRun?.results || [];

  const totalTests = latestRun?.totalTests || 0;
  const passed = latestRun?.passed || 0;
  const failed = latestRun?.failed || 0;
  const warned = latestRun?.warned || 0;
  const healthScore = latestRun?.healthScore ? Math.round(latestRun.healthScore) : 0;
  const avgResp = latestRun?.avgResponseTime ? Math.round(latestRun.avgResponseTime) : 0;
  const successRate = totalTests > 0 ? Math.round((passed / totalTests) * 100) : 0;
  const slowestTime = latestRun?.slowestTime || 0;

  let count2xx = 0, count4xx = 0, count5xx = 0, count0 = 0;
  results.forEach(r => {
    if (r.statusCode === 0 || !r.statusCode) count0++;
    else if (r.statusCode >= 200 && r.statusCode < 300) count2xx++;
    else if (r.statusCode >= 400 && r.statusCode < 500) count4xx++;
    else if (r.statusCode >= 500) count5xx++;
  });

  const unstableTarget = results.find(r => !r.consistencyStable) || 
                         results.reduce((prev, curr) => (prev.responseTimeMs > curr.responseTimeMs) ? prev : curr, results[0]);
  
  const targetPings = unstableTarget ? JSON.parse(unstableTarget.consistencyResults || "[]") : [];

  const handleRunSuite = async () => {
    if (displayAsRunning) return;
    setIsRunning(true);
    setForceHollywoodDelay(true); 
    await runAllTests(currentProject.id); 
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb", padding: "32px 24px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
        
        {displayAsRunning && <DiagnosticTerminal />}

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
                  <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 12, backgroundColor: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>{passed} Passed</span>
                  {failed > 0 && <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 12, backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>{failed} Failed</span>}
                  {warned > 0 && <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 12, backgroundColor: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" }}>{warned} Warning</span>}
                </div>
              </div>
              <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
                Project: <strong>{currentProject.title}</strong> · {totalTests} endpoints tested
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleRunSuite}
            disabled={displayAsRunning} 
            style={{ 
              display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", 
              backgroundColor: displayAsRunning ? "#93c5fd" : "#2563eb", 
              border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#ffffff", 
              cursor: displayAsRunning ? "not-allowed" : "pointer", 
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", transition: "all 0.2s" 
            }}
            onMouseEnter={(e) => { if(!displayAsRunning) e.currentTarget.style.backgroundColor = "#1d4ed8"; }}
            onMouseLeave={(e) => { if(!displayAsRunning) e.currentTarget.style.backgroundColor = "#2563eb"; }}
          >
            <RefreshCw size={16} style={{ animation: displayAsRunning ? "spin 1s linear infinite" : "none" }} /> 
            {displayAsRunning ? "Running Suite..." : "Re-run suite"}
          </button>
        </div>

        {/* ── MAIN CONTENT WRAPPER ──────────────────── */}
        {latestRun && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24, opacity: displayAsRunning ? 0.3 : 1, pointerEvents: displayAsRunning ? "none" : "auto", filter: displayAsRunning ? "grayscale(40%)" : "none", transition: "all 0.4s ease" }}>
            
            {/* ── Dashboard Chart & Metrics ── */}
            <OverallPerformanceChart 
                historicalRuns={testRuns} 
                latestRun={latestRun} 
            />

            {/* ── 2. KPI Cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
                {[
                { label: "HEALTH SCORE", value: `${healthScore}%`, color: healthScore === 100 ? "#16a34a" : healthScore >= 80 ? "#d97706" : "#dc2626" },
                { label: "AVG RESPONSE", value: `${avgResp}ms`, color: "#111827" },
                { label: "SUCCESS RATE", value: `${successRate}%`, color: successRate >= 90 ? "#16a34a" : "#dc2626" },
                { label: "SLOWEST API", value: `${slowestTime}ms`, color: slowestTime > 1000 ? "#dc2626" : "#111827" },
                { label: "TOTAL TESTS", value: totalTests.toString(), color: "#111827" },
                ].map((stat, i) => (
                <div key={i} style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: "0.05em", marginBottom: 8 }}>{stat.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: stat.color, transition: "color 0.3s" }}>{stat.value}</div>
                </div>
                ))}
            </div>

            {/* ── 3. Visualizer (Dynamic Response Time Bar Chart) ── */}
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24, boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: "0 0 24px 0" }}>Response time per endpoint (ms)</h3>
                <div style={{ height: 160, display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 20px", position: "relative", gap: 8 }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, borderBottom: "1px dashed #e5e7eb", width: "100%" }} />
                <div style={{ position: "absolute", top: "50%", left: 0, right: 0, borderBottom: "1px dashed #e5e7eb", width: "100%" }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, borderBottom: "1px solid #d1d5db", width: "100%" }} />

                {results.map((row, i) => {
                    const heightPercent = slowestTime > 0 ? Math.max((row.responseTimeMs / slowestTime) * 100, 5) : 5;
                    const barColor = row.result === "PASS" ? "#10b981" : row.result === "FAIL" ? "#ef4444" : "#f59e0b";
                    
                    return (
                        <div key={i} title={`${row.endpoint.path}: ${row.responseTimeMs}ms`} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", flex: 1, height: "100%", zIndex: 1 }}>
                            <span style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", marginBottom: 8 }}>{row.responseTimeMs > 0 ? row.responseTimeMs : "-"}</span>
                            <div style={{ height: `${heightPercent}%`, width: "100%", maxWidth: 40, backgroundColor: barColor, borderRadius: "4px 4px 0 0", opacity: 0.9, transition: "all 0.4s ease", cursor: "pointer" }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = "0.9"}
                            />
                        </div>
                    );
                })}
                </div>
            </div>

            {/* ── 4. Detailed Test Results Table ── */}
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", backgroundColor: "#fafafa" }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0 }}>Detailed test results</h3>
                </div>
                
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                    <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <th style={{ padding: "16px 24px", fontSize: 13, fontWeight: 600, color: "#6b7280", width: 80 }}>Method</th>
                    <th style={{ padding: "16px 24px", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Endpoint</th>
                    <th style={{ padding: "16px 24px", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Status</th>
                    <th style={{ padding: "16px 24px", fontSize: 13, fontWeight: 600, color: "#6b7280", width: "20%" }}>Avg Speed</th>
                    <th style={{ padding: "16px 24px", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Stability (10x)</th>
                    <th style={{ padding: "16px 24px", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Auth</th>
                    <th style={{ padding: "16px 24px", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Result</th>
                    </tr>
                </thead>
                <tbody>
                    {results.map((row) => {
                    const methodStyle = getMethodStyle(row.endpoint.method);
                    const badgeStyle = getBadgeStyle(row.result);
                    const barColor = row.result === "PASS" ? "#10b981" : row.result === "FAIL" ? "#ef4444" : "#f59e0b";
                    const rowTimeWidth = slowestTime > 0 ? `${Math.max((row.responseTimeMs / slowestTime) * 100, 2)}%` : "0%";

                    return (
                        <tr key={row.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "16px 24px" }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 6, backgroundColor: methodStyle.bg, color: methodStyle.text, border: `1px solid ${methodStyle.border}` }}>
                            {row.endpoint.method}
                            </span>
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                            <div style={{ fontSize: 14, fontWeight: 500, color: "#111827", fontFamily: "monospace" }}>{row.endpoint.path}</div>
                            {row.errorMessage && <div style={{ fontSize: 12, color: "#dc2626", marginTop: 4 }}>{row.errorMessage}</div>}
                        </td>
                        <td style={{ padding: "16px 24px", fontSize: 14, fontWeight: 600, color: row.statusCode && row.statusCode >= 500 ? "#ef4444" : row.statusCode && row.statusCode >= 400 ? "#f59e0b" : "#111827" }}>
                            {row.statusCode || "ERR"}
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                            {row.responseTimeMs > 0 ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <span style={{ fontSize: 14, fontWeight: 500, color: "#374151", width: 48 }}>{row.responseTimeMs}ms</span>
                                <div style={{ flex: 1, height: 6, backgroundColor: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
                                <div style={{ width: rowTimeWidth, height: "100%", backgroundColor: barColor, borderRadius: 3, transition: "width 0.5s ease" }} />
                                </div>
                            </div>
                            ) : (
                            <span style={{ fontSize: 14, color: "#9ca3af" }}>—</span>
                            )}
                        </td>
                        <td style={{ padding: "16px 24px", fontSize: 13, color: row.consistencyStable ? "#4b5563" : "#dc2626", fontWeight: row.consistencyStable ? 500 : 600 }}>
                            {row.result === "FAIL" ? "✗ Failed" : row.consistencyStable ? "✓ Stable" : "⚠ Unstable"}
                        </td>
                        <td style={{ padding: "16px 24px", fontSize: 13, color: "#4b5563" }}>
                            {row.authResult === "PUBLIC" ? "— Public" : row.authResult}
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                            <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 6, backgroundColor: badgeStyle.bg, color: badgeStyle.text, border: `1px solid ${badgeStyle.border}` }}>
                            {row.result}
                            </span>
                        </td>
                        </tr>
                    );
                    })}
                </tbody>
                </table>
            </div>

            {/* ── 5. Forensic Footer ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
                
                {/* Dynamic Status Code Distribution */}
                <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24, display: "flex", alignItems: "center", gap: 32, boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" }}>
                <div style={{ position: "relative", width: 80, height: 80, borderRadius: "50%", background: `conic-gradient(#10b981 0% ${(count2xx/totalTests)*100}%, #f59e0b ${(count2xx/totalTests)*100}% ${((count2xx+count4xx)/totalTests)*100}%, #ef4444 ${((count2xx+count4xx)/totalTests)*100}% ${((count2xx+count4xx+count5xx)/totalTests)*100}%, #e5e7eb ${((count2xx+count4xx+count5xx)/totalTests)*100}% 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 60, height: 60, backgroundColor: "#ffffff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#111827" }}>
                    {totalTests}
                    </div>
                </div>
                <div>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 12px 0" }}>Status Distribution</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, fontSize: 13, color: "#4b5563", width: 140 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#10b981" }}/> 2xx Success</span>
                        <strong style={{ color: "#111827"}}>{count2xx}</strong>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, fontSize: 13, color: "#4b5563", width: 140 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#f59e0b" }}/> 4xx Error</span>
                        <strong style={{ color: "#111827"}}>{count4xx}</strong>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, fontSize: 13, color: "#4b5563", width: 140 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#ef4444" }}/> 5xx Error</span>
                        <strong style={{ color: "#111827"}}>{count5xx}</strong>
                    </div>
                    {count0 > 0 && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, fontSize: 13, color: "#4b5563", width: 140 }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#9ca3af" }}/> Network Fail</span>
                            <strong style={{ color: "#111827"}}>{count0}</strong>
                        </div>
                    )}
                    </div>
                </div>
                </div>

                {/* Dynamic 10-Ping Flapping Box */}
                {unstableTarget && (
                    <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", justifyContent: "center", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>Repeated request handling (10-Ping Burst)</h4>
                        {unstableTarget.consistencyStable && unstableTarget.result === "PASS" ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#16a34a", fontSize: 12, fontWeight: 600, padding: "4px 10px", backgroundColor: "#f0fdf4", borderRadius: 6, border: "1px solid #bbf7d0" }}>
                                <CheckCircle2 size={14} /> Stabilized
                            </div>
                        ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#dc2626", fontSize: 12, fontWeight: 600, padding: "4px 10px", backgroundColor: "#fef2f2", borderRadius: 6, border: "1px solid #fecaca" }}>
                                <AlertTriangle size={14} /> Flapping Detected
                            </div>
                        )}
                    </div>
                    
                    <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 16px 0" }}><code style={{ backgroundColor: "#f3f4f6", padding: "2px 6px", borderRadius: 4, color: "#111827" }}>{unstableTarget.endpoint.path}</code> fired 10 times consecutively:</p>
                    
                    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                        {targetPings.length > 0 ? targetPings.map((time: number, i: number) => {
                            const isFail = time === 0;
                            const isSlow = time > unstableTarget.responseTimeMs * 1.5; 
                            const boxColor = isFail ? "#fef2f2" : isSlow ? "#fffbeb" : "#f0fdf4";
                            const borderColor = isFail ? "#fecaca" : isSlow ? "#fde68a" : "#bbf7d0";
                            const textColor = isFail ? "#dc2626" : isSlow ? "#d97706" : "#16a34a";

                            return (
                                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, minWidth: 44 }}>
                                    <div style={{ width: "100%", height: 40, borderRadius: 8, backgroundColor: boxColor, border: `1px solid ${borderColor}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: textColor }}>
                                        {isFail ? "ERR" : `${time}ms`}
                                    </div>
                                    <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>#{i+1}</span>
                                </div>
                            )
                        }) : (
                            <div style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>No ping data recorded.</div>
                        )}
                    </div>
                    </div>
                )}
            </div>

          </div>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}

// ✨ THE FIX: We wrap the entire content component in a Suspense boundary
export default function TestRunsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TestRunsContent />
    </Suspense>
  );
}