import { Loader2 } from "lucide-react";

export default function PageSkeleton() {
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto", width: "100%", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}>
      {/* Header Skeleton */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ height: 28, width: 200, backgroundColor: "#e5e7eb", borderRadius: 6, marginBottom: 8 }} />
          <div style={{ height: 16, width: 150, backgroundColor: "#f3f4f6", borderRadius: 4 }} />
        </div>
        <div style={{ height: 40, width: 140, backgroundColor: "#e5e7eb", borderRadius: 8 }} />
      </div>

      {/* Stats Row Skeleton */}
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginBottom: 32 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ height: 110, backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20 }}>
            <div style={{ height: 16, width: 100, backgroundColor: "#e5e7eb", borderRadius: 4, marginBottom: 16 }} />
            <div style={{ height: 32, width: 60, backgroundColor: "#d1d5db", borderRadius: 6 }} />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div style={{ height: 400, width: "100%", backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={32} color="#9ca3af" style={{ animation: "spin 1s linear infinite" }} />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}