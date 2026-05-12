import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  trendText: string;
  trendDirection: "up" | "down" | "neutral";
  icon: ReactNode;
}

const trendColors: Record<StatCardProps["trendDirection"], string> = {
  up: "#16a34a",
  down: "#dc2626",
  neutral: "#6b7280",
};

export default function StatCard({
  title,
  value,
  trendText,
  trendDirection,
  icon,
}: StatCardProps) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 20,
      }}
    >
      {/* Top row — title + icon */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "#6b7280",
          }}
        >
          {title}
        </span>
        {icon}
      </div>

      {/* Middle row — value */}
      <div
        style={{
          fontSize: 28,
          fontWeight: 600,
          color: "#111827",
          marginTop: 12,
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>

      {/* Bottom row — trend */}
      <div
        style={{
          fontSize: 12,
          color: trendColors[trendDirection],
          marginTop: 8,
        }}
      >
        {trendText}
      </div>
    </div>
  );
}
