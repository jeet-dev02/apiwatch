"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  FolderOpen,
  Bell,
  FileText,
  Settings,
  ChevronDown,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Overview",    href: "/" },
  { icon: FolderOpen,      label: "Projects",    href: "/projects" },
  { icon: Bell,            label: "Alerts",      href: "/alerts" },
  { icon: FileText,        label: "Reports",     href: "/reports" },
  { icon: Settings,        label: "Settings",    href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

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
      }}
    >
      <div
        style={{
          padding: "20px 16px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Shield size={22} color="#2563eb" strokeWidth={2.2} />
        <span
          style={{
            fontWeight: 700,
            fontSize: 18,
            color: "#111827",
            letterSpacing: "-0.01em",
          }}
        >
          APIWatch
        </span>
      </div>

      <nav style={{ flex: 1, paddingTop: 8, overflowY: "auto" }}>
        {navItems.map(({ icon: Icon, label, href }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={href}
              href={href}
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
                transition: "background-color 150ms, color 150ms",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "#eff6ff";
                  e.currentTarget.style.color = "#2563eb";
                  const svg = e.currentTarget.querySelector("svg");
                  if (svg) svg.style.color = "#2563eb";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#6b7280";
                  const svg = e.currentTarget.querySelector("svg");
                  if (svg) svg.style.color = "#6b7280";
                }
              }}
            >
              <Icon
                size={18}
                style={{
                  color: isActive ? "#2563eb" : "#6b7280",
                  flexShrink: 0,
                  transition: "color 150ms",
                }}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <div
        style={{
          borderTop: "1px solid #e5e7eb",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            backgroundColor: "#6b7280",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ color: "#ffffff", fontSize: 12, fontWeight: 600 }}>AD</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#111827", lineHeight: 1.3 }}>Admin</div>
          <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>admin@apiwatch.com</div>
        </div>
        <ChevronDown size={16} color="#6b7280" style={{ flexShrink: 0 }} />
      </div>
    </aside>
  );
}