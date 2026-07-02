"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// --- Global Types for Endpoints ---
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
export interface Header { key: string; value: string; }

export interface Endpoint {
  id: string | "new";
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
  // 1. Updated interface to accept baseUrlOverride
  addProject: (name: string, swaggerUrl?: string, baseUrlOverride?: string) => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  updateProjectEndpoints: (projectId: string, endpoints: Endpoint[]) => void;
  refreshProjects: () => Promise<void>;
  addEndpoint: (projectId: string, endpoint: Endpoint) => Promise<void>;
  updateEndpoint: (projectId: string, endpoint: Endpoint) => Promise<boolean>;
  // 2. Updated importSwagger to accept baseUrlOverride
  importSwagger: (projectId: string, swaggerUrl: string, baseUrlOverride?: string) => Promise<void>;
  testEndpoint: (projectId: string, endpointId: string) => Promise<any>;
  runAllTests: (projectId: string) => Promise<string | null>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY as string;

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

  // 3. Updated function to accept baseUrlOverride
  const addProject = async (name: string, swaggerUrl?: string, baseUrlOverride?: string) => { 
    try {
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
        setProjects((prev) => [newProject, ...prev]);

        if (swaggerUrl && swaggerUrl.trim() !== "") {
          try {
            // 4. Pass the override down to the import function!
            await importSwagger(newProject.id, swaggerUrl.trim(), baseUrlOverride);
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

  const updateProjectEndpoints = (projectId: string, newEndpoints: Endpoint[]) => {
    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, endpoints: newEndpoints } : p));
  };

  const addEndpoint = async (projectId: string, endpointData: Endpoint) => {
    try {
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

  const updateEndpoint = async (projectId: string, endpointData: Endpoint) => {
    try {
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

  const testEndpoint = async (projectId: string, endpointId: string) => {
    const response = await fetch(`${API_URL}/projects/${projectId}/endpoints/${endpointId}/test`, {
      method: "POST",
      headers: { "x-api-key": API_KEY }
    });
    return await response.json();
  };

  // 5. Updated importSwagger to accept baseUrlOverride and send it to the backend
  const importSwagger = async (projectId: string, swaggerUrl: string, baseUrlOverride?: string) => {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/import-swagger`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-api-key": API_KEY 
        },
        // 6. Send the override in the JSON body!
        body: JSON.stringify({ swaggerUrl, baseUrlOverride })
      });
      const json = await response.json();

      if (json.success) {
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

  const runAllTests = async (projectId: string) => {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/run-all`, {
        method: "POST",
        headers: { "x-api-key": API_KEY }
      });
      const json = await response.json();
      
      if (json.success) {
        return json.testRunId;
      } else {
        alert(`Failed to start suite: ${json.error}`);
        return null;
      }
    } catch (error) {
      console.error("Error triggering test suite:", error);
      return null;
    }
  };

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
      runAllTests 
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