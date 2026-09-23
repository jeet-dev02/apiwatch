"use client";

import { X, FolderPlus, Link as LinkIcon, Loader2, FileJson, Globe, AlertCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useProjects, type ImportSource, type ProjectData } from "@/context/ProjectContext";
import { UnauthorizedError } from "@/lib/api";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Create a project, and optionally import its endpoints from a document: one
 * fetched from a URL, or one pasted in, for APIs whose docs never serve the
 * spec as a file (swagger-ui-express embeds it in swagger-ui-init.js).
 *
 * Creating and importing are two requests. If the import fails, the project
 * already exists, is already in the list, and the modal stays open on it with
 * the backend's reason: the paste is kept, the next attempt retries the import
 * into that same project, and closing leaves it as an empty project unless
 * "Delete project" is chosen. Nothing is deleted without being asked.
 */
export default function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const { createProject, importSwagger, removeProject } = useProjects();

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [documentText, setDocumentText] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  // Set once the project exists, so a retry imports into it instead of
  // creating another.
  const [created, setCreated] = useState<ProjectData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const baseUrlField = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setUrl("");
      setDocumentText("");
      setBaseUrl("");
      setCreated(null);
      setError(null);
      setIsSubmitting(false);
      setIsDeleting(false);
    }
  }, [isOpen]);

  // A paste that fails leaves the base URL field under the fold, below the
  // textarea, and it is the fix for the relative-server-URL refusal. Bring it
  // up next to the message rather than leave "give the API's base URL"
  // pointing at nothing visible.
  useEffect(() => {
    if (error) baseUrlField.current?.scrollIntoView({ block: "nearest" });
  }, [error]);

  if (!isOpen) return null;

  const busy = isSubmitting || isDeleting;
  const pasted = documentText.trim() !== "";
  const hasUrl = url.trim() !== "";

  // Exactly one source is sent; each input is disabled while the other has
  // something in it, so there is never a choice to make silently.
  const source: ImportSource | null = pasted
    ? { document: documentText }
    : hasUrl ? { swaggerUrl: url.trim() } : null;

  const close = () => {
    if (!busy) onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim() || busy) return;
    if (created && !source) return;
    setIsSubmitting(true);
    setError(null);

    let project = created;
    if (!project) {
      try {
        project = await createProject(name.trim());
        setCreated(project);
      } catch (e) {
        // A 401 is already on its way to /login.
        if (!(e instanceof UnauthorizedError)) setError((e as Error).message);
        setIsSubmitting(false);
        return;
      }
    }

    if (!source) {
      onClose();
      return;
    }

    try {
      // No baseUrlOverride for a URL. The backend reads where the endpoints
      // live from the document itself, and falls back to the URL it was
      // fetched from. This used to send that URL's origin, which beat the
      // document's own basePath and servers and dropped /v2 from every
      // petstore endpoint. A pasted document has no URL to fall back to, so a
      // relative or missing server URL can only be fixed by giving one.
      const override = pasted && baseUrl.trim() ? baseUrl.trim() : undefined;
      await importSwagger(project.id, source, override);
      onClose();
    } catch (e) {
      // Shown as the backend sent it. Which of not-JSON, not-a-spec, too big
      // or a relative server URL it was is what tells someone what to change.
      if (!(e instanceof UnauthorizedError)) setError((e as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!created || busy) return;
    setIsDeleting(true);
    const gone = await removeProject(created.id);
    setIsDeleting(false);
    if (gone) onClose();
    else setError(`Couldn't delete "${created.title}". It is still in your projects.`);
  };

  const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, outline: "none", boxSizing: "border-box" as const };
  const labelStyle = { fontSize: 13, fontWeight: 600, color: "#374151", display: "block" };
  const optionalTag = <span style={{ fontSize: 11, fontWeight: 500, color: "#9ca3af", backgroundColor: "#f3f4f6", padding: "2px 6px", borderRadius: 4 }}>Optional</span>;
  const hintStyle = { margin: "6px 0 0", fontSize: 12, color: "#6b7280" };

  const submitLabel = isSubmitting
    ? (source ? "Importing API..." : "Creating...")
    : created ? "Retry import" : "Create Project";
  const canSubmit = !!name.trim() && !busy && (!created || !!source);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      {/* A stray click outside must not throw away a spec someone dug out of
          a JS file by hand, or walk away from a failed import unseen. */}
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0, 0, 0, 0.4)", backdropFilter: "blur(4px)", cursor: busy ? "wait" : "pointer" }} onClick={() => !pasted && !created && close()} />

      <div style={{ position: "relative", width: "100%", maxWidth: 520, maxHeight: "calc(100vh - 48px)", backgroundColor: "#ffffff", borderRadius: 16, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", display: "flex", flexDirection: "column", animation: "scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)" }}>
        <style>{`@keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

        {/* Header */}
        <div style={{ padding: "24px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #bfdbfe" }}>
              <FolderPlus size={20} color="#2563eb" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>Create New Project</h2>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6b7280" }}>Set up a new workspace for your APIs.</p>
            </div>
          </div>
          <button onClick={close} aria-label="Close" style={{ background: "transparent", border: "none", color: "#9ca3af", cursor: busy ? "not-allowed" : "pointer", padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20, overflowY: "auto", flex: "1 1 auto", minHeight: 0 }}>

          <div>
            <label style={{ ...labelStyle, marginBottom: 8 }}>
              Project Name <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Payment Gateway" autoFocus disabled={busy || !!created} style={{ ...inputStyle, opacity: busy || created ? 0.6 : 1 }} />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={labelStyle}>API Documentation URL</label>
              {optionalTag}
            </div>
            <div style={{ position: "relative", opacity: busy || pasted ? 0.6 : 1 }}>
              <div style={{ position: "absolute", left: 12, top: 10, color: "#9ca3af" }}><LinkIcon size={16} /></div>
              <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} disabled={busy || pasted} placeholder="https://api.example.com/swagger.json" style={{ ...inputStyle, padding: "10px 12px 10px 36px" }} />
            </div>
            <p style={hintStyle}>
              {pasted ? "Clear the pasted document to import from a URL instead." : "If provided, we will automatically import your endpoints."}
            </p>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 6 }}>
                <FileJson size={14} color="#6b7280" /> Or paste the spec document
              </label>
              {optionalTag}
            </div>
            <textarea
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              disabled={busy || hasUrl}
              spellCheck={false}
              rows={6}
              placeholder={'{\n  "openapi": "3.0.0",\n  "paths": { ... }\n}'}
              style={{ ...inputStyle, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", fontSize: 12, resize: "vertical", minHeight: 96, opacity: busy || hasUrl ? 0.6 : 1 }}
            />
            <p style={hintStyle}>
              {hasUrl
                ? "Clear the URL to paste a document instead."
                : <>For docs that don&apos;t serve the spec as a file. With swagger-ui-express it is in <code>swagger-ui-init.js</code>: copy the object after <code>&quot;swaggerDoc&quot;:</code>. JSON, up to 2 MB.</>}
            </p>
          </div>

          {pasted && (
            <div ref={baseUrlField}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={labelStyle}>API Base URL</label>
                {optionalTag}
              </div>
              <div style={{ position: "relative", opacity: busy ? 0.6 : 1 }}>
                <div style={{ position: "absolute", left: 12, top: 10, color: "#9ca3af" }}><Globe size={16} /></div>
                <input type="text" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} disabled={busy} placeholder="https://api.example.com/v1" style={{ ...inputStyle, padding: "10px 12px 10px 36px" }} />
              </div>
              <p style={hintStyle}>Where the API itself is served. Needed when the document&apos;s server URL is relative (like <code>/api</code>) or it names none; a pasted document has no address to work that out from. Leave blank to use the document&apos;s own.</p>
            </div>
          )}

        </div>

        {/* Outside the scrolling body, so the reason is on screen however
            long the form above it gets. It is what the whole import is for. */}
        {(created || error) && (
          <div style={{ padding: "0 24px 16px", display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
            {created && (
              <p style={{ margin: 0, fontSize: 13, color: "#374151", backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px" }}>
                The project <strong>{created.title}</strong> was created, but nothing has been imported into it yet. Fix the document and retry, keep it empty, or delete it.
              </p>
            )}

            {error && (
              <div role="alert" style={{ display: "flex", gap: 8, alignItems: "flex-start", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 12px" }}>
                <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 13, color: "#991b1b", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{created ? "Import failed" : "Couldn't create the project"}</div>
                  {error}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: "16px 24px", backgroundColor: "#f9fafb", borderTop: "1px solid #e5e7eb", borderBottomLeftRadius: 16, borderBottomRightRadius: 16, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
          {created && (
            <button onClick={handleDelete} disabled={busy} style={{ marginRight: "auto", backgroundColor: "transparent", border: "none", color: "#dc2626", padding: "8px 0", fontSize: 14, fontWeight: 500, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.5 : 1, display: "flex", alignItems: "center", gap: 6 }}>
              {isDeleting && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />} Delete project
            </button>
          )}
          <button onClick={close} disabled={busy} style={{ backgroundColor: "transparent", border: "1px solid #d1d5db", color: "#374151", padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.5 : 1 }}>
            {created ? "Keep empty project" : "Cancel"}
          </button>
          <button onClick={handleSubmit} disabled={!canSubmit} style={{ backgroundColor: canSubmit || isSubmitting ? "#2563eb" : "#9ca3af", border: "none", color: "#ffffff", padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: canSubmit ? "pointer" : "not-allowed", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", display: "flex", alignItems: "center", gap: 8, transition: "background-color 0.2s" }}>
            {isSubmitting && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
            {submitLabel}
          </button>
        </div>

      </div>
    </div>
  );
}
