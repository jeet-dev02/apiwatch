"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// --- Global Types for Endpoints ---
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
export interface Header { key: string; value: string; }

export interface Endpoint {
  id: string | "new"; // Updated to string to support backend Prisma CUIDs
  method: HttpMethod;
  path: string;
  url: string;
  authType: string;
  token: string;
  headers: Header[];
  body: string;
  expectedStatus: string;
  maxResponseTime: string;
}

export type ProjectData = {
  id: string;
  title: string;
  slug?: string;
  healthScore?: number;
  endpoints: Endpoint[]; 
};

// --- Context Definition ---
interface ProjectContextType {
  projects: ProjectData[];
  addProject: (name: string, swaggerUrl?: string) => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  updateProjectEndpoints: (projectId: string, endpoints: Endpoint[]) => void;
  refreshProjects: () => Promise<void>; // Added so we can force a re-fetch if needed
  addEndpoint: (projectId: string, endpoint: Endpoint) => Promise<void>;
  updateEndpoint: (projectId: string, endpoint: Endpoint) => Promise<boolean>; // Updated to return boolean
  importSwagger: (projectId: string, swaggerUrl: string) => Promise<void>; // Added for Swagger import
  testEndpoint: (projectId: string, endpointId: string) => Promise<any>; // Added for Live Testing
  runAllTests: (projectId: string) => Promise<string | null>; // NEW: Added for full suite testing
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Securely grab environment variables
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY as string;

  // 1. Fetch all projects and their endpoints from Fastify on load
  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_URL}/projects`, {
        headers: {
          "x-api-key": API_KEY
        }
      });
      const json = await response.json();
      
      if (json.success) {
        setProjects(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch projects from backend:", error);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // --- Actions ---

  // 2. Create a new project in the Postgres database
  const addProject = async (name: string, swaggerUrl?: string) => { 
    try {
      // Create the empty project
      const response = await fetch(`${API_URL}/projects`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-api-key": API_KEY 
        },
        body: JSON.stringify({ title: name })
      });
      const json = await response.json();

      if (json.success) {
        const newProject = json.data;
        
        // Add the empty project to the UI immediately so it feels fast
        setProjects((prev) => [newProject, ...prev]);

        // If provided a Swagger URL, automatically import the APIs!
        if (swaggerUrl && swaggerUrl.trim() !== "") {
          try {
            await importSwagger(newProject.id, swaggerUrl.trim());
          } catch (importError) {
            console.error("Swagger import failed during project creation", importError);
            alert("Project was created, but we couldn't import the Swagger URL. You can try again from the API Manager.");
          }
        }
      } else {
        alert(`Failed to create project: ${json.error}`);
      }
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  // 3. Delete a project from the Postgres database
  const removeProject = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/projects/${id}`, { 
        method: "DELETE",
        headers: {
          "x-api-key": API_KEY
        }
      });
      const json = await response.json();

      if (json.success) {
        setProjects((prev) => prev.filter((project) => project.id !== id));
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  // 4. Temporarily keeping this local for UI stability
  const updateProjectEndpoints = (projectId: string, newEndpoints: Endpoint[]) => {
    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, endpoints: newEndpoints } : p));
  };

  // 5. Create an endpoint in the Postgres database
  const addEndpoint = async (projectId: string, endpointData: Endpoint) => {
    try {
      // Force Zod-compliant formatting
      const payload = {
        ...endpointData,
        maxResponseTime: String(endpointData.maxResponseTime) 
      };

      const response = await fetch(`${API_URL}/projects/${projectId}/endpoints`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-api-key": API_KEY 
        },
        body: JSON.stringify(payload)
      });
      const json = await response.json();

      if (json.success) {
        setProjects((prev) => prev.map(p => 
          p.id === projectId 
            ? { ...p, endpoints: [...p.endpoints, json.data] } 
            : p
        ));
      } else {
        alert(`Failed to save endpoint: ${JSON.stringify(json.error)}`);
      }
    } catch (error) {
      console.error("Error saving endpoint:", error);
    }
  };

  // 6. Update an existing endpoint in the Postgres database
  const updateEndpoint = async (projectId: string, endpointData: Endpoint) => {
    try {
      // Force Zod-compliant formatting
      const payload = {
        ...endpointData,
        maxResponseTime: String(endpointData.maxResponseTime)
      };

      const response = await fetch(`${API_URL}/projects/${projectId}/endpoints/${endpointData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
        body: JSON.stringify(payload)
      });
      const json = await response.json();

      if (json.success) {
        setProjects((prev) => prev.map(p => 
          p.id === projectId 
            ? { ...p, endpoints: p.endpoints.map(ep => ep.id === endpointData.id ? json.data : ep) } 
            : p
        ));
        return true; 
      } else {
        const errorMsg = typeof json.error === 'object' ? JSON.stringify(json.error) : json.error;
        alert(`Failed to update endpoint: ${errorMsg}`);
        return false; 
      }
    } catch (error) {
      console.error("Error updating endpoint:", error);
      return false;
    }
  };

  // NEW: Trigger a live test
  const testEndpoint = async (projectId: string, endpointId: string) => {
    const response = await fetch(`${API_URL}/projects/${projectId}/endpoints/${endpointId}/test`, {
      method: "POST",
      headers: { "x-api-key": API_KEY }
    });
    return await response.json();
  };

  // 7. Trigger the backend Swagger parser
  const importSwagger = async (projectId: string, swaggerUrl: string) => {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/import-swagger`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-api-key": API_KEY 
        },
        body: JSON.stringify({ swaggerUrl })
      });
      const json = await response.json();

      if (json.success) {
        // The backend returns the full, updated list of endpoints. Overwrite local state with it.
        setProjects((prev) => prev.map(p => 
          p.id === projectId 
            ? { ...p, endpoints: json.data } 
            : p
        ));
      } else {
        alert(`Import failed: ${json.error}`);
        throw new Error(json.error);
      }
    } catch (error) {
      console.error("Error importing swagger:", error);
      throw error; 
    }
  };

  // NEW: Trigger the full project test suite
  const runAllTests = async (projectId: string) => {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/run-all`, {
        method: "POST",
        headers: { "x-api-key": API_KEY }
      });
      const json = await response.json();
      
      if (json.success) {
        return json.testRunId; // Return the ID so the UI can start polling
      } else {
        alert(`Failed to start suite: ${json.error}`);
        return null;
      }
    } catch (error) {
      console.error("Error triggering test suite:", error);
      return null;
    }
  };

  // Prevent UI flashing during hydration
  if (!isLoaded) return null;

  return (
    <ProjectContext.Provider value={{ 
      projects, 
      addProject, 
      removeProject, 
      updateProjectEndpoints, 
      refreshProjects: fetchProjects,
      addEndpoint,       
      updateEndpoint,
      importSwagger,
      testEndpoint,
      runAllTests // NEW: Exported!
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProjects must be used within a ProjectProvider");
  }
  return context;
}