"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { api, ApiError, ApiResponse, UnauthorizedError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

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
  preRequestScript?: string;   
  postResponseScript?: string; 
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
  addProject: (name: string, swaggerUrl?: string, baseUrlOverride?: string) => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  updateProjectEndpoints: (projectId: string, endpoints: Endpoint[]) => void;
  refreshProjects: () => Promise<void>;
  addEndpoint: (projectId: string, endpoint: Endpoint) => Promise<void>;
  updateEndpoint: (projectId: string, endpoint: Endpoint) => Promise<boolean>;
  importSwagger: (projectId: string, swaggerUrl: string, baseUrlOverride?: string) => Promise<void>;
  testEndpoint: (projectId: string, endpointId: string) => Promise<any>;
  runAllTests: (projectId: string) => Promise<string | null>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user, loading: authLoading } = useAuth();

  const fetchProjects = useCallback(async () => {
    try {
      const json = await api.get<ApiResponse<ProjectData[]>>("/projects");

      if (json.success) {
        setProjects(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch projects from backend:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Gated on the session: with no user every request would just 401. Note the
  // signed-out branch still has to set isLoaded, because this provider renders
  // null until then — without it /login would never paint.
  const userId = user?.id ?? null;

  useEffect(() => {
    if (authLoading) return;

    if (!userId) {
      setProjects([]);
      setIsLoaded(true);
      return;
    }

    fetchProjects();
  }, [authLoading, userId, fetchProjects]);

  const addProject = async (name: string, swaggerUrl?: string, baseUrlOverride?: string) => { 
    try {
      const json = await api.post<ApiResponse<ProjectData>>("/projects", { title: name });

      const newProject = json.data;
      setProjects((prev) => [newProject, ...prev]);

      if (swaggerUrl && swaggerUrl.trim() !== "") {
        try {
          await importSwagger(newProject.id, swaggerUrl.trim(), baseUrlOverride);
        } catch (importError) {
          console.error("Swagger import failed during project creation", importError);
          alert("Project was created, but we couldn't import the Swagger URL. You can try again from the API Manager.");
        }
      }
    } catch (error) {
      console.error("Error creating project:", error);
      // A 401 already redirects to /login; alerting would flash mid-navigation.
      if (!(error instanceof UnauthorizedError)) alert((error as Error).message);
    }
  };

  const removeProject = async (id: string) => {
    try {
      const json = await api.delete<ApiResponse<unknown>>(`/projects/${id}`);

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

      const json = await api.post<ApiResponse<Endpoint>>(`/projects/${projectId}/endpoints`, payload);

      setProjects((prev) => prev.map(p =>
        p.id === projectId
          ? { ...p, endpoints: [...p.endpoints, json.data] }
          : p
      ));
    } catch (error) {
      console.error("Error saving endpoint:", error);
      if (!(error instanceof UnauthorizedError)) alert((error as Error).message);
    }
  };

  const updateEndpoint = async (projectId: string, endpointData: Endpoint) => {
    try {
      const payload = {
        ...endpointData,
        maxResponseTime: String(endpointData.maxResponseTime)
      };

      const json = await api.put<ApiResponse<Endpoint>>(`/projects/${projectId}/endpoints/${endpointData.id}`, payload);

      setProjects((prev) => prev.map(p =>
        p.id === projectId
          ? { ...p, endpoints: p.endpoints.map(ep => ep.id === endpointData.id ? json.data : ep) }
          : p
      ));
      return true;
    } catch (error) {
      console.error("Error updating endpoint:", error);
      if (!(error instanceof UnauthorizedError)) alert((error as Error).message);
      return false;
    }
  };

  const testEndpoint = async (projectId: string, endpointId: string) => {
    try {
      return await api.post<ApiResponse<unknown>>(`/projects/${projectId}/endpoints/${endpointId}/test`);
    } catch (error) {
      // A test that fails to execute still comes back as { success: false, error },
      // which is what the caller branches on - hand that body over rather than throw.
      if (error instanceof ApiError && error.body) return error.body;
      throw error;
    }
  };

  const importSwagger = async (projectId: string, swaggerUrl: string, baseUrlOverride?: string) => {
    try {
      const json = await api.post<ApiResponse<Endpoint[]>>(`/projects/${projectId}/import-swagger`, { swaggerUrl, baseUrlOverride });

      setProjects((prev) => prev.map(p =>
        p.id === projectId
          ? { ...p, endpoints: json.data }
          : p
      ));
    } catch (error) {
      console.error("Error importing swagger:", error);
      if (!(error instanceof UnauthorizedError)) alert((error as Error).message);
      throw error;
    }
  };

  const runAllTests = async (projectId: string) => {
    try {
      // testRunId sits at the top level of the payload, not inside `data`.
      const json = await api.post<ApiResponse<unknown> & { testRunId?: string }>(`/projects/${projectId}/run-all`);

      return json.testRunId ?? null;
    } catch (error) {
      console.error("Error triggering test suite:", error);
      if (!(error instanceof UnauthorizedError)) alert((error as Error).message);
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