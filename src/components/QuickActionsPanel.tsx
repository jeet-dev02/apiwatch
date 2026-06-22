"use client";

import { PlayCircle, CalendarClock } from "lucide-react";

export default function QuickActionsPanel() {
    return (
        <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 16, marginTop: 0 }}>
                Quick Actions
            </h2>
            <div
                style={{
                    display: "grid",
                    gap: 16,
                    gridTemplateColumns: "1fr",
                }}
            >
                {/* Card 1: Run Test Suite (Disabled / Coming Soon) */}
                <button
                    disabled={true}
                    style={{
                        backgroundColor: "#f9fafb",
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        padding: 16,
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        cursor: "not-allowed",
                        opacity: 0.6, 
                        transition: "all 0.2s",
                    }}
                >
                    <PlayCircle color="#9ca3af" size={24} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#4b5563" }}>Run Test Suite</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>Select a project to test</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, backgroundColor: "#e5e7eb", color: "#4b5563", padding: "2px 8px", borderRadius: 12 }}>
                        COMING SOON
                    </span>
                </button>

                {/* Card 2: Schedule Test (Disabled / Coming Soon) */}
                <button
                    disabled={true}
                    style={{
                        backgroundColor: "#f9fafb",
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        padding: 16,
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        cursor: "not-allowed",
                        opacity: 0.6, 
                        transition: "all 0.2s",
                    }}
                >
                    <CalendarClock color="#9ca3af" size={24} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#4b5563" }}>Schedule Test</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>Automate testing</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, backgroundColor: "#e5e7eb", color: "#4b5563", padding: "2px 8px", borderRadius: 12 }}>
                        COMING SOON
                    </span>
                </button>

            </div>
        </div>
    );
}