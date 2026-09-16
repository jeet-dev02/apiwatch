"use client";

import type { HttpMethod } from "@/context/ProjectContext";

/* ── HTTP method badge colors (from DESIGN_BRIEF.md) ──────────────────── */
const methodColors: Record<HttpMethod, { backgroundColor: string; color: string }> = {
  GET:    { backgroundColor: "#dbeafe", color: "#1d4ed8" },
  POST:   { backgroundColor: "#dcfce7", color: "#15803d" },
  PUT:    { backgroundColor: "#fef9c3", color: "#a16207" },
  DELETE: { backgroundColor: "#fee2e2", color: "#b91c1c" },
};

const unknownMethod = { backgroundColor: "#f3f4f6", color: "#4b5563" };

/**
 * The method of the endpoint an alert was raised for, shown beside its path:
 * two endpoints can share one path, so the path alone no longer names an
 * endpoint. Renders nothing for an alert with no endpoint to take a method
 * from — see lib/incidents.ts.
 */
export default function MethodBadge({ method, muted = false }: { method: HttpMethod | null; muted?: boolean }) {
  if (!method) return null;
  const colors = methodColors[method] ?? unknownMethod;

  return (
    <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "monospace", padding: "1px 5px", borderRadius: 4, marginRight: 6, opacity: muted ? 0.6 : 1, ...colors }}>
      {method}
    </span>
  );
}
