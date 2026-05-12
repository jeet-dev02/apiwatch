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
import { PerformancePoint, Stats } from "@/data/mock-data";

interface OverallPerformanceChartProps {
    data: PerformancePoint[];
    stats: Stats;
}

export default function OverallPerformanceChart({
    data,
    stats,
}: OverallPerformanceChartProps) {
    return (
        <div
            style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 20,
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 24,
                }}
            >
                {/* Left side (Chart) */}
                <div style={{ flex: "1 1 300px" }}>
                    <h2
                        style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: "#111827",
                            marginBottom: 16,
                            marginTop: 0,
                        }}
                    >
                        Overall Performance
                    </h2>
                    <div style={{ height: 200, width: "100%" }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <CartesianGrid vertical={false} stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: "#6b7280" }}
                                    dy={10}
                                />
                                <YAxis
                                    domain={[0, 100]}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: "#6b7280" }}
                                    dx={-10}
                                    tickFormatter={(value) => `${value}%`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: 8,
                                        border: "1px solid #e5e7eb",
                                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#2563eb"
                                    strokeWidth={2}
                                    dot={{ r: 4, fill: "#2563eb", strokeWidth: 0 }}
                                    activeDot={{ r: 6, fill: "#2563eb", stroke: "#ffffff", strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right side (Summary Stats) */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        gap: 24,
                        minWidth: 150,
                        borderLeft: "1px solid #e5e7eb",
                        paddingLeft: 24,
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontSize: 11,
                                textTransform: "uppercase",
                                fontWeight: 700,
                                color: "#6b7280",
                            }}
                        >
                            SUCCESS RATE
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: "#111827", marginTop: 4 }}>
                            {stats.successRate}%
                        </div>
                        <div style={{ fontSize: 12, color: "#16a34a", marginTop: 4 }}>
                            ↑ 1.2% vs yesterday
                        </div>
                    </div>

                    <div>
                        <div
                            style={{
                                fontSize: 11,
                                textTransform: "uppercase",
                                fontWeight: 700,
                                color: "#6b7280",
                            }}
                        >
                            AVG RESPONSE TIME
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: "#111827", marginTop: 4 }}>
                            {stats.avgResponseTime} ms
                        </div>
                        <div style={{ fontSize: 12, color: "#16a34a", marginTop: 4 }}>
                            ↓ 18ms vs yesterday
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}