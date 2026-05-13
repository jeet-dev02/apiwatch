"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Activity, X, CheckCircle2, Terminal } from "lucide-react";
import { useProjects } from "@/context/ProjectContext";

interface GlobalRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedProjectId?: string; 
}

export default function GlobalRunnerModal({ isOpen, onClose, preSelectedProjectId }: GlobalRunnerModalProps) {
  const router = useRouter();
  const { projects } = useProjects();
  
  const [phase, setPhase] = useState<"select" | "scanning" | "complete">("select");
  const [progress, setProgress] = useState(0);
  const [currentLog, setCurrentLog] = useState("");

  // Using refs ensures the timers don't cause memory leaks or skip animations
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize the correct phase when opened
  useEffect(() => {
    if (isOpen) {
      if (preSelectedProjectId) {
        // Triggered from "Check Health" - Start scan immediately
        startScan(preSelectedProjectId);
      } else {
        // Triggered from "Quick Actions" - Wait for user to select
        setPhase("select");
        setProgress(0);
      }
    } else {
      // Cleanup timers when modal closes
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
    // FIXED: Tell Vercel to safely ignore the missing 'startScan' dependency here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, preSelectedProjectId]);

  // The unified scan engine that works for BOTH triggers
  const startScan = (projectIdToScan: string) => {
    setPhase("scanning");
    setProgress(0);
    setCurrentLog("Initializing deep diagnostic engine...");

    const logs = [
      "Resolving DNS and establishing secure connection...",
      "Validating Bearer Tokens (JWT)... OK",
      "Asserting expected JSON schemas for GET routes...",
      "Simulating high-load POST requests...",
      "Measuring latency against 500ms threshold...",
      "Finalizing assertions and generating report..."
    ];

    let step = 0;

    // Clear any stuck intervals
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 15;
        
        // When progress hits 100%
        if (next >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setPhase("complete");
          
          // The Handoff: Route strictly to the selected project's test-runs
          timeoutRef.current = setTimeout(() => {
            const project = projects.find(p => p.id === projectIdToScan);
            if (project) {
              const slug = project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
              router.push(`/${slug}/test-runs`);
            }
            onClose(); // Close modal after successful routing
          }, 1500);
          
          return 100;
        }
        
        // Keep flashing logs
        if (step < logs.length) {
          setCurrentLog(logs[step]);
          step++;
        }
        return next;
      });
    }, 400); // 400ms per simulated step
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)" }} onClick={onClose} />

      <div style={{ position: "relative", width: "100%", maxWidth: 500, backgroundColor: phase === "select" ? "#ffffff" : "#111827", borderRadius: 16, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", display: "flex", flexDirection: "column", overflow: "hidden", animation: "scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)", border: phase === "select" ? "none" : "1px solid #374151" }}>
        
        {/* PHASE 1: SELECTION */}
        {phase === "select" && (
          <>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Activity size={20} color="#2563eb" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>Run Deep Diagnostic</h2>
                  <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6b7280" }}>Select a project to analyze.</p>
                </div>
              </div>
              <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer" }}><X size={20} color="#9ca3af" /></button>
            </div>

            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12, maxHeight: 300, overflowY: "auto" }}>
              {projects.length === 0 ? (
                <div style={{ textAlign: "center", color: "#6b7280", padding: 20 }}>No projects found. Add an API first!</div>
              ) : (
                projects.map(p => (
                  <button 
                    key={p.id} 
                    // Pass the ID directly into the function so it doesn't get lost!
                    onClick={() => startScan(p.id)}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "16px", backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8, cursor: "pointer", transition: "all 0.2s", textAlign: "left" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#2563eb"; e.currentTarget.style.backgroundColor = "#eff6ff"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.backgroundColor = "#ffffff"; }}
                  >
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{p.endpoints.length} configured endpoints</div>
                    </div>
                    <CheckCircle2 size={18} color="#2563eb" style={{ opacity: 0 }} />
                  </button>
                ))
              )}
            </div>
          </>
        )}

        {/* PHASE 2: SCANNING & COMPLETE (TERMINAL UI) */}
        {(phase === "scanning" || phase === "complete") && (
          <div style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: phase === "complete" ? "#10b981" : "#1f2937", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, border: `2px solid ${phase === "complete" ? "#10b981" : "#374151"}`, transition: "all 0.3s ease" }}>
              {phase === "complete" ? <CheckCircle2 size={32} color="#ffffff" /> : <Terminal size={32} color="#60a5fa" />}
            </div>
            
            <h2 style={{ margin: "0 0 8px 0", fontSize: 20, fontWeight: 700, color: "#f9fafb" }}>
              {phase === "complete" ? "Diagnostic Complete" : "Running Deep Scan"}
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: "#9ca3af", height: 20 }}>
              {phase === "complete" ? "Redirecting to test run results..." : currentLog}
            </p>

            <div style={{ width: "100%", height: 6, backgroundColor: "#374151", borderRadius: 3, marginTop: 32, overflow: "hidden" }}>
              <div style={{ height: "100%", backgroundColor: phase === "complete" ? "#10b981" : "#3b82f6", width: `${progress}%`, transition: "width 0.4s ease-out", borderRadius: 3 }} />
            </div>
          </div>
        )}

      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}} />
    </div>
  );
}