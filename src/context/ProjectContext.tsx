"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { api, ApiError, ApiResponse, UnauthorizedError, asArray } from "@/lib/api";
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
  // Only on an endpoint read from GET /endpoints; /projects leaves them out.
  // None of them is the form's to send back: see editableFields.
  order?: number;
  pingCount?: number;
  includeInSchedule?: boolean;
}

/**
 * What POST and PUT /endpoints get from the API Manager's form: the fields it
 * edits, and nothing else.
 *
 * The form holds the whole endpoint as it was loaded, and this used to send
 * all of it back. The backend takes a field it is sent as a value meant, so a
 * stale copy undid whatever had changed since: an endpoint switched off
 * scheduled runs in the list was switched back on by the next save of the
 * form. Left out, includeInSchedule, pingCount and order stay as the server
 * has them, and a new endpoint gets the defaults for its method.
 */
function editableFields(endpoint: Endpoint) {
  return {
    method: endpoint.method,
    path: endpoint.path,
    url: endpoint.url,
    authType: endpoint.authType,
    token: endpoint.token,
    headers: endpoint.headers,
    body: endpoint.body,
    preRequestScript: endpoint.preRequestScript,
    postResponseScript: endpoint.postResponseScript,
    expectedStatus: endpoint.expectedStatus,
    maxResponseTime: String(endpoint.maxResponseTime),
  };
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
  updateEndpoint: (projectId: string, endpoint: Endpoint) => Promise<Endpoint | null>;
  setIncludeInSchedule: (projectId: string, endpointId: string, include: boolean) => Promise<Endpoint | null>;
  reorderEndpoints: (projectId: string, endpointIds: string[]) => Promise<Reorder>;
  importSwagger: (projectId: string, swaggerUrl: string, baseUrlOverride?: string) => Promise<void>;
  testEndpoint: (projectId: string, endpointId: string) => Promise<any>;
  runAllTests: (projectId: string) => Promise<RunStart>;
}

/**
 * What asking for a run came to.
 *
 * `conflict` is the backend's 409: a run of the project was already in
 * flight, possibly a scheduled one nobody here started, and `testRunId` is
 * that run, so the caller can follow it rather than report a failure.
 */
export type RunStart =
  | { status: "started"; testRunId: string }
  | { status: "conflict"; testRunId: string | null; message: string }
  | { status: "failed" };

/**
 * What asking to reorder came to.
 *
 * `stale` is the backend's 409: the ids sent were not exactly the project's
 * endpoints, because one was added or deleted since the list was read, and
 * nothing moved. Sending them again would be refused again; the list has to
 * be read afresh first.
 */
export type Reorder = "moved" | "stale" | "failed";

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

/**
 * Guarantee the one shape the rest of the app relies on.
 *
 * Consumers index straight into `project.endpoints` — ProjectGridCard reads
 * .length, the API manager maps over it — so a project that arrives without
 * the relation would crash the page rather than render an empty card.
 */
function normaliseProject(project: ProjectData): ProjectData {
  return { ...project, endpoints: asArray<Endpoint>(project?.endpoints) };
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user, loading: authLoading } = useAuth();

  const fetchProjects = useCallback(async () => {
    try {
      const json = await api.get<ApiResponse<ProjectData[]>>("/projects");

      if (json.success) {
        setProjects(asArray<ProjectData>(json.data).map(normaliseProject));
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

      if (!json.data?.id) {
        throw new Error("The server created the project but returned nothing to show.");
      }

      const newProject = normaliseProject(json.data);
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

  // Stable, so the API Manager can load through it from an effect.
  const updateProjectEndpoints = useCallback((projectId: string, newEndpoints: Endpoint[]) => {
    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, endpoints: newEndpoints } : p));
  }, []);

  const addEndpoint = async (projectId: string, endpointData: Endpoint) => {
    try {
      const json = await api.post<ApiResponse<Endpoint>>(`/projects/${projectId}/endpoints`, editableFields(endpointData));

      // Appending an undefined would leave a hole the list rendering trips on.
      if (!json.data?.id) {
        throw new Error("The server saved the endpoint but returned nothing to show.");
      }

      setProjects((prev) => prev.map(p =>
        p.id === projectId
          ? { ...p, endpoints: [...asArray<Endpoint>(p.endpoints), json.data] }
          : p
      ));
    } catch (error) {
      console.error("Error saving endpoint:", error);
      if (!(error instanceof UnauthorizedError)) alert((error as Error).message);
    }
  };

  /**
   * Resolves to the endpoint as the server saved it, which is not always what
   * was sent: changing the method also resets includeInSchedule to the new
   * method's default. Null if the save failed.
   */
  const updateEndpoint = async (projectId: string, endpointData: Endpoint) => {
    try {
      const json = await api.put<ApiResponse<Endpoint>>(`/projects/${projectId}/endpoints/${endpointData.id}`, editableFields(endpointData));

      // Fall back to what we just sent rather than blanking the row.
      const saved = json.data?.id ? json.data : endpointData;

      setProjects((prev) => prev.map(p =>
        p.id === projectId
          ? { ...p, endpoints: asArray<Endpoint>(p.endpoints).map(ep => ep.id === endpointData.id ? saved : ep) }
          : p
      ));
      return saved;
    } catch (error) {
      console.error("Error updating endpoint:", error);
      if (!(error instanceof UnauthorizedError)) alert((error as Error).message);
      return null;
    }
  };

  /**
   * Switch an endpoint in or out of scheduled runs. Its own PATCH, which takes
   * nothing else, so a form open on the same endpoint neither has to be saved
   * for this to stick nor can undo it later (see editableFields).
   */
  const setIncludeInSchedule = async (projectId: string, endpointId: string, include: boolean) => {
    try {
      const json = await api.patch<ApiResponse<Endpoint>>(`/projects/${projectId}/endpoints/${endpointId}`, { includeInSchedule: include });

      setProjects((prev) => prev.map(p =>
        p.id === projectId
          ? {
              ...p,
              endpoints: asArray<Endpoint>(p.endpoints).map(ep =>
                ep.id === endpointId ? { ...ep, includeInSchedule: json.data?.includeInSchedule ?? include } : ep
              ),
            }
          : p
      ));
      return json.data ?? null;
    } catch (error) {
      console.error("Error changing whether an endpoint is scheduled:", error);
      if (!(error instanceof UnauthorizedError)) alert((error as Error).message);
      return null;
    }
  };

  /**
   * Put a project's endpoints in the order given, first to run first, which
   * is the order every run calls them in. endpointIds has to be every one of
   * the project's endpoints: PUT /order refuses anything else (see Reorder).
   *
   * The list shows the new order straight away. On success it becomes the
   * server's list; on failure the endpoints are put back in the order they
   * were in. Put back, not restored from a copy, so a schedule switch flipped
   * while the request was out keeps its new value.
   */
  const reorderEndpoints = async (projectId: string, endpointIds: string[]): Promise<Reorder> => {
    const putInOrder = (ids: string[]) => {
      const position = new Map(ids.map((id, index) => [id, index]));
      // An endpoint missing from ids goes last; sort is stable, so the ones
      // listed keep their order among themselves.
      const rank = (endpoint: Endpoint) => position.get(endpoint.id) ?? ids.length;
      setProjects((prev) => prev.map(p =>
        p.id === projectId
          ? { ...p, endpoints: [...asArray<Endpoint>(p.endpoints)].sort((a, b) => rank(a) - rank(b)) }
          : p
      ));
    };

    const before = asArray<Endpoint>(projects.find((p) => p.id === projectId)?.endpoints).map((ep) => ep.id);
    putInOrder(endpointIds);

    try {
      const json = await api.put<ApiResponse<Endpoint[]>>(`/projects/${projectId}/endpoints/order`, { endpointIds });

      // Every endpoint as GET /endpoints sends it, in its new order.
      if (Array.isArray(json.data)) updateProjectEndpoints(projectId, json.data);
      return "moved";
    } catch (error) {
      putInOrder(before);
      if (error instanceof ApiError && error.status === 409) return "stale";
      console.error("Error reordering endpoints:", error);
      if (!(error instanceof UnauthorizedError)) alert((error as Error).message);
      return "failed";
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
          ? { ...p, endpoints: asArray<Endpoint>(json.data) }
          : p
      ));
    } catch (error) {
      console.error("Error importing swagger:", error);
      if (!(error instanceof UnauthorizedError)) alert((error as Error).message);
      throw error;
    }
  };

  const runAllTests = async (projectId: string): Promise<RunStart> => {
    try {
      // testRunId sits at the top level of the payload, not inside `data`.
      const json = await api.post<ApiResponse<unknown> & { testRunId?: string }>(`/projects/${projectId}/run-all`);

      return json.testRunId ? { status: "started", testRunId: json.testRunId } : { status: "failed" };
    } catch (error) {
      // Not alerted here: with runs starting on a schedule, finding one in
      // flight is ordinary, and what to do about it is the caller's call.
      if (error instanceof ApiError && error.status === 409) {
        const body = error.body as { testRunId?: unknown } | undefined;
        return {
          status: "conflict",
          testRunId: typeof body?.testRunId === "string" ? body.testRunId : null,
          message: error.message,
        };
      }
      console.error("Error triggering test suite:", error);
      if (!(error instanceof UnauthorizedError)) alert((error as Error).message);
      return { status: "failed" };
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
      setIncludeInSchedule,
      reorderEndpoints,
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