"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { api, ApiResponse } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export interface StatefulAlert {
  id: string;
  project: string;
  issue: string;
  path: string;
  details: string;
  time: string;
  type: "critical" | "warning";
  status: "active" | "resolved";
  resolvedAt?: string;
}

interface AlertContextType {
  alerts: StatefulAlert[];
  refreshAlerts: () => Promise<void>;
  resolveAlert: (id: string) => Promise<void>;
  resolveAll: () => Promise<void>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<StatefulAlert[]>([]);
  const { user, loading: authLoading } = useAuth();

  // Function to fetch real data from your Fastify backend
  const refreshAlerts = useCallback(async () => {
    try {
      const json = await api.get<ApiResponse<StatefulAlert[]>>("/alerts");

      if (json.success) {
        setAlerts(json.data);
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
    <AlertContext.Provider value={{ alerts, refreshAlerts, resolveAlert, resolveAll }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlerts() {
  const context = useContext(AlertContext);
  if (context === undefined) throw new Error("useAlerts must be used within an AlertProvider");
  return context;
}