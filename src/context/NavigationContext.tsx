"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface NavigationContextType {
  isNavigating: boolean;
  navigatingTo: string | null;
  startNavigation: (href: string) => void;
  stopNavigation: () => void; // ✨ NEW: Manual unlock switch
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The moment the Next.js router officially changes the URL, unlock the UI
  useEffect(() => {
    setIsNavigating(false);
    setNavigatingTo(null);
  }, [pathname, searchParams]);

  const startNavigation = (href: string) => {
    setIsNavigating(true);
    setNavigatingTo(href);
  };

  // ✨ NEW: Manually stop the lock (crucial for Modals that don't trigger URL changes)
  const stopNavigation = () => {
    setIsNavigating(false);
    setNavigatingTo(null);
  };

  return (
    <NavigationContext.Provider value={{ isNavigating, navigatingTo, startNavigation, stopNavigation }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) throw new Error("useNavigation must be used within NavigationProvider");
  return context;
}