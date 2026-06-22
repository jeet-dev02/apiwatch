"use client";

import { useNavigation } from "@/context/NavigationContext";

export default function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const { isNavigating } = useNavigation();

  return (
    <main
      style={{
        marginLeft: 220,
        minHeight: "100vh",
        
        opacity: isNavigating ? 0.5 : 1,
        pointerEvents: isNavigating ? "none" : "auto",
        filter: isNavigating ? "grayscale(40%)" : "none",
        transition: "opacity 0.2s ease, filter 0.2s ease",
      }}
    >
      {children}
    </main>
  );
}