"use client";

import { Settings, PlayCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import HealthCheckDrawer from "./HealthCheckDrawer";
import { useProjects, Endpoint } from "@/context/ProjectContext";

interface ProjectGridCardProps {
  projectId: string;
  endpoints: Endpoint[];
  title?: string;
}

export default function ProjectGridCard({ projectId, endpoints, title }: ProjectGridCardProps) {
  const { removeProject } = useProjects();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const projectName = title || "Project Setup";
  const projectSlug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const isEmpty = endpoints.length === 0;
  
  // REAL-TIME API COUNT!
  const totalApis = endpoints.length; 
  
  // Default to 100% health if configured, null if empty
  const avgHealth = isEmpty ? null : 100; 
  
  const status = isEmpty ? "empty" : "healthy";
  const statusColor = status === "empty" ? "#d1d5db" : "#16a34a";

  const endpointSquares = isEmpty 
    ? Array.from({ length: 15 }).map((_, i) => ({ id: i, color: "#f3f4f6", tooltip: "Pending setup" }))
    : Array.from({ length: totalApis }).map((_, i) => {
        // Renders one green square per actual endpoint
        return { id: i, color: "#16a34a", tooltip: `Endpoint ${i + 1}: 200 OK` };
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
                disabled={isEmpty}
                style={{ alignSelf: "flex-start", backgroundColor: "transparent", border: `1px solid ${isEmpty ? "#e5e7eb" : "#bfdbfe"}`, color: isEmpty ? "#9ca3af" : "#2563eb", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: isEmpty ? "not-allowed" : "pointer", transition: "all 0.2s ease" }}
                onMouseEnter={(e) => { if(!isEmpty) e.currentTarget.style.backgroundColor = "#eff6ff"; }}
                onMouseLeave={(e) => { if(!isEmpty) e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                Check health
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: statusColor }}>{isEmpty ? "--%" : `${avgHealth}%`}</span>
              <button 
                onClick={() => removeProject(projectId)}
                title="Delete Project"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 6, color: "#ef4444", backgroundColor: "#fef2f2", border: "1px solid #fecaca", cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fee2e2"; e.currentTarget.style.borderColor = "#fca5a5"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fef2f2"; e.currentTarget.style.borderColor = "#fecaca"; }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: "0.05em", marginBottom: 6 }}>LATENCY</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: isEmpty ? "#9ca3af" : "#111827" }}>{isEmpty ? "--" : "120"}<span style={{ fontSize: 14, color: "#6b7280", fontWeight: 500 }}>{isEmpty ? "" : "ms"}</span></div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: "0.05em", marginBottom: 6 }}>SUCCESS</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: isEmpty ? "#9ca3af" : "#111827" }}>{isEmpty ? "--" : "100"}<span style={{ fontSize: 14, color: "#6b7280", fontWeight: 500 }}>{isEmpty ? "" : "%"}</span></div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: "0.05em", marginBottom: 6 }}>ENDPOINTS</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: isEmpty ? "#9ca3af" : "#111827" }}>{totalApis}</div>
            </div>
          </div>

          <div style={{ marginTop: "auto" }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#6b7280", marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
              <span>Endpoint Status Grid</span>
              <span>{isEmpty ? "Awaiting Setup" : `${totalApis} APIs`}</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {endpointSquares.map((sq, index) => (
                <div key={index} title={sq.tooltip} style={{ width: 14, height: 14, backgroundColor: sq.color, borderRadius: 3, cursor: "crosshair", opacity: 0.9 }} onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.9")} />
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", backgroundColor: "#f9fafb", borderTop: "1px solid #e5e7eb" }}>
          <Link href={`/${projectSlug}/manage-apis`} style={{ flex: 1, padding: "14px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: isEmpty ? "#2563eb" : "#6b7280", fontSize: 13, fontWeight: isEmpty ? 600 : 500, textDecoration: "none", borderRight: "1px solid #e5e7eb", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#2563eb"; e.currentTarget.style.backgroundColor = "#eff6ff"; }} onMouseLeave={(e) => { e.currentTarget.style.color = isEmpty ? "#2563eb" : "#6b7280"; e.currentTarget.style.backgroundColor = "transparent"; }}>
            <Settings size={16} /> Manage APIs
          </Link>
          <Link href={`/${projectSlug}/test-runs`} style={{ flex: 1, padding: "14px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#6b7280", pointerEvents: isEmpty ? "none" : "auto", opacity: isEmpty ? 0.5 : 1, fontSize: 13, fontWeight: 500, textDecoration: "none", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#2563eb"; e.currentTarget.style.backgroundColor = "#eff6ff"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#6b7280"; e.currentTarget.style.backgroundColor = "transparent"; }}>
            <PlayCircle size={16} /> Test Runs
          </Link>
        </div>
      </div>

      <HealthCheckDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        projectName={projectName} 
        endpoints={endpoints} 
      />
    </>
  );
}