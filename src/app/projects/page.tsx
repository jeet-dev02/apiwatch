"use client";

import { useState } from "react";
import { useProjects } from "@/context/ProjectContext";

import ProjectGridCard from "@/components/ProjectGridCard";
import CreateProjectGhostCard from "@/components/CreateProjectGhostCard";
import CreateProjectModal, { CreateProjectData } from "@/components/CreateProjectModal";
import GlobalRunnerModal from "@/components/GlobalRunnerModal";
import { useNavigation } from "@/context/NavigationContext";


export default function ProjectsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPreparingModal, setIsPreparingModal] = useState(false); // ✨ NEW STATE for spinner
  const [runnerProjectId, setRunnerProjectId] = useState<string | null>(null); 
  
  const { projects, addProject } = useProjects();

  const handleCreateNewProject = (data: CreateProjectData) => {
    addProject(data.name, data.url); 
  };
  const { startNavigation, stopNavigation } = useNavigation();
  
  const handleOpenCreateModal = () => {
    setIsPreparingModal(true);
    startNavigation("create-modal"); // ✨ Instantly lock the sidebar and the rest of the app
    
    setTimeout(() => {
      setIsCreateModalOpen(true);
      setIsPreparingModal(false);
      stopNavigation(); // ✨ Instantly unlock the app the second the modal appears
    }, 400); 
  };
  
  return (
    // ✨ The Invisible Shield applied here as well
    <div style={{ 
      padding: 24, 
      maxWidth: 1400, 
      margin: "0 auto",
      pointerEvents: isPreparingModal ? "none" : "auto",
      transition: "opacity 0.2s ease"
    }}>
      
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>Projects</h1>
        <p style={{ fontSize: 14, color: "#6b7280", margin: "4px 0 0" }}>Overview of all monitored projects</p>
      </div>

      <div style={{ display: "grid", gap: 24 }} className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        
        {/* ✨ Trigger the lock and pass loading state */}
        <div onClick={handleOpenCreateModal}>
          <CreateProjectGhostCard isLoading={isPreparingModal} />
        </div>

        {projects.map((card) => (
          <ProjectGridCard 
            key={card.id} 
            projectId={card.id} 
            title={card.title} 
            endpoints={card.endpoints}
          />
        ))}

      </div>

      <CreateProjectModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onCreate={handleCreateNewProject}
      />
      
      <GlobalRunnerModal 
        isOpen={!!runnerProjectId} 
        onClose={() => setRunnerProjectId(null)} 
        preSelectedProjectId={runnerProjectId || undefined}
      />

    </div>
  );
}