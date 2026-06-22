"use client";

import { X, Play, Activity, ServerCrash } from "lucide-react";
import { Endpoint, HttpMethod, useProjects } from "@/context/ProjectContext";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface HealthCheckDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  endpoints: Endpoint[];
}

export default function HealthCheckDrawer({ isOpen, onClose, projectName, endpoints }: HealthCheckDrawerProps) {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const projectSlug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const { projects, runAllTests } = useProjects();

  if (!isOpen) return null;

  const getMethodColor = (method: HttpMethod) => {
    switch (method) {
      case "GET": return { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" };
      case "POST": return { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" };
      case "DELETE": return { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" };
      case "PUT": return { bg: "#fffbeb", text: "#d97706", border: "#fde68a" };
      default: return { bg: "#f3f4f6", text: "#4b5563", border: "#d1d5db" };
    }
  };

  const handleRunSuite = async () => {
    const currentProject = projects.find(p => p.title === projectName);
    if (!currentProject) return;

    setIsRunning(true);
    const testRunId = await runAllTests(currentProject.id);
    setIsRunning(false);

    if (testRunId) {
      onClose();
      // ✨ THE FIX: Append ?activeRun=true to the URL
      router.push(`/${projectSlug}/test-runs?activeRun=true`); 
    }
  };

  return (
    <>
      {/* Overlay */}
      <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0, 0, 0, 0.4)", backdropFilter: "blur(4px)", zIndex: 100 }} onClick={onClose} />

      {/* Drawer Container */}
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "100%", maxWidth: 440, backgroundColor: "#ffffff", boxShadow: "-4px 0 24px rgba(0, 0, 0, 0.1)", zIndex: 101, display: "flex", flexDirection: "column", transform: isOpen ? "translateX(0)" : "translateX(100%)", transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)", animation: "slideIn 0.3s forwards" }}>

        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>Health Check</h2>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6b7280" }}>{projectName}</p>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#9ca3af", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f3f4f6"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body List */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {endpoints.length === 0 ? (
            <div style={{ textAlign: "center", marginTop: 40 }}>
              <div style={{ width: 48, height: 48, backgroundColor: "#f3f4f6", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <ServerCrash size={24} color="#9ca3af" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: "0 0 8px 0" }}>No endpoints configured</h3>
              <p style={{ fontSize: 14, color: "#6b7280", margin: 0, lineHeight: 1.5 }}>Please configure APIs via the Manage APIs page before running a suite.</p>
            </div>
          ) : (
            <div>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 16px 0" }}>
                Queued for Testing ({endpoints.length})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {endpoints.map((ep) => {
                  const colors = getMethodColor(ep.method);
                  return (
                    <div key={ep.id} style={{ display: "flex", alignItems: "center", padding: "12px", backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, marginRight: 12, width: 48, textAlign: "center" }}>
                        {ep.method}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#374151", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}>
                        {ep.path}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        {endpoints.length > 0 && (
          <div style={{ padding: "24px", borderTop: "1px solid #e5e7eb", backgroundColor: "#fafafa" }}>
            <button
              onClick={handleRunSuite}
              disabled={isRunning}
              style={{ width: "100%", padding: "12px", fontSize: 14, fontWeight: 600, color: "#ffffff", backgroundColor: isRunning ? "#93c5fd" : "#2563eb", border: "none", borderRadius: 8, cursor: isRunning ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}
              onMouseEnter={(e) => { if (!isRunning) e.currentTarget.style.backgroundColor = "#1d4ed8"; }}
              onMouseLeave={(e) => { if (!isRunning) e.currentTarget.style.backgroundColor = "#2563eb"; }}
            >
              {isRunning ? (
                <><Activity size={16} style={{ animation: "spin 1s linear infinite" }} /> Initializing Suite...</>
              ) : (
                <><Play size={16} /> Run Full Test Suite</>
              )}
            </button>
          </div>
        )}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
    </>
  );
}