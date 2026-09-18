"use client";

import { useEffect, useRef, useState } from "react";
import { X, Plus, Trash2, Loader2, Check, AlertTriangle, ChevronRight, ChevronDown } from "lucide-react";

import { api, ApiResponse, UnauthorizedError } from "@/lib/api";
import {
  Environment,
  EnvironmentPatch,
  MAX_KEYS_PER_REQUEST,
  MAX_KEY_LENGTH,
  MAX_SET_CHARS,
  MAX_VALUE_CHARS,
  displayValue,
  isEmptyPatch,
  parseValue,
  patchSize,
  serialisedLength,
  unresolved,
  usageSummary,
  usedNames,
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
  /** What is in the input. Seeded from displayValue of the stored value. */
  text: string;
  /** The stored value this row was seeded from, for type-preserving edits. */
  originalValue: unknown;
}

let rowSeq = 0;
const nextRowId = () => `row-${rowSeq++}`;

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
    setRows(
      saved.map((variable) => ({
        rowId: nextRowId(),
        key: variable.key,
        text: displayValue(variable.value),
        originalValue: variable.value,
      }))
    );
    setSaveError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, saved]);

  // Keys are NOT trimmed. The backend's placeholder pattern does not trim
  // either, so `{{ petId }}` genuinely needs a key named " petId " — trimming
  // here would make that name impossible to set from this screen.
  const named = rows.filter((row) => row.key !== "");

  /** Only what actually changed: PATCH merges, so untouched keys stay put. */
  const patch: EnvironmentPatch = (() => {
    const set: Record<string, unknown> = {};

    for (const row of named) {
      const value = parseValue(row.text, row.originalValue);
      const existing = saved.find((variable) => variable.key === row.key);

      // Compared as JSON text: the value may be an object, and this is the
      // same comparison the backend's diffEnvironment makes.
      if (!existing || JSON.stringify(existing.value) !== JSON.stringify(value)) {
        set[row.key] = value;
      }
    }

    // A key dropped from the draft — including one renamed, which is a remove
    // of the old name plus a set of the new.
    const remove = saved
      .map((variable) => variable.key)
      .filter((key) => !named.some((row) => row.key === key));

    return { set, remove };
  })();

  const problems = (() => {
    const list: string[] = [];

    if (rows.some((row) => row.key === "" && row.text !== "")) {
      list.push("Every value needs a name.");
    }

    const longKey = named.find((row) => row.key.length > MAX_KEY_LENGTH);
    if (longKey) list.push(`A name can be ${MAX_KEY_LENGTH} characters; "${longKey.key.slice(0, 40)}…" is longer.`);

    const seen = new Set<string>();
    for (const row of named) {
      if (seen.has(row.key)) {
        list.push(`"${row.key}" is listed twice.`);
        break;
      }
      seen.add(row.key);
    }

    const oversized = Object.entries(patch.set).find(
      ([, value]) => serialisedLength(value) > MAX_VALUE_CHARS
    );
    if (oversized) {
      list.push(`"${oversized[0]}" is over the ${MAX_VALUE_CHARS.toLocaleString()} character limit for a value.`);
    }

    if (Object.keys(patch.set).length > MAX_KEYS_PER_REQUEST) {
      list.push(`At most ${MAX_KEYS_PER_REQUEST} values can be saved at once; this is ${Object.keys(patch.set).length}.`);
    }

    if (patch.remove.length > MAX_KEYS_PER_REQUEST) {
      list.push(`At most ${MAX_KEYS_PER_REQUEST} values can be removed at once; this is ${patch.remove.length}.`);
    }

    if (JSON.stringify(patch.set).length > MAX_SET_CHARS) {
      list.push(`These values come to more than ${MAX_SET_CHARS.toLocaleString()} characters in total.`);
    }

    return list;
  })();

  const isDirty = !isEmptyPatch(patch);
  const missing = unresolved(environment);
  const referenced = usedNames(environment);
  const hasData = environment.endpoints.length > 0 || saved.length > 0;

  const handleClose = () => {
    if (isDirty && !window.confirm("Discard the unsaved changes to these variables?")) return;
    onClose();
  };

  const addRow = (key = "") => {
    const existing = rows.find((row) => row.key === key && key !== "");
    if (existing) {
      focusRef.current = existing.rowId;
      document.getElementById(`env-value-${existing.rowId}`)?.focus();
      return;
    }

    // A brand-new row has no stored value behind it, so its text is taken as
    // the string it looks like rather than parsed as JSON.
    const row = { rowId: nextRowId(), key, text: "", originalValue: "" };
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

  const updateRow = (rowId: string, field: "key" | "text", value: string) => {
    setRows((prev) => prev.map((row) => (row.rowId === rowId ? { ...row, [field]: value } : row)));
  };

  const removeRow = (rowId: string) => setRows((prev) => prev.filter((row) => row.rowId !== rowId));

  const handleSave = async () => {
    if (problems.length > 0 || !isDirty || isSaving) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      // `set` merges and `remove` drops — the two keys the route reads. A body
      // it does not recognise parses to neither, and the route answers 400
      // "Provide at least one key to set or remove".
      await api.patch<ApiResponse<unknown>>(`/projects/${projectId}/environment`, {
        set: patch.set,
        remove: patch.remove,
      });
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
                    {referenced.length === 0
                      ? "No endpoint in this project uses a placeholder."
                      : `Every placeholder in this project has a value (${referenced.length}).`}
                  </div>
                ) : (
                  <>
                    <p style={{ margin: "0 0 12px", fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>
                      These go out literally, exactly as written, which is usually what a confusing test failure turns out to be.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {missing.map((placeholder) => {
                        const isExpanded = expanded.includes(placeholder.name);
                        return (
                          <div key={placeholder.name} style={{ border: "1px solid #fde68a", backgroundColor: "#fffbeb", borderRadius: 8, overflow: "hidden" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px" }}>
                              <button
                                onClick={() => toggle(placeholder.name)}
                                disabled={placeholder.usedBy.length === 0}
                                style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, background: "transparent", border: "none", padding: 0, textAlign: "left", cursor: placeholder.usedBy.length === 0 ? "default" : "pointer", minWidth: 0 }}
                              >
                                {placeholder.usedBy.length > 0
                                  ? (isExpanded ? <ChevronDown size={14} color="#92400e" /> : <ChevronRight size={14} color="#92400e" />)
                                  : <span style={{ width: 14 }} />}
                                <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "#92400e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {`{{${placeholder.name}}}`}
                                </span>
                                <span style={{ fontSize: 12, color: "#b45309", whiteSpace: "nowrap" }}>
                                  {usageSummary(placeholder.usedBy.length)}
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

                            {isExpanded && placeholder.usedBy.length > 0 && (
                              <div style={{ borderTop: "1px solid #fde68a", backgroundColor: "#ffffff", padding: "8px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
                                {placeholder.usedBy.map((endpoint) => {
                                  const colors = methodColors(endpoint.method);
                                  return (
                                    <button
                                      key={endpoint.id}
                                      onClick={() => { onSelectEndpoint(endpoint.id); onClose(); }}
                                      title="Open this endpoint"
                                      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "6px 8px", background: "transparent", border: "none", borderRadius: 6, cursor: "pointer", textAlign: "left", transition: "background 0.15s" }}
                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"}
                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                    >
                                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, width: 44, textAlign: "center", flexShrink: 0 }}>
                                        {endpoint.method}
                                      </span>
                                      <span style={{ fontSize: 12, fontFamily: "monospace", color: "#374151", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {endpoint.path}
                                      </span>
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
                    const isNew = row.key !== "" && !saved.some((variable) => variable.key === row.key);
                    const oversized =
                      serialisedLength(parseValue(row.text, row.originalValue)) > MAX_VALUE_CHARS;
                    // A value that is not a string round-trips as JSON text;
                    // saying so explains why it is showing braces or bare digits.
                    const isJson = typeof row.originalValue !== "string";

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
                          value={row.text}
                          onChange={(e) => updateRow(row.rowId, "text", e.target.value)}
                          // Values are deliberately never masked: seeing that a
                          // script stored the string "undefined" is the point.
                          placeholder="(empty string)"
                          title={isJson ? "Stored as JSON, not as text" : undefined}
                          spellCheck={false}
                          style={{ flex: 1, minWidth: 0, padding: "8px 10px", borderRadius: 6, border: `1px solid ${oversized ? "#ef4444" : "#d1d5db"}`, fontSize: 13, fontFamily: "monospace", outline: "none", boxSizing: "border-box", backgroundColor: oversized ? "#fef2f2" : isJson ? "#f5f3ff" : "#ffffff" }}
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
                    ? `${patchSize(patch)} change${patchSize(patch) === 1 ? "" : "s"} to save`
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
