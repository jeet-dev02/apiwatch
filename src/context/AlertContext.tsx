"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { api, ApiResponse, asArray } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export interface StatefulAlert {
  id: string;
  /** Shared by the alerts of one outage of a project. See lib/incidents.ts. */
  incidentId: string;
  project: string;
  issue: string;
  path: string;
  details: string;
  time: string;
  type: "critical" | "warning";
  status: "active" | "resolved";
  resolvedAt?: string;
}

/** GET /api/alerts reports how complete the active list is beside `data`. */
type AlertsResponse = ApiResponse<StatefulAlert[]> & {
  activeTotal?: number;
  truncated?: boolean;
};

interface AlertContextType {
  alerts: StatefulAlert[];
  /** How many active alerts the org has — more than `alerts` holds when `truncated`. */
  activeTotal: number;
  /** Some active alerts were left out, so counts built from `alerts` are short. */
  truncated: boolean;
  refreshAlerts: () => Promise<void>;
  resolveAlert: (id: string) => Promise<void>;
  resolveIncident: (id: string) => Promise<void>;
  resolveAll: () => Promise<void>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<StatefulAlert[]>([]);
  const [activeTotal, setActiveTotal] = useState(0);
  const [truncated, setTruncated] = useState(false);
  const { user, loading: authLoading } = useAuth();

  // Function to fetch real data from your Fastify backend
  const refreshAlerts = useCallback(async () => {
    try {
      const json = await api.get<AlertsResponse>("/alerts");

      if (json.success) {
        // Never let a missing `data` put undefined into state — every consumer
        // calls .filter or .map on this and would take the page down.
        const list = asArray<StatefulAlert>(json.data);
        setAlerts(list);
        setTruncated(json.truncated === true);
        setActiveTotal(
          typeof json.activeTotal === "number"
            ? json.activeTotal
            : list.filter((a) => a.status === "active").length
        );
      }
    } catch (error) {
      console.error("Failed to fetch real alerts from backend", error);
    }
  }, []);

  // Initial load and real-time polling (every 10 seconds).
  // Gated on the session: with no user there is nobody to fetch alerts for, and
  // every request would just 401. Re-runs when the signed-in user changes, so a
  // new session loads its own org's alerts rather than the previous one's.
  const userId = user?.id ?? null;

  useEffect(() => {
    if (authLoading || !userId) {
      setAlerts([]);
      setActiveTotal(0);
      setTruncated(false);
      return;
    }

    refreshAlerts();
    const interval = setInterval(refreshAlerts, 10000);
    return () => clearInterval(interval);
  }, [authLoading, userId, refreshAlerts]);

  // Real API call to resolve a single alert
  const resolveAlert = async (id: string) => {
    try {
      await api.patch<ApiResponse<StatefulAlert>>(`/alerts/${id}/resolve`);
      await refreshAlerts();
    } catch (error) {
      console.error("Failed to resolve alert", error);
    }
  };

  // Resolves every active alert of the incident, and the incident, in one
  // transaction — including alerts left out of a truncated list.
  const resolveIncident = async (id: string) => {
    try {
      await api.patch<ApiResponse<unknown>>(`/incidents/${id}/resolve`);
      await refreshAlerts();
    } catch (error) {
      console.error("Failed to resolve incident", error);
    }
  };

  // Real API call to resolve all active alerts
  const resolveAll = async () => {
    try {
      await api.patch<ApiResponse<unknown>>("/alerts/resolve-all");
      await refreshAlerts();
    } catch (error) {
      console.error("Failed to resolve all alerts", error);
    }
  };

  return (
    <AlertContext.Provider value={{ alerts, activeTotal, truncated, refreshAlerts, resolveAlert, resolveIncident, resolveAll }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlerts() {
  const context = useContext(AlertContext);
  if (context === undefined) throw new Error("useAlerts must be used within an AlertProvider");
  return context;
}
