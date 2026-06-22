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

interface GlobalPerformanceChartProps {
    data: { date: string; value: number }[];
    stats: {
        successRate: number;
        avgResponseTime: number;
    };
}

export default function GlobalPerformanceChart({ data, stats }: GlobalPerformanceChartProps) {
    const safeData = Array.isArray(data) && data.length > 0 ? data : [];

    return (
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
                
                {/* Left side (Chart) */}
                <div style={{ flex: "1 1 300px" }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 16, marginTop: 0 }}>
                        System-Wide Health Trend (Last 7 Days)
                    </h2>
                    
                    {safeData.length > 0 ? (
                        <div style={{ height: 200, width: "100%" }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={safeData}>
                                    <CartesianGrid vertical={false} stroke="#e5e7eb" strokeDasharray="3 3" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} dy={10} />
                                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} dx={-10} tickFormatter={(value) => `${value}%`} />
                                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }} />
                                    <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: "#2563eb", strokeWidth: 0 }} activeDot={{ r: 6, fill: "#2563eb", stroke: "#ffffff", strokeWidth: 2 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div style={{ height: 200, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb", borderRadius: 8, color: "#6b7280", fontSize: 14 }}>
                            Awaiting enough data to generate a trend.
                        </div>
                    )}
                </div>

                {/* Right side (Summary Stats) */}
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 24, minWidth: 150, borderLeft: "1px solid #e5e7eb", paddingLeft: 24 }}>
                    <div>
                        <div style={{ fontSize: 11, textTransform: "uppercase", fontWeight: 700, color: "#6b7280" }}>
                            GLOBAL SUCCESS RATE
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: stats.successRate >= 90 ? "#16a34a" : "#dc2626", marginTop: 4 }}>
                            {stats.successRate}%
                        </div>
                    </div>

                    <div>
                        <div style={{ fontSize: 11, textTransform: "uppercase", fontWeight: 700, color: "#6b7280" }}>
                            GLOBAL AVG RESPONSE
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: "#111827", marginTop: 4 }}>
                            {stats.avgResponseTime} <span style={{fontSize: 16, color: "#9ca3af"}}>ms</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}