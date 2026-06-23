"use client";

import { createContext, useContext, useState, useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface NavigationContextType {
  isNavigating: boolean;
  navigatingTo: string | null;
  startNavigation: (href: string) => void;
  stopNavigation: () => void; 
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

function NavigationContent({ children }: { children: React.ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsNavigating(false);
    setNavigatingTo(null);
  }, [pathname, searchParams]);

  const startNavigation = (href: string) => {
    setIsNavigating(true);
    setNavigatingTo(href);
  };

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

// ✨ THE FIX: Wrap the provider logic in Suspense
export function NavigationProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<>{children}</>}>
      <NavigationContent>{children}</NavigationContent>
    </Suspense>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) throw new Error("useNavigation must be used within NavigationProvider");
  return context;
}