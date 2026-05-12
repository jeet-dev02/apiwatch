"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlayCircle, CalendarClock, PlusCircle, ChevronDown, Loader2 } from "lucide-react";
import { useProjects } from "@/context/ProjectContext";

interface QuickActionsPanelProps {
  onAddApi?: () => void;
}

export default function QuickActionsPanel({ onAddApi }: QuickActionsPanelProps) {
    const router = useRouter();
    const { projects } = useProjects();

    const [showDropdown, setShowDropdown] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown if the user clicks anywhere outside of it
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Handles the project selection and triggers the routing delay
    const handleRunTest = (project: any) => {
        setShowDropdown(false);
        setIsInitializing(true);

        setTimeout(() => {
            const slug = project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            router.push(`/${slug}/test-runs`);
        }, 1500); // 1.5 second initialization delay
    };

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
                {/* Card 1: Run Test Suite (Now with Dropdown Logic) */}
                <div style={{ position: "relative" }} ref={dropdownRef}>
                    <button
                        disabled={isInitializing}
                        onClick={() => !isInitializing && setShowDropdown(!showDropdown)}
                        style={{
                            width: "100%",
                            backgroundColor: "#ffffff",
                            border: `1px solid ${showDropdown ? "#bfdbfe" : "#e5e7eb"}`,
                            borderRadius: 12,
                            padding: 16,
                            textAlign: "left",
                            display: "flex",
                            alignItems: "center",
                            gap: 16,
                            cursor: isInitializing ? "wait" : "pointer",
                            transition: "all 0.2s",
                            boxShadow: showDropdown ? "0 4px 6px -1px rgba(37, 99, 235, 0.1)" : "none",
                        }}
                        onMouseEnter={(e) => {
                            if (!isInitializing && !showDropdown) {
                                e.currentTarget.style.backgroundColor = "#eff6ff";
                                e.currentTarget.style.borderColor = "#bfdbfe";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isInitializing && !showDropdown) {
                                e.currentTarget.style.backgroundColor = "#ffffff";
                                e.currentTarget.style.borderColor = "#e5e7eb";
                            }
                        }}
                    >
                        {isInitializing ? (
                            <Loader2 color="#2563eb" size={24} style={{ flexShrink: 0, animation: "spin 1s linear infinite" }} />
                        ) : (
                            <PlayCircle color="#2563eb" size={24} style={{ flexShrink: 0 }} />
                        )}
                        
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
                                {isInitializing ? "Initializing suite..." : "Run Test Suite"}
                            </div>
                            <div style={{ fontSize: 12, color: "#6b7280" }}>
                                {isInitializing ? "Please wait" : "Select a project to test"}
                            </div>
                        </div>

                        {!isInitializing && (
                            <ChevronDown 
                                size={18} 
                                color="#9ca3af" 
                                style={{ transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} 
                            />
                        )}
                    </button>

                    {/* The Project Selection Dropdown */}
                    {showDropdown && (
                        <div 
                            style={{ 
                                position: "absolute", 
                                top: "100%", 
                                left: 0, 
                                width: "100%", 
                                backgroundColor: "#ffffff", 
                                border: "1px solid #e5e7eb", 
                                borderRadius: 8, 
                                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", 
                                zIndex: 50, 
                                marginTop: 8, 
                                maxHeight: 200, 
                                overflowY: "auto", 
                                display: "flex", 
                                flexDirection: "column",
                                animation: "fadeIn 0.2s ease"
                            }}
                        >
                            {projects.length === 0 ? (
                                <div style={{ padding: "16px", fontSize: 13, color: "#6b7280", textAlign: "center" }}>
                                    No projects available. Add an API first!
                                </div>
                            ) : (
                                projects.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => handleRunTest(p)}
                                        style={{ 
                                            padding: "12px 16px", 
                                            textAlign: "left", 
                                            fontSize: 13, 
                                            fontWeight: 600, 
                                            color: "#374151", 
                                            backgroundColor: "transparent", 
                                            border: "none", 
                                            borderBottom: "1px solid #f3f4f6", 
                                            cursor: "pointer", 
                                            transition: "background 0.2s" 
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                    >
                                        {p.title}
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Card 2: Schedule Test */}
                <button
                    onClick={() => alert("Scheduler feature coming soon!")}
                    style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        padding: 16,
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        cursor: "pointer",
                        transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f9fafb"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#ffffff"; }}
                >
                    <CalendarClock color="#2563eb" size={24} style={{ flexShrink: 0 }} />
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Schedule Test</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>Automate testing</div>
                    </div>
                </button>

                {/* Card 3: Add API */}
                <button
                    onClick={onAddApi}
                    style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        padding: 16,
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        cursor: "pointer",
                        transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#eff6ff";
                        e.currentTarget.style.borderColor = "#bfdbfe";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#ffffff";
                        e.currentTarget.style.borderColor = "#e5e7eb";
                    }}
                >
                    <PlusCircle color="#2563eb" size={24} style={{ flexShrink: 0 }} />
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Add API</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>Configure new API</div>
                    </div>
                </button>
            </div>
            
            {/* Inline styles for the loading spinner and dropdown animation */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
            `}} />
        </div>
    );
}