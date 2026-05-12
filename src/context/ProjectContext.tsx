"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// --- Global Types for Endpoints ---
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
export interface Header { key: string; value: string; }

export interface Endpoint {
  id: number | "new";
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
  endpoints: Endpoint[]; 
};

// --- Default Mock Data (Used for template projects) ---
const defaultEndpoints: Endpoint[] = [
  { id: 1, method: "GET", path: "/api/users/me", url: "https://api.myapp.com/api/users/me", authType: "Bearer Token (JWT)", token: "jwt...", headers: [], body: "", expectedStatus: "200", maxResponseTime: "500" },
  { id: 2, method: "POST", path: "/api/auth/login", url: "https://api.myapp.com/api/auth/login", authType: "None", token: "", headers: [{ key: "Content-Type", value: "application/json" }], body: '{\n  "email": "test"\n}', expectedStatus: "200", maxResponseTime: "800" },
  { id: 3, method: "GET", path: "/api/products", url: "https://api.myapp.com/api/products", authType: "None", token: "", headers: [], body: "", expectedStatus: "200", maxResponseTime: "400" },
];

const initialProjectList: ProjectData[] = [
  { id: "1", title: "Project 1 Dashboard", endpoints: defaultEndpoints },
  { id: "2", title: "Project 2 Dashboard", endpoints: defaultEndpoints },
  { id: "3", title: "Project 3 Dashboard", endpoints: defaultEndpoints },
  { id: "4", title: "Project 4 Dashboard", endpoints: defaultEndpoints },
  { id: "5", title: "Project 5 Dashboard", endpoints: defaultEndpoints },
  { id: "6", title: "Project 6 Dashboard", endpoints: defaultEndpoints },
  { id: "7", title: "Project 7 Dashboard", endpoints: defaultEndpoints },
];

// --- Context Definition ---
interface ProjectContextType {
  projects: ProjectData[];
  addProject: (name: string, swaggerUrl?: string) => void; // Removed env
  removeProject: (id: string) => void;
  updateProjectEndpoints: (projectId: string, endpoints: Endpoint[]) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. On Initial Load: Check Local Storage
  useEffect(() => {
    const saved = localStorage.getItem("apiwatch_projects_v2"); 
    if (saved) {
      setProjects(JSON.parse(saved));
    } else {
      setProjects(initialProjectList);
      localStorage.setItem("apiwatch_projects_v2", JSON.stringify(initialProjectList));
    }
    setIsLoaded(true);
  }, []);

  // 2. On Any Change: Save to Local Storage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("apiwatch_projects_v2", JSON.stringify(projects));
    }
  }, [projects, isLoaded]);

  // --- Actions ---

  const addProject = (name: string, swaggerUrl?: string) => { 
    let startingEndpoints: Endpoint[] = [];

    // SIMULATE SWAGGER/OPENAPI IMPORT
    if (swaggerUrl && swaggerUrl.trim() !== "") {
      startingEndpoints = [
        { id: Date.now() + 1, method: "GET", path: "/api/users", url: "https://api.example.com/api/users", authType: "Bearer Token (JWT)", token: "", headers: [{ key: "Accept", value: "application/json" }], body: "", expectedStatus: "200", maxResponseTime: "500" },
        { id: Date.now() + 2, method: "POST", path: "/api/users", url: "https://api.example.com/api/users", authType: "Bearer Token (JWT)", token: "", headers: [{ key: "Content-Type", value: "application/json" }], body: '{\n  "name": "string",\n  "email": "user@example.com"\n}', expectedStatus: "201", maxResponseTime: "800" },
        { id: Date.now() + 3, method: "GET", path: "/health", url: "https://api.example.com/health", authType: "None", token: "", headers: [], body: "", expectedStatus: "200", maxResponseTime: "200" },
      ];
    }

    const newProject: ProjectData = { 
      id: Date.now().toString(), 
      title: name, 
      endpoints: startingEndpoints 
    };
    
    setProjects((prev) => [newProject, ...prev]);
  };

  const removeProject = (id: string) => {
    setProjects((prev) => prev.filter((project) => project.id !== id));
  };

  const updateProjectEndpoints = (projectId: string, newEndpoints: Endpoint[]) => {
    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, endpoints: newEndpoints } : p));
  };

  // Prevent UI flashing during hydration
  if (!isLoaded) return null;

  return (
    <ProjectContext.Provider value={{ projects, addProject, removeProject, updateProjectEndpoints }}>
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