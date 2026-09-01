"use client";

import { Settings, PlayCircle, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import HealthCheckDrawer from "./HealthCheckDrawer";
import { useProjects, Endpoint } from "@/context/ProjectContext";
import { useNavigation } from "@/context/NavigationContext"; // ✨ Import Global Lock
import { api, ApiResponse } from "@/lib/api";

interface ProjectGridCardProps {
  projectId: string;
  endpoints: Endpoint[];
  title?: string;
}

export default function ProjectGridCard({ projectId, endpoints, title }: ProjectGridCardProps) {
  const { removeProject } = useProjects();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // UX States
  const [isDeleting, setIsDeleting] = useState(false);
  
  // ✨ Connect to Global Navigation Lock
  const { isNavigating, navigatingTo: globalNavTarget, startNavigation } = useNavigation();
  
  // Data State
  const [testRuns, setTestRuns] = useState<any[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState(true);

  const projectName = title || "Project Setup";
  const projectSlug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const totalApis = endpoints.length;
  const isEmpty = totalApis === 0;

  // Link Definitions for Global Tracker
  const manageHref = `/${projectSlug}/manage-apis`;
  const testHref = `/${projectSlug}/test-runs`;
  const isManaging = globalNavTarget === manageHref;
  const isTesting = globalNavTarget === testHref;

  useEffect(() => {
    const fetchRuns = async () => {
      try {
        const json = await api.get<ApiResponse<unknown[]>>(`/projects/${projectId}/test-runs`);
        if (json.success) {
          setTestRuns(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch runs for project", projectId);
      } finally {
        setIsLoadingRuns(false);
      }
    };

    fetchRuns();
  }, [projectId]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await removeProject(projectId);
    } catch (error) {
      console.error("Failed to delete project", error);
      setIsDeleting(false); 
    }
  };

  const latestRun = testRuns.length > 0 ? testRuns[0] : null;
  const avgHealth = latestRun ? Math.round(latestRun.healthScore) : null;
  const latency = latestRun ? Math.round(latestRun.avgResponseTime) : null;
  const successRate = latestRun && latestRun.totalTests > 0 
    ? Math.round((latestRun.passed / latestRun.totalTests) * 100) 
    : null;

  const statusColor = avgHealth === null ? "#d1d5db" : avgHealth >= 90 ? "#16a34a" : avgHealth >= 70 ? "#d97706" : "#dc2626";

  const recentRuns = [...testRuns].slice(0, 10).reverse();
  const historyBlocks = Array.from({ length: 10 }).map((_, i) => {
    const runIndex = i - (10 - recentRuns.length);
    if (runIndex >= 0) return recentRuns[runIndex];
    return null; 
  });

  const endpointSquares = historyBlocks.map((run, i) => {
    if (!run) return { id: i, color: "#f3f4f6", tooltip: "No test data" }; 
    
    let color = "#16a34a"; 
    if (run.healthScore < 100 && run.healthScore >= 70) {
      color = "#f59e0b"; 
    } else if (run.healthScore < 70 || run.status === "FAILED") {
      color = "#ef4444"; 
    }

    const dateStr = new Date(run.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return { 
      id: run.id || i, 
      color, 
      tooltip: `${dateStr} — ${Math.round(run.healthScore)}% Health` 
    };
  });

  return (
    <>
      <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" }}>
        <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: isEmpty ? "#9ca3af" : "#111827", letterSpacing: "-0.01em" }}>
                {projectName}
              </h3>
              <button
                onClick={() => setIsDrawerOpen(true)}
                disabled={isEmpty || isNavigating} // ✨ Disable if locked
                style={{ alignSelf: "flex-start", backgroundColor: "transparent", border: `1px solid ${isEmpty ? "#e5e7eb" : "#bfdbfe"}`, color: isEmpty ? "#9ca3af" : "#2563eb", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: isEmpty || isNavigating ? "not-allowed" : "pointer", transition: "all 0.2s ease", opacity: isNavigating ? 0.5 : 1 }}
                onMouseEnter={(e) => { if(!isEmpty && !isNavigating) e.currentTarget.style.backgroundColor = "#eff6ff"; }}
                onMouseLeave={(e) => { if(!isEmpty && !isNavigating) e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                Check health
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: statusColor }}>
                {avgHealth === null ? "--%" : `${avgHealth}%`}
              </span>
              <button 
                onClick={handleDelete}
                disabled={isDeleting || isNavigating} // ✨ Disable if locked
                title="Delete Project"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 6, color: isDeleting ? "#9ca3af" : "#ef4444", backgroundColor: isDeleting ? "#f3f4f6" : "#fef2f2", border: `1px solid ${isDeleting ? "#e5e7eb" : "#fecaca"}`, cursor: isDeleting || isNavigating ? "not-allowed" : "pointer", transition: "all 0.2s", opacity: isNavigating ? 0.5 : 1 }}
                onMouseEnter={(e) => { if(!isDeleting && !isNavigating){ e.currentTarget.style.backgroundColor = "#fee2e2"; e.currentTarget.style.borderColor = "#fca5a5"; } }}
                onMouseLeave={(e) => { if(!isDeleting && !isNavigating){ e.currentTarget.style.backgroundColor = "#fef2f2"; e.currentTarget.style.borderColor = "#fecaca"; } }}
              >
                {isDeleting ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={14} />}
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: "0.05em", marginBottom: 6 }}>LATENCY</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: latency === null ? "#9ca3af" : "#111827" }}>
                {latency === null ? "--" : latency}
                <span style={{ fontSize: 14, color: "#6b7280", fontWeight: 500 }}>{latency === null ? "" : "ms"}</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: "0.05em", marginBottom: 6 }}>SUCCESS</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: successRate === null ? "#9ca3af" : "#111827" }}>
                {successRate === null ? "--" : successRate}
                <span style={{ fontSize: 14, color: "#6b7280", fontWeight: 500 }}>{successRate === null ? "" : "%"}</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: "0.05em", marginBottom: 6 }}>ENDPOINTS</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: isEmpty ? "#9ca3af" : "#111827" }}>{totalApis}</div>
            </div>
          </div>

          <div style={{ marginTop: "auto" }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#6b7280", marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
              <span>Recent Test Runs (Last 10)</span>
              <span style={{ color: avgHealth !== null && avgHealth < 70 ? "#dc2626" : "#6b7280" }}>
                {testRuns.length === 0 ? "Awaiting Test" : avgHealth === 100 ? "Operational" : "Needs Attention"}
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "nowrap", gap: 6 }}>
              {endpointSquares.map((sq, index) => (
                <div key={index} title={sq.tooltip} style={{ flex: 1, height: 16, backgroundColor: sq.color, borderRadius: 3, cursor: "crosshair", opacity: 0.9, transition: "opacity 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.9")} />
              ))}
            </div>
          </div>
        </div>

        
        <div style={{ display: "flex", backgroundColor: "#f9fafb", borderTop: "1px solid #e5e7eb" }}>
          <Link 
            href={manageHref} 
            onClick={(e) => {
              // ✨ If ANY button in the app was clicked, block further clicks
              if (isNavigating) {
                e.preventDefault();
                return;
              }
              startNavigation(manageHref);
            }}
            style={{ 
              flex: 1, padding: "14px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, 
              color: isEmpty ? "#2563eb" : "#6b7280", fontSize: 13, fontWeight: isEmpty ? 600 : 500, textDecoration: "none", borderRight: "1px solid #e5e7eb", transition: "all 0.2s",
              pointerEvents: isNavigating ? "none" : "auto", 
              opacity: isNavigating && !isManaging ? 0.4 : 1 // ✨ Dim if locked and not the active spinner
            }} 
            onMouseEnter={(e) => { if(!isNavigating) { e.currentTarget.style.color = "#2563eb"; e.currentTarget.style.backgroundColor = "#eff6ff"; } }} 
            onMouseLeave={(e) => { if(!isNavigating) { e.currentTarget.style.color = isEmpty ? "#2563eb" : "#6b7280"; e.currentTarget.style.backgroundColor = "transparent"; } }}
          >
            {isManaging ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Settings size={16} />} 
            Manage APIs
          </Link>

          <Link 
            href={testHref} 
            onClick={(e) => {
              if (isEmpty || isNavigating) {
                e.preventDefault();
                return;
              }
              startNavigation(testHref);
            }}
            style={{ 
              flex: 1, padding: "14px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, 
              color: "#6b7280", fontSize: 13, fontWeight: 500, textDecoration: "none", transition: "all 0.2s",
              pointerEvents: (isEmpty || isNavigating) ? "none" : "auto", 
              opacity: isEmpty ? 0.4 : (isNavigating && !isTesting ? 0.4 : 1) // ✨ Dim if locked
            }} 
            onMouseEnter={(e) => { if(!isEmpty && !isNavigating) { e.currentTarget.style.color = "#2563eb"; e.currentTarget.style.backgroundColor = "#eff6ff"; } }} 
            onMouseLeave={(e) => { if(!isEmpty && !isNavigating) { e.currentTarget.style.color = "#6b7280"; e.currentTarget.style.backgroundColor = "transparent"; } }}
          >
            {isTesting ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <PlayCircle size={16} />} 
            Test Runs
          </Link>
        </div>
      </div>

      <HealthCheckDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        projectName={projectName} 
        endpoints={endpoints} 
      />
      
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}} />
    </>
  );
}