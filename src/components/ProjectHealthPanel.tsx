"use client";

import { Settings, PlayCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import HealthCheckDrawer from "./HealthCheckDrawer";
import { useProjects, Endpoint } from "@/context/ProjectContext";

interface ProjectHealthPanelProps {
  projectId: string;
  endpoints: Endpoint[];
  title?: string;
}

export default function ProjectHealthPanel({ projectId, endpoints, title }: ProjectHealthPanelProps) {
  const { removeProject } = useProjects();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const projectName = title || "Project Overview";
  const projectSlug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const isEmpty = endpoints.length === 0;
  const avgHealth = isEmpty ? null : 100;
  
  const status = isEmpty ? "empty" : "healthy";
  const statusColor = status === "empty" ? "#d1d5db" : "#16a34a";

  const timeline = Array.from({ length: 30 }).map(() => {
    if (isEmpty) return "#f3f4f6"; 
    return "#16a34a"; // Green for passing runs
  });

  return (
    <>
      <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" }}>
        <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: isEmpty ? "#9ca3af" : "#111827", letterSpacing: "-0.01em", paddingRight: 8 }}>
              {projectName}
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: statusColor, boxShadow: `0 0 0 3px ${statusColor}33` }} />
                <span style={{ fontSize: 18, fontWeight: 700, color: isEmpty ? "#9ca3af" : "#111827" }}>
                  {isEmpty ? "--%" : `${avgHealth}%`}
                </span>
              </div>
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

          <button
            onClick={() => setIsDrawerOpen(true)}
            disabled={isEmpty}
            style={{ width: "100%", backgroundColor: "transparent", border: `1px solid ${isEmpty ? "#e5e7eb" : "#bfdbfe"}`, color: isEmpty ? "#9ca3af" : "#2563eb", padding: "12px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: isEmpty ? "not-allowed" : "pointer", transition: "all 0.2s ease", marginBottom: 32 }}
            onMouseEnter={(e) => { if (!isEmpty) e.currentTarget.style.backgroundColor = "#eff6ff"; }}
            onMouseLeave={(e) => { if (!isEmpty) e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            {isEmpty ? "No endpoints to test" : "Check health"}
          </button>

          <div style={{ marginTop: "auto" }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#6b7280", marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
              <span>Uptime (Last 30 runs)</span>
              <span style={{ color: statusColor, fontWeight: 600 }}>
                {status === "empty" ? "Awaiting Configuration" : "Operational"}
              </span>
            </div>
            <div style={{ display: "flex", gap: 3, height: 28 }}>
              {timeline.map((color, i) => (
                <div key={i} title={isEmpty ? "Pending Setup" : "Passing"} style={{ flex: 1, backgroundColor: color, borderRadius: 2, opacity: 0.85, transition: "opacity 0.2s", cursor: "crosshair" }} onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.85")} />
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", backgroundColor: "#f9fafb", borderTop: "1px solid #e5e7eb" }}>
          <Link href={`/${projectSlug}/manage-apis`} style={{ flex: 1, padding: "14px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: isEmpty ? "#2563eb" : "#6b7280", fontSize: 13, fontWeight: isEmpty ? 600 : 500, textDecoration: "none", borderRight: "1px solid #e5e7eb", transition: "color 0.2s, background-color 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#2563eb"; e.currentTarget.style.backgroundColor = "#eff6ff"; }} onMouseLeave={(e) => { e.currentTarget.style.color = isEmpty ? "#2563eb" : "#6b7280"; e.currentTarget.style.backgroundColor = "transparent"; }}>
            <Settings size={16} /> Manage APIs
          </Link>
          <Link href={`/${projectSlug}/test-runs`} style={{ flex: 1, padding: "14px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#6b7280", pointerEvents: isEmpty ? "none" : "auto", opacity: isEmpty ? 0.5 : 1, fontSize: 13, fontWeight: 500, textDecoration: "none", transition: "color 0.2s, background-color 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#2563eb"; e.currentTarget.style.backgroundColor = "#eff6ff"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#6b7280"; e.currentTarget.style.backgroundColor = "transparent"; }}>
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