"use client";

import { X, FolderPlus, Link as LinkIcon, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

export interface CreateProjectData {
  name: string;
  url: string;
}

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreateProjectData) => void;
}

export default function CreateProjectModal({ isOpen, onClose, onCreate }: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setUrl("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    
    const delay = url.trim() ? 1500 : 400;
    
    setTimeout(() => {
      onCreate({ name, url });
      setIsSubmitting(false);
      onClose();
    }, delay);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0, 0, 0, 0.4)", backdropFilter: "blur(4px)", cursor: isSubmitting ? "wait" : "pointer" }} onClick={() => !isSubmitting && onClose()} />

      <div style={{ position: "relative", width: "100%", maxWidth: 480, backgroundColor: "#ffffff", borderRadius: 16, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", display: "flex", flexDirection: "column", animation: "scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)" }}>
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
          <button onClick={() => !isSubmitting && onClose()} style={{ background: "transparent", border: "none", color: "#9ca3af", cursor: isSubmitting ? "not-allowed" : "pointer", padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8, display: "block" }}>
              Project Name <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Payment Gateway" autoFocus disabled={isSubmitting} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, outline: "none", boxSizing: "border-box", opacity: isSubmitting ? 0.6 : 1 }} />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block" }}>API Documentation URL</label>
              <span style={{ fontSize: 11, fontWeight: 500, color: "#9ca3af", backgroundColor: "#f3f4f6", padding: "2px 6px", borderRadius: 4 }}>Optional</span>
            </div>
            <div style={{ position: "relative", opacity: isSubmitting ? 0.6 : 1 }}>
              <div style={{ position: "absolute", left: 12, top: 10, color: "#9ca3af" }}><LinkIcon size={16} /></div>
              <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} disabled={isSubmitting} placeholder="https://api.example.com/swagger.json" style={{ width: "100%", padding: "10px 12px 10px 36px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 12, color: "#6b7280" }}>If provided, we will automatically import your endpoints.</p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", backgroundColor: "#f9fafb", borderTop: "1px solid #e5e7eb", borderBottomLeftRadius: 16, borderBottomRightRadius: 16, display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button onClick={() => !isSubmitting && onClose()} disabled={isSubmitting} style={{ backgroundColor: "transparent", border: "1px solid #d1d5db", color: "#374151", padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.5 : 1 }}>
            Cancel
          </button>
          <button onClick={handleCreate} disabled={!name.trim() || isSubmitting} style={{ backgroundColor: name.trim() ? "#2563eb" : "#9ca3af", border: "none", color: "#ffffff", padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: (!name.trim() || isSubmitting) ? "not-allowed" : "pointer", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", display: "flex", alignItems: "center", gap: 8, transition: "background-color 0.2s" }}>
            {isSubmitting ? (
              <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> {url.trim() ? "Importing API..." : "Creating..."}</>
            ) : "Create Project"}
          </button>
        </div>

      </div>
    </div>
  );
}