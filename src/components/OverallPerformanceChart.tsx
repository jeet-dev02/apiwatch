"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Activity, AlertTriangle, Clock, Zap } from "lucide-react";

interface TestResult {
    id: string;
    endpointId: string;
    // Nullable in the schema — a request that never completed has no timing.
    responseTimeMs: number | null;
    result: "PASS" | "WARN" | "FAIL";
    consistencyStable: boolean;
    endpoint?: { method: string; path: string };
}

interface TestRun {
    id: string;
    startedAt: string;
    totalTests: number;
    passed: number;
    healthScore: number;
    avgResponseTime: number;
    results?: TestResult[];
}

interface OverallPerformanceChartProps {
    historicalRuns?: TestRun[]; // Made optional for safety
    latestRun?: TestRun;        // Made optional for safety
}

export default function OverallPerformanceChart({ historicalRuns = [], latestRun }: OverallPerformanceChartProps) {
    // 1. Safe fallback: If historicalRuns is undefined or not an array, use []
    const safeHistorical = Array.isArray(historicalRuns) ? historicalRuns : [];
    
    // 2. Format the historical data for Recharts
    const chartData = [...safeHistorical].reverse().map((run) => {
        const date = new Date(run.startedAt);
        return {
            time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            score: Math.round(run.healthScore || 0),
        };
    });

    // Fallback if latestRun is missing
    if (!latestRun) {
        return <div style={{ padding: 24, textAlign: 'center', color: '#6b7280' }}>Loading performance data...</div>;
    }

    // 3. Calculate your Vision Metrics from the latest run
    const successRate = latestRun.totalTests > 0 
        ? Math.round((latestRun.passed / latestRun.totalTests) * 100) 
        : 0;

    // Find the absolute slowest API in the burst safely
    const slowestResult = latestRun.results && latestRun.results.length > 0
        ? latestRun.results.reduce((prev, current) =>
            (prev.responseTimeMs ?? 0) > (current.responseTimeMs ?? 0) ? prev : current
          )
        : null;

    // Count how many APIs choked under the 10-ping pressure
    const unstableCount = latestRun.results?.filter(r => !r.consistencyStable && r.result !== "FAIL").length || 0;

    return (
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            
            <div style={{ display: "flex", flexWrap: "wrap", gap: 32 }}>
                
                {/* ── Left Side: Historical Health Trend ── */}
                <div style={{ flex: "1 1 400px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                        <Activity size={20} color="#2563eb" />
                        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>
                            Project Health Trend
                        </h2>
                    </div>
                    
                    {chartData.length > 1 ? (
                        <div style={{ height: 220, width: "100%" }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9ca3af" }} dy={10} />
                                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9ca3af" }} tickFormatter={(value) => `${value}%`} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                                        formatter={(value) => [`${value}%`, "Health Score"]}
                                    />
                                    <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: "#2563eb", strokeWidth: 0 }} activeDot={{ r: 6, fill: "#2563eb", stroke: "#ffffff", strokeWidth: 2 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div style={{ height: 220, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb", borderRadius: 8, color: "#6b7280", fontSize: 14 }}>
                            Run the suite one more time to see historical trends.
                        </div>
                    )}
                </div>

                {/* ── Right Side: Vision Metrics Dashboard ── */}
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 16, minWidth: 280, borderLeft: "1px solid #e5e7eb", paddingLeft: 32 }}>
                    
                    {/* Metric 1: Success Rate */}
                    <div>
                        <div style={{ fontSize: 11, textTransform: "uppercase", fontWeight: 700, color: "#6b7280", display: "flex", alignItems: "center", gap: 6 }}>
                            <Zap size={14} /> Overall Success Rate
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: successRate >= 90 ? "#16a34a" : successRate >= 70 ? "#d97706" : "#dc2626", marginTop: 4 }}>
                            {successRate}%
                        </div>
                        <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
                            {latestRun.passed} of {latestRun.totalTests} APIs passed perfectly.
                        </div>
                    </div>

                    {/* Metric 2: Average Response */}
                    <div>
                        <div style={{ fontSize: 11, textTransform: "uppercase", fontWeight: 700, color: "#6b7280", display: "flex", alignItems: "center", gap: 6 }}>
                            <Clock size={14} /> Suite Average Speed
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: "#111827", marginTop: 4 }}>
                            {Math.round(latestRun.avgResponseTime)} <span style={{fontSize: 16, color: "#9ca3af"}}>ms</span>
                        </div>
                    </div>

                    {/* Metric 3: The Bottleneck (Slowest API) */}
                    {slowestResult && (slowestResult.responseTimeMs ?? 0) > 0 && (
                        <div style={{ padding: "12px", backgroundColor: "#fffbeb", borderRadius: 8, border: "1px solid #fde68a" }}>
                            <div style={{ fontSize: 11, textTransform: "uppercase", fontWeight: 700, color: "#d97706", marginBottom: 4 }}>
                                System Bottleneck
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#92400e", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {slowestResult.endpoint?.method} {slowestResult.endpoint?.path}
                            </div>
                            <div style={{ fontSize: 13, color: "#b45309", marginTop: 2 }}>
                                Took <strong>{slowestResult.responseTimeMs}ms</strong> to respond.
                            </div>
                        </div>
                    )}

                    {/* Metric 4: Stability Warning */}
                    {unstableCount > 0 && (
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", backgroundColor: "#fef2f2", borderRadius: 8, border: "1px solid #fecaca" }}>
                            <AlertTriangle size={16} color="#dc2626" style={{ marginTop: 2 }} />
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: "#991b1b" }}>Repeated Hit Warning</div>
                                <div style={{ fontSize: 12, color: "#dc2626", marginTop: 2 }}>
                                    {unstableCount} API(s) showed massive speed variance during the 10-ping burst.
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}