"use client";

import { useState } from "react";
import { useProjects } from "@/context/ProjectContext";

import ProjectGridCard from "@/components/ProjectGridCard";
import CreateProjectGhostCard from "@/components/CreateProjectGhostCard";
import CreateProjectModal, { CreateProjectData } from "@/components/CreateProjectModal";
import GlobalRunnerModal from "@/components/GlobalRunnerModal"; // ADDED: Import the runner

export default function ProjectsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [runnerProjectId, setRunnerProjectId] = useState<string | null>(null); // ADDED: Track which project is running
  
  const { projects, addProject } = useProjects();

  const handleCreateNewProject = (data: CreateProjectData) => {
    addProject(data.name, data.url); 
  };
  
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>Projects</h1>
        <p style={{ fontSize: 14, color: "#6b7280", margin: "4px 0 0" }}>Overview of all monitored projects</p>
      </div>

      <div style={{ display: "grid", gap: 24 }} className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        
        <div onClick={() => setIsCreateModalOpen(true)}>
          <CreateProjectGhostCard />
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
      
      {/* ADDED: The Global Runner Modal, configured to skip selection */}
      <GlobalRunnerModal 
        isOpen={!!runnerProjectId} 
        onClose={() => setRunnerProjectId(null)} 
        preSelectedProjectId={runnerProjectId || undefined}
      />

    </div>
  );
}