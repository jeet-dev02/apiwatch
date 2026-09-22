"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Check, AlertTriangle, ArrowRight } from "lucide-react";

import { api, ApiResponse, UnauthorizedError } from "@/lib/api";
import { Endpoint } from "@/context/ProjectContext";
import {
  DEFAULT_INTERVAL_MINUTES,
  INTERVAL_CHOICES,
  Schedule,
  formatDateTime,
  intervalLabel,
  normaliseSchedule,
  relativeTime,
} from "@/lib/schedule";

interface ScheduleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  schedule: Schedule | null;
  isLoading: boolean;
  loadError: string | null;
  /** Called with what PUT answered, so the header and this drawer agree. */
  onSaved: (schedule: Schedule) => void;
  /** Selects an endpoint in the list behind the drawer. */
  onSelectEndpoint: (endpointId: string) => void;
  /** To name the endpoint a warning's "Open" link goes to. */
  endpoints: Endpoint[];
}

const methodColors = (method: string) => {
  switch (method) {
    case "GET": return { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" };
    case "POST": return { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" };
    case "DELETE": return { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" };
    case "PUT": return { bg: "#fffbeb", text: "#d97706", border: "#fde68a" };
    default: return { bg: "#f3f4f6", text: "#4b5563", border: "#d1d5db" };
  }
};

const sectionHeading = { fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" as const, letterSpacing: "0.05em", margin: "0 0 12px 0" };

export default function ScheduleDrawer({
  isOpen,
  onClose,
  projectId,
  projectName,
  schedule,
  isLoading,
  loadError,
  onSaved,
  onSelectEndpoint,
  endpoints,
}: ScheduleDrawerProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");

  // "in 42 min" goes stale while the drawer sits open; a minute is its resolution.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!isOpen) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, [isOpen, schedule]);

  useEffect(() => {
    if (isOpen) setSaveError(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const enabled = schedule?.enabled ?? false;
  const intervalMinutes = schedule?.intervalMinutes ?? DEFAULT_INTERVAL_MINUTES;
  // A schedule set some other way, 90 minutes say, is shown as it is rather
  // than snapped to the nearest choice, which a save would then write.
  const choices = INTERVAL_CHOICES.includes(intervalMinutes)
    ? INTERVAL_CHOICES
    : [...INTERVAL_CHOICES, intervalMinutes].sort((a, b) => a - b);

  // Both controls save as soon as they change, as the endpoint switches in the
  // list do. PUT takes both fields every time.
  const save = async (next: { enabled: boolean; intervalMinutes: number }) => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const json = await api.put<ApiResponse<unknown>>(`/projects/${projectId}/schedule`, next);
      onSaved(normaliseSchedule(json.data));
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch (error) {
      if (!(error instanceof UnauthorizedError)) setSaveError((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const coverage = schedule?.coverage;
  const warnings = schedule?.warnings ?? [];
  const nothingToRun = !!coverage && coverage.total > 0 && coverage.scheduled === 0;

  const nextRunText = (() => {
    if (!enabled) return "Off";
    if (!schedule?.nextRunAt) return "Not set";
    // Turning a schedule on makes it due at once; the scheduler looks every minute.
    if (new Date(schedule.nextRunAt).getTime() <= now) return "Due now: starts within a minute";
    return `${formatDateTime(schedule.nextRunAt)} (${relativeTime(schedule.nextRunAt, now)})`;
  })();

  const lastRunText = schedule?.lastRunAt
    ? `${formatDateTime(schedule.lastRunAt)} (${relativeTime(schedule.lastRunAt, now)})`
    : "Never";

  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0, 0, 0, 0.4)", backdropFilter: "blur(4px)", zIndex: 100 }}
        onClick={onClose}
      />

      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "100%", maxWidth: 520, backgroundColor: "#ffffff", boxShadow: "-4px 0 24px rgba(0, 0, 0, 0.1)", zIndex: 101, display: "flex", flexDirection: "column", animation: "slideIn 0.3s forwards" }}>

        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>Scheduled runs</h2>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6b7280" }}>
              {projectName} · runs the suite on its own
            </p>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#9ca3af", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f3f4f6"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {isLoading && !schedule ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: 40, color: "#9ca3af", fontSize: 14 }}>
              <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Loading schedule...
            </div>
          ) : loadError || !schedule ? (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: 16, backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#b91c1c", fontSize: 13, lineHeight: 1.5 }}>
              <AlertTriangle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <strong style={{ display: "block", marginBottom: 2 }}>Could not load this project&apos;s schedule</strong>
                {loadError ?? "The server sent nothing to show."}
              </div>
            </div>
          ) : (
            <>
              {/* ── Schedule ────────────────────────────────────────────── */}
              <div style={{ marginBottom: 32 }}>
                <h3 style={sectionHeading}>Schedule</h3>

                <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: 16 }}>
                    <button
                      role="switch"
                      aria-checked={enabled}
                      aria-label="Run this project on a schedule"
                      disabled={isSaving}
                      onClick={() => save({ enabled: !enabled, intervalMinutes })}
                      style={{ flexShrink: 0, position: "relative", width: 40, height: 22, marginTop: 1, borderRadius: 11, border: "none", padding: 0, backgroundColor: enabled ? "#2563eb" : "#d1d5db", cursor: isSaving ? "wait" : "pointer", transition: "background 0.2s", opacity: isSaving ? 0.6 : 1 }}
                    >
                      <span style={{ position: "absolute", top: 3, left: enabled ? 21 : 3, width: 16, height: 16, borderRadius: "50%", backgroundColor: "#ffffff", boxShadow: "0 1px 2px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                        {enabled ? "Runs on a schedule" : "Not scheduled"}
                      </div>
                      <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2, lineHeight: 1.5 }}>
                        {enabled
                          ? "A scheduled run calls only the endpoints switched on in the list. Running the suite by hand still calls all of them."
                          : "Turn it on and the first scheduled run starts within a minute, then at the interval below."}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderTop: "1px solid #f3f4f6", backgroundColor: "#fafafa" }}>
                    <label htmlFor="schedule-interval" style={{ fontSize: 13, fontWeight: 500, color: "#374151", width: 120 }}>How often</label>
                    <select
                      id="schedule-interval"
                      value={intervalMinutes}
                      disabled={isSaving}
                      onChange={(e) => save({ enabled, intervalMinutes: Number(e.target.value) })}
                      style={{ flex: 1, padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, backgroundColor: "#ffffff", outline: "none", cursor: isSaving ? "wait" : "pointer" }}
                    >
                      {choices.map((minutes) => (
                        <option key={minutes} value={minutes}>{intervalLabel(minutes)}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px 16px", borderTop: "1px solid #f3f4f6", fontSize: 13 }}>
                    <div style={{ display: "flex", gap: 12 }}>
                      <span style={{ width: 120, color: "#6b7280", flexShrink: 0 }}>Last scheduled run</span>
                      <span style={{ color: "#111827", fontWeight: 500 }}>{lastRunText}</span>
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                      <span style={{ width: 120, color: "#6b7280", flexShrink: 0 }}>Next run</span>
                      <span style={{ color: enabled ? "#111827" : "#9ca3af", fontWeight: 500 }}>{nextRunText}</span>
                    </div>
                  </div>
                </div>

                {(isSaving || saveError || saveStatus === "saved") && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 10, fontSize: 12, lineHeight: 1.4, color: saveError ? "#b91c1c" : isSaving ? "#6b7280" : "#16a34a" }}>
                    {saveError ? (
                      <><AlertTriangle size={13} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} /> Not saved: {saveError}</>
                    ) : isSaving ? (
                      <><Loader2 size={13} style={{ animation: "spin 1s linear infinite", flexShrink: 0, marginTop: 1 }} /> Saving...</>
                    ) : (
                      <><Check size={13} style={{ flexShrink: 0, marginTop: 1 }} /> Saved.</>
                    )}
                  </div>
                )}
              </div>

              {/* ── Coverage ────────────────────────────────────────────── */}
              <div style={{ marginBottom: 32 }}>
                <h3 style={sectionHeading}>Coverage</h3>

                {coverage && coverage.total === 0 ? (
                  <div style={{ padding: "12px 16px", backgroundColor: "#f9fafb", border: "1px dashed #d1d5db", borderRadius: 8, color: "#6b7280", fontSize: 13 }}>
                    This project has no endpoints yet, so a scheduled run would have nothing to call.
                  </div>
                ) : coverage && (
                  <>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
                      {coverage.scheduled} of {coverage.total} endpoint{coverage.total === 1 ? "" : "s"} run on schedule
                    </div>
                    {(coverage.notScheduled > 0 || coverage.blockedByChain > 0) && (
                      <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 13, color: "#4b5563", lineHeight: 1.6 }}>
                        {coverage.notScheduled > 0 && (
                          <li>{coverage.notScheduled} switched off in the endpoint list</li>
                        )}
                        {coverage.blockedByChain > 0 && (
                          <li>{coverage.blockedByChain} switched on, but left out because of a chain (see below)</li>
                        )}
                      </ul>
                    )}
                    {nothingToRun && enabled && (
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 12, padding: "10px 12px", backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, color: "#92400e", fontSize: 13, lineHeight: 1.5 }}>
                        <AlertTriangle size={15} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
                        The schedule is on, but it has nothing to call, so no scheduled run will start.
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* ── Warnings ────────────────────────────────────────────── */}
              <div>
                <h3 style={{ ...sectionHeading, display: "flex", alignItems: "center", gap: 8, color: warnings.length > 0 ? "#b45309" : "#6b7280" }}>
                  {warnings.length > 0 && <AlertTriangle size={14} color="#d97706" />}
                  {warnings.length > 0 ? `${warnings.length} warning${warnings.length === 1 ? "" : "s"}` : "Warnings"}
                </h3>

                {warnings.length === 0 ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, color: "#15803d", fontSize: 13 }}>
                    <Check size={15} />
                    None. Nothing switched on depends on an endpoint that is switched off or runs after it.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {warnings.map((warning, index) => {
                      const endpoint = warning.endpointId ? endpoints.find((ep) => ep.id === warning.endpointId) : undefined;
                      const colors = endpoint ? methodColors(endpoint.method) : null;
                      return (
                        <div key={`${warning.endpointId}-${index}`} style={{ border: "1px solid #fde68a", backgroundColor: "#fffbeb", borderRadius: 8, padding: "12px 14px" }}>
                          <div style={{ fontSize: 13, color: "#78350f", lineHeight: 1.5 }}>{warning.message}</div>
                          {endpoint && colors && (
                            <button
                              onClick={() => { onSelectEndpoint(endpoint.id); onClose(); }}
                              title="Open this endpoint"
                              style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 8px", backgroundColor: "#ffffff", border: "1px solid #fde68a", borderRadius: 6, cursor: "pointer", transition: "background 0.15s" }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fef3c7"}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#ffffff"}
                            >
                              <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4, backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
                                {endpoint.method}
                              </span>
                              <span style={{ fontSize: 12, fontFamily: "monospace", color: "#374151" }}>{endpoint.path}</span>
                              <ArrowRight size={12} color="#92400e" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <p style={{ margin: "16px 0 0", fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>
                  Switch endpoints in or out of scheduled runs in the endpoint list. POST and DELETE start out switched off:
                  on a schedule nobody is watching, one creates a record every run and the other deletes one. The list is in
                  run order, top first; move an endpoint with its arrows.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
    </>
  );
}
