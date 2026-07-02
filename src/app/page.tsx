"use client";

import { useState, useEffect } from "react";
import { useProjects } from "@/context/ProjectContext";

import SeeAllButton from "@/components/SeeAllButton";
import StatCard from "@/components/StatCard";
import ProjectGridCard from "@/components/ProjectGridCard"; 
import ActiveAlertsPanel from "@/components/ActiveAlertsPanel";
import QuickActionsPanel from "@/components/QuickActionsPanel";
import GlobalPerformanceChart from "@/components/GlobalPerformanceChart"; 
import CreateProjectHeaderButton from "@/components/CreateProjectHeaderButton";
import CreateProjectModal, { CreateProjectData } from "@/components/CreateProjectModal";
import { Folder, Code2, Activity, ShieldAlert, BellRing } from "lucide-react";
import { useNavigation } from "@/context/NavigationContext";

export default function Home() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPreparingModal, setIsPreparingModal] = useState(false); // ✨ NEW STATE for the spinner
  
  const { projects, addProject } = useProjects();
  const [statsData, setStatsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { startNavigation, stopNavigation } = useNavigation();

  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stats`, {
          headers: {
            "x-api-key": process.env.NEXT_PUBLIC_API_KEY as string 
          }
        });
        const json = await response.json();
        
        if (json.success) {
          setStatsData(json.data);
        }
      } catch (error) {
        console.error("Failed to fetch backend stats:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardStats();
  }, []);

  const handleCreateNewProject = async (data: CreateProjectData) => {
    await addProject(data.name, data.url, data.baseUrlOverride);
  };

  // ✨ NEW FUNCTION: Triggers the spinner, locks the screen, then opens the modal
  const handleOpenCreateModal = () => {
    setIsPreparingModal(true);
    startNavigation("create-modal"); // ✨ Instantly lock the sidebar and the rest of the app
    
    setTimeout(() => {
      setIsCreateModalOpen(true);
      setIsPreparingModal(false);
      stopNavigation(); // ✨ Instantly unlock the app the second the modal appears
    }, 400); 
  };

  const totalProjects = projects.length;
  const totalEndpoints = projects.reduce((acc, project) => acc + project.endpoints.length, 0);

  if (isLoading) {
    return <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>Loading system overview...</div>;
  }

  const stats = statsData || {
    avgHealthScore: 0, 
    apisTodayTested: 0, 
    activeAlerts: 0, 
    criticalAlerts: 0, 
    warningAlerts: 0,
    successRate: 0,
    avgResponseTime: 0,
    performanceData: []
  };

  return (
    // ✨ The Invisible Shield: pointerEvents 'none' disables ALL clicks on the page while loading
    <div style={{ 
      padding: 24, 
      maxWidth: 1400, 
      margin: "0 auto",
      pointerEvents: isPreparingModal ? "none" : "auto",
      transition: "opacity 0.2s ease"
    }}>
      
      {/* --- Header --- */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>Overview</h1>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "4px 0 0" }}>All projects · System-wide metrics</p>
        </div>
        {/* ✨ Pass the loading state down */}
        <CreateProjectHeaderButton 
          onClick={handleOpenCreateModal} 
          isLoading={isPreparingModal} 
        />
      </div>

      {/* --- Top KPI Cards --- */}
      <div style={{ display: "grid", gap: 16, marginTop: 24 }} className="grid-cols-1 md:grid-cols-3 lg:grid-cols-5">
        <StatCard title="Total Projects" value={totalProjects} trendText="Live count" trendDirection="up" icon={<Folder size={20} color="#2563eb" />} />
        <StatCard title="APIs Monitored" value={totalEndpoints} trendText="Live count" trendDirection="up" icon={<Code2 size={20} color="#16a34a" />} />
        <StatCard title="Avg Health Score" value={`${stats.avgHealthScore}%`} trendText="Global average" trendDirection="up" icon={<Activity size={20} color="#d97706" />} />
        <StatCard title="Test Runs Today" value={stats.apisTodayTested} trendText="Last 24 hours" trendDirection="up" icon={<ShieldAlert size={20} color="#2563eb" />} />
        <StatCard title="Active Alerts" value={stats.activeAlerts} trendText={`${stats.criticalAlerts} critical · ${stats.warningAlerts} warning`} trendDirection="down" icon={<BellRing size={20} color="#dc2626" />} />
      </div>

      {/* --- Project Grid (Top 3) --- */}
      <div style={{ display: "grid", gap: 24, marginTop: 32 }} className="grid-cols-1 lg:grid-cols-3">
        {projects.slice(0, 3).map((panel) => (
          <ProjectGridCard 
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

      {/* --- Needs Attention (Alerts) --- */}
      <div style={{ marginTop: 48 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0, marginBottom: 16 }}>Needs Attention</h2>
        <ActiveAlertsPanel />
      </div>

      {/* --- Bottom Section: Quick Actions & Global Chart --- */}
      <div style={{ display: "grid", gap: 24, marginTop: 24 }} className="grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <QuickActionsPanel />
        </div>
        <div className="lg:col-span-2">
          <GlobalPerformanceChart data={stats.performanceData} stats={stats} />
        </div>
      </div>

      {/* --- Modals --- */}
      <CreateProjectModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onCreate={handleCreateNewProject}
      />
    </div>
  );
}