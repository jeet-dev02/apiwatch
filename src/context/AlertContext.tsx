"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

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

  // Function to fetch real data from your Fastify backend
  const refreshAlerts = useCallback(async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
      const API_KEY = process.env.NEXT_PUBLIC_API_KEY as string;

      const response = await fetch(`${API_URL}/alerts`, {
        headers: { "x-api-key": API_KEY }
      });
      const json = await response.json();
      
      if (json.success) {
        setAlerts(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch real alerts from backend", error);
    }
  }, []);

  // Initial load and real-time polling (every 10 seconds)
  useEffect(() => {
    refreshAlerts();
    const interval = setInterval(refreshAlerts, 10000);
    return () => clearInterval(interval);
  }, [refreshAlerts]);

  // Real API call to resolve a single alert
  const resolveAlert = async (id: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
      const API_KEY = process.env.NEXT_PUBLIC_API_KEY as string;

      await fetch(`${API_URL}/alerts/${id}/resolve`, {
        method: "PATCH",
        headers: { "x-api-key": API_KEY }
      });
      await refreshAlerts();
    } catch (error) {
      console.error("Failed to resolve alert", error);
    }
  };

  // Real API call to resolve all active alerts
  const resolveAll = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
      const API_KEY = process.env.NEXT_PUBLIC_API_KEY as string;

      await fetch(`${API_URL}/alerts/resolve-all`, {
        method: "PATCH",
        headers: { "x-api-key": API_KEY }
      });
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