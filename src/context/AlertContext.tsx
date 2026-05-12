"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Alert, mockAlerts } from "@/data/mock-data";

// We extend your base Alert to include a status
export interface StatefulAlert extends Alert {
  status: "active" | "resolved";
  resolvedAt?: string;
}

interface AlertContextType {
  alerts: StatefulAlert[];
  resolveAlert: (id: string) => void;
  resolveAll: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  // Initialize alerts with "active" status
  const [alerts, setAlerts] = useState<StatefulAlert[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load from mock data on first boot
    const initialAlerts = mockAlerts.map(a => ({ ...a, status: "active" as const }));
    setAlerts(initialAlerts);
    setIsLoaded(true);

    // WOW FACTOR: Simulate a brand new alert coming in every 45 seconds!
    const simulator = setInterval(() => {
      const randomIssues = ["DNS Resolution Failed", "CORS Error", "Unexpected 502 Gateway", "Latency Spike (>3000ms)"];
      const newAlert: StatefulAlert = {
        id: Date.now().toString(),
        project: "Production API",
        issue: randomIssues[Math.floor(Math.random() * randomIssues.length)],
        path: "/api/core/sync",
        details: "Automatically detected by Global Monitor",
        time: "Just now",
        type: Math.random() > 0.5 ? "critical" : "warning",
        status: "active"
      };
      setAlerts(prev => [newAlert, ...prev]);
    }, 45000);

    return () => clearInterval(simulator);
  }, []);

  const resolveAlert = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id 
        ? { ...alert, status: "resolved", resolvedAt: new Date().toLocaleTimeString() } 
        : alert
    ));
  };

  const resolveAll = () => {
    setAlerts(prev => prev.map(alert => 
      alert.status === "active" 
        ? { ...alert, status: "resolved", resolvedAt: new Date().toLocaleTimeString() } 
        : alert
    ));
  };

  if (!isLoaded) return null;

  return (
    <AlertContext.Provider value={{ alerts, resolveAlert, resolveAll }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlerts() {
  const context = useContext(AlertContext);
  if (context === undefined) throw new Error("useAlerts must be used within an AlertProvider");
  return context;
}