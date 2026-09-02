"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useNavigation } from "@/context/NavigationContext";
import { useAuth } from "@/context/AuthContext";
import {
  Shield,
  LayoutDashboard,
  FolderOpen,
  Bell,
  Loader2,
  LogOut,
} from "lucide-react";


const navItems = [
  { icon: LayoutDashboard, label: "Overview",    href: "/" },
  { icon: FolderOpen,      label: "Projects",    href: "/projects" },
  { icon: Bell,            label: "Alerts",      href: "/alerts" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isNavigating, navigatingTo, startNavigation } = useNavigation();
  const { user, logout } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await logout();
    } catch (error) {
      console.error("Sign out failed", error);
      setSigningOut(false);
    }
  };

  return (
    <aside
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        height: "100vh",
        width: 220,
        backgroundColor: "#ffffff",
        borderRight: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        zIndex: 40,
        pointerEvents: isNavigating ? "none" : "auto", 
      }}
    >
     
      <Link 
        href="/"
        onClick={() => {
          if (pathname !== "/") startNavigation("/");
        }}
        style={{ 
          padding: "20px 16px", 
          borderBottom: "1px solid #e5e7eb", 
          display: "flex", 
          alignItems: "center", 
          gap: 10,
          textDecoration: "none",
          cursor: "pointer"
        }}
      >
        <Shield size={22} color="#2563eb" strokeWidth={2.2} />
        <span style={{ fontWeight: 700, fontSize: 18, color: "#111827", letterSpacing: "-0.01em" }}>
          APIWatch
        </span>
      </Link>

      <nav style={{ flex: 1, paddingTop: 8, overflowY: "auto" }}>
        {navItems.map(({ icon: Icon, label, href }) => {
          const isActive = pathname === href;
          const isNavigatingThis = navigatingTo === href;
          
          const linkOpacity = isNavigating && !isNavigatingThis ? 0.4 : 1; 

          return (
            <Link
              key={href}
              href={href}
              onClick={() => {
                if (!isActive) startNavigation(href);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                margin: "2px 8px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: isActive ? 500 : 400,
                color: isActive ? "#2563eb" : "#6b7280",
                backgroundColor: isActive ? "#eff6ff" : "transparent",
                textDecoration: "none",
                opacity: linkOpacity, 
                transition: "background-color 150ms, color 150ms, opacity 200ms",
              }}
              onMouseEnter={(e) => {
                if (!isActive && !isNavigating) {
                  e.currentTarget.style.backgroundColor = "#eff6ff";
                  e.currentTarget.style.color = "#2563eb";
                  const svg = e.currentTarget.querySelector("svg");
                  if (svg) svg.style.color = "#2563eb";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive && !isNavigating) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#6b7280";
                  const svg = e.currentTarget.querySelector("svg");
                  if (svg) svg.style.color = "#6b7280";
                }
              }}
            >
              {isNavigatingThis ? (
                <Loader2 size={18} style={{ color: isActive ? "#2563eb" : "#6b7280", flexShrink: 0, animation: "spin 1s linear infinite" }} />
              ) : (
                <Icon size={18} style={{ color: isActive ? "#2563eb" : "#6b7280", flexShrink: 0, transition: "color 150ms" }} />
              )}
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Only rendered once a session exists. The sidebar is confined to the
          (app) route group, so there is always a user by the time it settles —
          this still guards the first paint, before the session check returns. */}
      {user && (
        <div style={{ borderTop: "1px solid #e5e7eb", padding: "12px 12px 16px" }}>
          <div
            title={user.email}
            style={{
              fontSize: 12,
              color: "#6b7280",
              padding: "0 4px 8px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user.email}
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              backgroundColor: "#ffffff",
              fontSize: 14,
              color: "#6b7280",
              cursor: signingOut ? "default" : "pointer",
              opacity: signingOut ? 0.6 : 1,
              transition: "background-color 150ms, color 150ms",
            }}
            onMouseEnter={(e) => {
              if (!signingOut) {
                e.currentTarget.style.backgroundColor = "#fef2f2";
                e.currentTarget.style.color = "#dc2626";
              }
            }}
            onMouseLeave={(e) => {
              if (!signingOut) {
                e.currentTarget.style.backgroundColor = "#ffffff";
                e.currentTarget.style.color = "#6b7280";
              }
            }}
          >
            {signingOut ? (
              <Loader2 size={16} style={{ flexShrink: 0, animation: "spin 1s linear infinite" }} />
            ) : (
              <LogOut size={16} style={{ flexShrink: 0 }} />
            )}
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}} />
    </aside>
  );
}