"use client";

import { useEffect, useRef, useState } from "react";
import { X, Plus, Trash2, Loader2, Check, AlertTriangle, ChevronRight, ChevronDown } from "lucide-react";

import { api, ApiResponse, UnauthorizedError } from "@/lib/api";
import {
  Environment,
  MAX_KEYS,
  MAX_VALUE_BYTES,
  byteLength,
  siteLabel,
  unresolved,
  usageSummary,
} from "@/lib/environment";

interface EnvironmentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  environment: Environment;
  isLoading: boolean;
  loadError: string | null;
  /** Re-reads /environment so the header badge and this list agree after a save. */
  onSaved: () => void;
  /** Selects an endpoint in the list behind the drawer. */
  onSelectEndpoint: (endpointId: string) => void;
}

interface Row {
  rowId: string;
  key: string;
  value: string;
}

let rowSeq = 0;
const nextRowId = () => `row-${rowSeq++}`;

const KEY_RE = /^[A-Za-z0-9_.-]+$/;

const methodColors = (method: string) => {
  switch (method) {
    case "GET": return { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" };
    case "POST": return { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" };
    case "DELETE": return { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" };
    case "PUT": return { bg: "#fffbeb", text: "#d97706", border: "#fde68a" };
    default: return { bg: "#f3f4f6", text: "#4b5563", border: "#d1d5db" };
  }
};

export default function EnvironmentDrawer({
  isOpen,
  onClose,
  projectId,
  projectName,
  environment,
  isLoading,
  loadError,
  onSaved,
  onSelectEndpoint,
}: EnvironmentDrawerProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");

  const focusRef = useRef<string | null>(null);

  // The server copy the draft is diffed against when building the merge patch.
  const saved = environment.variables;

  // Reload the draft whenever the drawer opens, or when a save brings back a
  // fresh copy — but never while it is open and untouched-by-the-server, or a
  // background refetch would wipe what is being typed.
  useEffect(() => {
    if (!isOpen) return;
    setRows(Object.entries(saved).map(([key, value]) => ({ rowId: nextRowId(), key, value })));
    setSaveError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, saved]);

  const trimmedRows = rows.map((row) => ({ ...row, key: row.key.trim() }));
  const named = trimmedRows.filter((row) => row.key !== "");

  const problems = (() => {
    const list: string[] = [];

    const unnamed = trimmedRows.find((row) => row.key === "" && row.value !== "");
    if (unnamed) list.push("Every value needs a name.");

    const badKey = named.find((row) => !KEY_RE.test(row.key));
    if (badKey) {
      list.push(
        `"${badKey.key}" cannot be used as a name — a {{placeholder}} can only contain letters, numbers, dots, dashes and underscores.`
      );
    }

    const seen = new Set<string>();
    for (const row of named) {
      if (seen.has(row.key)) {
        list.push(`"${row.key}" is listed twice.`);
        break;
      }
      seen.add(row.key);
    }

    const oversized = named.find((row) => byteLength(row.value) > MAX_VALUE_BYTES);
    if (oversized) list.push(`"${oversized.key}" is over the 8KB limit for a value.`);

    if (named.length > MAX_KEYS) list.push(`A project can hold ${MAX_KEYS} variables; this is ${named.length}.`);

    return list;
  })();

  /** Only what actually changed: merge semantics mean untouched keys stay put. */
  const patch = (() => {
    const next: Record<string, string | null> = {};

    for (const row of named) {
      if (!Object.prototype.hasOwnProperty.call(saved, row.key) || saved[row.key] !== row.value) {
        next[row.key] = row.value;
      }
    }

    // A key that was dropped from the draft — including one renamed, which is
    // a delete of the old name plus a set of the new.
    for (const key of Object.keys(saved)) {
      if (!named.some((row) => row.key === key)) next[key] = null;
    }

    return next;
  })();

  const isDirty = Object.keys(patch).length > 0;
  const missing = unresolved(environment);
  const hasData = environment.placeholders.length > 0 || Object.keys(saved).length > 0;

  const handleClose = () => {
    if (isDirty && !window.confirm("Discard the unsaved changes to these variables?")) return;
    onClose();
  };

  const addRow = (key = "") => {
    const existing = rows.find((row) => row.key.trim() === key && key !== "");
    if (existing) {
      focusRef.current = existing.rowId;
      document.getElementById(`env-value-${existing.rowId}`)?.focus();
      return;
    }

    const row = { rowId: nextRowId(), key, value: "" };
    focusRef.current = row.rowId;
    setRows((prev) => [...prev, row]);
  };

  // Focus whatever row was just added, and scroll it into view — "Set value"
  // on an unresolved placeholder adds a row far below the fold.
  useEffect(() => {
    if (!focusRef.current) return;
    const id = focusRef.current;
    focusRef.current = null;
    const input = document.getElementById(`env-value-${id}`);
    input?.focus();
    input?.scrollIntoView({ block: "center" });
  }, [rows]);

  const updateRow = (rowId: string, field: "key" | "value", value: string) => {
    setRows((prev) => prev.map((row) => (row.rowId === rowId ? { ...row, [field]: value } : row)));
  };

  const removeRow = (rowId: string) => setRows((prev) => prev.filter((row) => row.rowId !== rowId));

  const handleSave = async () => {
    if (problems.length > 0 || !isDirty || isSaving) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      await api.patch<ApiResponse<unknown>>(`/projects/${projectId}/environment`, { variables: patch });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
      onSaved();
    } catch (error) {
      if (!(error instanceof UnauthorizedError)) setSaveError((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggle = (name: string) =>
    setExpanded((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));

  if (!isOpen) return null;

  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0, 0, 0, 0.4)", backdropFilter: "blur(4px)", zIndex: 100 }}
        onClick={handleClose}
      />

      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "100%", maxWidth: 520, backgroundColor: "#ffffff", boxShadow: "-4px 0 24px rgba(0, 0, 0, 0.1)", zIndex: 101, display: "flex", flexDirection: "column", animation: "slideIn 0.3s forwards" }}>

        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>Environment</h2>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6b7280" }}>
              {projectName} · values that <code style={{ fontFamily: "monospace", fontSize: 12 }}>{"{{placeholders}}"}</code> resolve against
            </p>
          </div>
          <button onClick={handleClose} style={{ background: "transparent", border: "none", color: "#9ca3af", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f3f4f6"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>

          {/* Only the very first read blanks the body. A refetch after a save
              already has something to show, and flashing a spinner over it
              would read as the save having wiped the list. */}
          {isLoading && !hasData ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: 40, color: "#9ca3af", fontSize: 14 }}>
              <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Loading variables...
            </div>
          ) : loadError ? (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: 16, backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#b91c1c", fontSize: 13, lineHeight: 1.5 }}>
              <AlertTriangle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <strong style={{ display: "block", marginBottom: 2 }}>Could not load this project&apos;s environment</strong>
                {loadError}
              </div>
            </div>
          ) : (
            <>
              {/* ── Unresolved placeholders ─────────────────────────────── */}
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: missing.length > 0 ? "#b45309" : "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px 0" }}>
                  {missing.length > 0 && <AlertTriangle size={14} color="#d97706" />}
                  {missing.length > 0 ? `${missing.length} unresolved` : "Placeholders"}
                </h3>

                {missing.length === 0 ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, color: "#15803d", fontSize: 13 }}>
                    <Check size={15} />
                    {environment.placeholders.length === 0
                      ? "No endpoint in this project uses a placeholder."
                      : `Every placeholder in this project has a value (${environment.placeholders.length}).`}
                  </div>
                ) : (
                  <>
                    <p style={{ margin: "0 0 12px", fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>
                      These go out literally, exactly as written, which is usually what a confusing test failure turns out to be.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {missing.map((placeholder) => {
                        const isOpen = expanded.includes(placeholder.name);
                        return (
                          <div key={placeholder.name} style={{ border: "1px solid #fde68a", backgroundColor: "#fffbeb", borderRadius: 8, overflow: "hidden" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px" }}>
                              <button
                                onClick={() => toggle(placeholder.name)}
                                disabled={placeholder.usedBy.length === 0}
                                style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, background: "transparent", border: "none", padding: 0, textAlign: "left", cursor: placeholder.usedBy.length === 0 ? "default" : "pointer", minWidth: 0 }}
                              >
                                {placeholder.usedBy.length > 0
                                  ? (isOpen ? <ChevronDown size={14} color="#92400e" /> : <ChevronRight size={14} color="#92400e" />)
                                  : <span style={{ width: 14 }} />}
                                <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "#92400e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {`{{${placeholder.name}}}`}
                                </span>
                                <span style={{ fontSize: 12, color: "#b45309", whiteSpace: "nowrap" }}>
                                  {usageSummary(placeholder.usedBy.length)} · not set
                                </span>
                              </button>

                              <button
                                onClick={() => addRow(placeholder.name)}
                                style={{ flexShrink: 0, padding: "4px 10px", fontSize: 12, fontWeight: 600, color: "#92400e", backgroundColor: "#ffffff", border: "1px solid #fde68a", borderRadius: 6, cursor: "pointer", transition: "background 0.2s" }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fef3c7"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#ffffff"}
                              >
                                Set value
                              </button>
                            </div>

                            {isOpen && placeholder.usedBy.length > 0 && (
                              <div style={{ borderTop: "1px solid #fde68a", backgroundColor: "#ffffff", padding: "8px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
                                {placeholder.usedBy.map((usage, index) => {
                                  const colors = methodColors(usage.method);
                                  return (
                                    <button
                                      key={`${usage.id}-${usage.where}-${index}`}
                                      onClick={() => { onSelectEndpoint(usage.id); onClose(); }}
                                      title="Open this endpoint"
                                      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "6px 8px", background: "transparent", border: "none", borderRadius: 6, cursor: "pointer", textAlign: "left", transition: "background 0.15s" }}
                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"}
                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                    >
                                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, width: 44, textAlign: "center", flexShrink: 0 }}>
                                        {usage.method}
                                      </span>
                                      <span style={{ fontSize: 12, fontFamily: "monospace", color: "#374151", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {usage.path}
                                      </span>
                                      <span style={{ fontSize: 11, color: "#9ca3af", flexShrink: 0 }}>{siteLabel(usage)}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* ── Variables ───────────────────────────────────────────── */}
              <h3 style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px 0" }}>
                Variables ({named.length})
              </h3>

              {rows.length === 0 ? (
                <div style={{ padding: "16px", backgroundColor: "#f9fafb", border: "1px dashed #d1d5db", borderRadius: 8, color: "#6b7280", fontSize: 13, lineHeight: 1.5 }}>
                  Nothing set yet. A variable named <code style={{ fontFamily: "monospace" }}>petId</code> fills every{" "}
                  <code style={{ fontFamily: "monospace" }}>{"{{petId}}"}</code> in this project&apos;s URLs, bodies and headers.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {rows.map((row) => {
                    const key = row.key.trim();
                    const isNew = key !== "" && !Object.prototype.hasOwnProperty.call(saved, key);
                    const oversized = byteLength(row.value) > MAX_VALUE_BYTES;

                    return (
                      <div key={row.rowId} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input
                          type="text"
                          value={row.key}
                          onChange={(e) => updateRow(row.rowId, "key", e.target.value)}
                          placeholder="name"
                          spellCheck={false}
                          style={{ width: 150, padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, fontFamily: "monospace", outline: "none", boxSizing: "border-box", backgroundColor: isNew ? "#f0fdf4" : "#ffffff" }}
                        />
                        <input
                          id={`env-value-${row.rowId}`}
                          type="text"
                          value={row.value}
                          onChange={(e) => updateRow(row.rowId, "value", e.target.value)}
                          // Values are deliberately never masked: seeing that a
                          // script stored the string "undefined" is the point.
                          placeholder="(empty string)"
                          spellCheck={false}
                          style={{ flex: 1, minWidth: 0, padding: "8px 10px", borderRadius: 6, border: `1px solid ${oversized ? "#ef4444" : "#d1d5db"}`, fontSize: 13, fontFamily: "monospace", outline: "none", boxSizing: "border-box", backgroundColor: oversized ? "#fef2f2" : "#ffffff" }}
                        />
                        <button
                          onClick={() => removeRow(row.rowId)}
                          title="Delete this variable"
                          style={{ flexShrink: 0, padding: "0 10px", height: 34, backgroundColor: "transparent", border: "1px solid #d1d5db", borderRadius: 6, color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", transition: "background 0.2s" }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fee2e2"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                onClick={() => addRow()}
                style={{ marginTop: 12, padding: "8px 12px", fontSize: 13, fontWeight: 500, color: "#4b5563", backgroundColor: "#ffffff", border: "1px solid #d1d5db", borderRadius: 6, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, transition: "background 0.2s" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#ffffff"}
              >
                <Plus size={14} /> Add variable
              </button>
            </>
          )}
        </div>

        {(!isLoading || hasData) && !loadError && (
          <div style={{ padding: "16px 24px", borderTop: "1px solid #e5e7eb", backgroundColor: "#fafafa" }}>
            {problems.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                {problems.map((problem) => (
                  <div key={problem} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 12, color: "#b91c1c", lineHeight: 1.4 }}>
                    <AlertTriangle size={13} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} /> {problem}
                  </div>
                ))}
              </div>
            )}

            {saveError && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 12, color: "#b91c1c", marginBottom: 12, lineHeight: 1.4 }}>
                <AlertTriangle size={13} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} /> {saveError}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ flex: 1, fontSize: 12, color: saveStatus === "saved" && !isDirty ? "#16a34a" : "#9ca3af" }}>
                {saveStatus === "saved" && !isDirty
                  ? "Saved."
                  : isDirty
                    ? `${Object.keys(patch).length} change${Object.keys(patch).length === 1 ? "" : "s"} to save`
                    : "No changes"}
              </span>
              <button
                onClick={handleSave}
                disabled={!isDirty || problems.length > 0 || isSaving}
                style={{ padding: "10px 20px", fontSize: 14, fontWeight: 600, color: "#ffffff", backgroundColor: (!isDirty || problems.length > 0) ? "#9ca3af" : "#2563eb", border: "none", borderRadius: 8, cursor: (!isDirty || problems.length > 0 || isSaving) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, transition: "background 0.2s", opacity: isSaving ? 0.7 : 1 }}
              >
                {isSaving ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Saving...</> : "Save variables"}
              </button>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
    </>
  );
}
