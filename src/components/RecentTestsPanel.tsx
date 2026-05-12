import { RecentTest } from "@/data/mock-data";

interface RecentTestsPanelProps {
  tests: RecentTest[];
}

/* ── HTTP method badge colors (from DESIGN_BRIEF.md) ──────────────────── */
const methodStyles: Record<
  RecentTest["method"],
  { background: string; color: string }
> = {
  GET:    { background: "#dbeafe", color: "#1d4ed8" },
  POST:   { background: "#dcfce7", color: "#15803d" },
  PUT:    { background: "#fef9c3", color: "#a16207" },
  DELETE: { background: "#fee2e2", color: "#b91c1c" },
};

/* ── Status code colors (from DESIGN_BRIEF.md) ────────────────────────── */
function statusCodeColor(code: number): string {
  if (code >= 200 && code < 300) return "#16a34a";
  if (code >= 400 && code < 500) return "#d97706";
  return "#dc2626";
}

export default function RecentTestsPanel({ tests }: RecentTestsPanelProps) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 20,
      }}
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
          Recent API Tests
        </span>
        <button
          style={{
            fontSize: 12,
            color: "#6b7280",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            background: "transparent",
            padding: "4px 10px",
            cursor: "pointer",
          }}
        >
          View all
        </button>
      </div>

      {/* ── Test rows ───────────────────────────────────────── */}
      <div
        style={{
          marginTop: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {tests.map((test) => {
          const badge = methodStyles[test.method];

          return (
            <div
              key={test.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              {/* Method badge */}
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 4,
                  backgroundColor: badge.background,
                  color: badge.color,
                  flexShrink: 0,
                  minWidth: 52,
                  textAlign: "center",
                }}
              >
                {test.method}
              </span>

              {/* Endpoint */}
              <span
                style={{
                  fontSize: 14,
                  color: "#111827",
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {test.endpoint}
              </span>

              {/* Status code */}
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: statusCodeColor(test.statusCode),
                  flexShrink: 0,
                }}
              >
                {test.statusCode}
              </span>

              {/* Time ago */}
              <span
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  flexShrink: 0,
                  minWidth: 56,
                  textAlign: "right",
                }}
              >
                {test.timeAgo}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
