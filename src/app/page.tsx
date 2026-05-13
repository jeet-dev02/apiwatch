"use client";

import { useState } from "react";
import { useProjects } from "@/context/ProjectContext";

import SeeAllButton from "@/components/SeeAllButton";
import StatCard from "@/components/StatCard";
import ProjectHealthPanel from "@/components/ProjectHealthPanel";
import ActiveAlertsPanel from "@/components/ActiveAlertsPanel";
import QuickActionsPanel from "@/components/QuickActionsPanel";
import OverallPerformanceChart from "@/components/OverallPerformanceChart";
import CreateProjectHeaderButton from "@/components/CreateProjectHeaderButton";
import CreateProjectModal, { CreateProjectData } from "@/components/CreateProjectModal";
// FIXED: Removed mockAlerts from this import line since it wasn't being used!
import { mockStats, mockPerformanceData } from "@/data/mock-data";
import { Folder, Code2, Activity, ShieldAlert, BellRing } from "lucide-react";

export default function Home() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { projects, addProject } = useProjects();

  const handleCreateNewProject = (data: CreateProjectData) => {
    addProject(data.name, data.url); 
  };

  // REAL-TIME DASHBOARD STATS
  const totalProjects = projects.length;
  // This adds up EVERY endpoint across EVERY project you have created!
  const totalEndpoints = projects.reduce((acc, project) => acc + project.endpoints.length, 0);

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>Overview</h1>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "4px 0 0" }}>All projects · Last 24h</p>
        </div>
        <CreateProjectHeaderButton onClick={() => setIsCreateModalOpen(true)} />
      </div>

      <div style={{ display: "grid", gap: 16, marginTop: 24 }} className="grid-cols-1 md:grid-cols-3 lg:grid-cols-5">
        <StatCard title="Total Projects" value={totalProjects} trendText={`↑ 1 vs yesterday`} trendDirection="up" icon={<Folder size={20} color="#2563eb" />} />
        
        {/* Now completely dynamic based on your actual added APIs */}
        <StatCard title="APIs Monitored" value={totalEndpoints} trendText={`↑ 3 vs yesterday`} trendDirection="up" icon={<Code2 size={20} color="#16a34a" />} />
        
        <StatCard title="Avg Health Score" value={`${mockStats.avgHealthScore}%`} trendText={`↑ ${mockStats.deltaHealth}% vs yesterday`} trendDirection="up" icon={<Activity size={20} color="#d97706" />} />
        <StatCard title="APIs Tested Today" value={mockStats.apisTodayTested} trendText={`↑ ${mockStats.deltaTodayTested} vs yesterday`} trendDirection="up" icon={<ShieldAlert size={20} color="#2563eb" />} />
        <StatCard title="Active Alerts" value={mockStats.activeAlerts} trendText={`${mockStats.criticalAlerts} critical · ${mockStats.warningAlerts} warning`} trendDirection="down" icon={<BellRing size={20} color="#dc2626" />} />
      </div>

      <div style={{ display: "grid", gap: 24, marginTop: 24 }} className="grid-cols-1 lg:grid-cols-3">
        {projects.slice(0, 3).map((panel) => (
          <ProjectHealthPanel 
            key={panel.id} 
            projectId={panel.id} 
            title={panel.title} 
            endpoints={panel.endpoints} 
          />
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
        <SeeAllButton />
      </div>

      <div style={{ marginTop: 48 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0, marginBottom: 16 }}>Needs Attention</h2>
        <ActiveAlertsPanel />
      </div>

      <div style={{ display: "grid", gap: 24, marginTop: 24 }} className="grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <QuickActionsPanel />
        </div>
        <div className="lg:col-span-2">
          <OverallPerformanceChart data={mockPerformanceData} stats={mockStats} />
        </div>
      </div>

      <CreateProjectModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onCreate={handleCreateNewProject}
      />
    </div>
  );
}