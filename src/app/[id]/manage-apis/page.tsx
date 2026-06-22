"use client";

import { useState, useEffect } from "react";
import { Plus, Play, Save, Trash2, Settings2, ArrowLeft, Check, AlertCircle, UploadCloud, PenLine, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation"; 
import { useProjects, Endpoint, HttpMethod } from "@/context/ProjectContext";
import PageSkeleton from "@/components/ui/PageSkeleton";

const emptyEndpoint: Endpoint = {
  id: "new", 
  method: "GET", 
  path: "/api/new-endpoint", 
  url: "", 
  authType: "NONE", 
  token: "", 
  headers: [{ key: "Content-Type", value: "application/json" }], 
  body: "", 
  expectedStatus: "200", 
  maxResponseTime: "1000",
};

export default function ApiManagerPage() {
  const params = useParams();
  const projectSlugFromUrl = params.id as string;
  
  const { 
    projects, 
    updateProjectEndpoints, 
    addEndpoint, 
    updateEndpoint, 
    importSwagger, 
    testEndpoint 
  } = useProjects();

  const currentProject = projects.find(p => p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') === projectSlugFromUrl);

  const initialEndpoints = currentProject?.endpoints || [];
  const [endpoints, setEndpoints] = useState<Endpoint[]>(initialEndpoints);
  const [activeId, setActiveId] = useState<string | "new">(initialEndpoints.length > 0 ? initialEndpoints[0].id : "new");
  const [formData, setFormData] = useState<Endpoint>(initialEndpoints.length > 0 ? initialEndpoints[0] : emptyEndpoint);
  
  const [activeTab, setActiveTab] = useState("Request");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");

  const [isManualMode, setIsManualMode] = useState(false);
  const [showImportBox, setShowImportBox] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isDeletingEndpoint, setIsDeletingEndpoint] = useState(false);
  const isCreating = activeId === "new";
  const showZeroState = endpoints.length === 0 && !isManualMode;

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Sync global state to local sidebar automatically
  useEffect(() => {
    if (currentProject) {
      setEndpoints(currentProject.endpoints);
    }
  }, [currentProject?.endpoints]);

 
  if (!currentProject) {
    return <PageSkeleton />;
  }

  // --- SMART VALIDATION ENGINE ---
  const validateForm = () => {
    const errors = { url: "", auth: "", body: "" };
    let isValid = true;

    // 1. Request Rules
    if (!formData.url.trim()) {
      errors.url = "URL is required";
      isValid = false;
    } else if (formData.url.includes("{") || formData.url.includes("}")) {
      errors.url = "Please replace bracketed variables (e.g., {petId}) with actual test values.";
      isValid = false;
    } else {
      try {
        const parsed = new URL(formData.url);
        const decodedPath = decodeURI(parsed.pathname);
        if (/[^a-zA-Z0-9_/\-{}:.]/.test(decodedPath)) {
          errors.url = "Invalid characters in endpoint path.";
          isValid = false;
        }
      } catch {
        errors.url = "Must be a valid URL (e.g., https://api.example.com/path)";
        isValid = false;
      }
    }

    // 2. Auth Rules (FIXED: Case-insensitive check for "None")
    const currentAuth = formData.authType ? formData.authType.toUpperCase() : "NONE";
    if (currentAuth !== "NONE" && !formData.token?.trim()) {
      errors.auth = `A valid token/key is required for ${formData.authType}`;
      isValid = false;
    }

    // 3. Body Rules (Strict Method Checking)
    if (formData.method === "POST" || formData.method === "PUT") {
      if (!formData.body.trim()) {
        errors.body = `A JSON request body is required for ${formData.method} requests`;
        isValid = false;
      } else {
        try { JSON.parse(formData.body); } 
        catch { errors.body = "Invalid JSON format. Please check for missing quotes or commas."; isValid = false; }
      }
    }

    return { isValid, errors };
  };

  const { isValid, errors } = validateForm();

  // --- Core Actions ---
  const handleSelect = (endpoint: Endpoint) => {
    setIsManualMode(false);
    setActiveId(endpoint.id);
    setFormData(endpoint);
    setTestResult(null); // Clear old results when switching
    setActiveTab("Request");
  };

  const handleDeleteEndpoint = async () => {
    if (!window.confirm("Are you sure you want to remove this endpoint from the monitoring suite?")) {
      return;
    }
    
    setIsDeletingEndpoint(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
      const API_KEY = process.env.NEXT_PUBLIC_API_KEY as string;

      const response = await fetch(`${API_URL}/projects/${currentProject.id}/endpoints/${activeId}`,{
        method: "DELETE",
        headers: { "x-api-key": API_KEY }
      });

      if (response.ok) {
        // 1. Remove from local UI list
        const newEndpoints = endpoints.filter(ep => ep.id !== activeId);
        setEndpoints(newEndpoints);
        
        // 2. Switch to the next available endpoint, or show the blank "new" form
        if (newEndpoints.length > 0) {
          handleSelect(newEndpoints[0]);
        } else {
          handleAddNew();
        }
      } else {
        alert("Failed to delete endpoint from the server.");
      }
    } catch (error) {
      console.error("Failed to delete endpoint", error);
    } finally {
      setIsDeletingEndpoint(false);
    }
  };


  const handleAddNew = () => {
    setIsManualMode(true);
    setActiveId("new");
    setFormData(emptyEndpoint);
    setTestResult(null);
    setActiveTab("Request");
  };

  const handleSaveOnly = async () => {
    if (!isValid || activeId === "new") return;
    setTestResult(null);
    
    const success = await updateEndpoint(currentProject.id, formData);
    if (success) {
      const updatedEndpoints = endpoints.map((ep) => ep.id === formData.id ? formData : ep);
      setEndpoints(updatedEndpoints);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  };

  const handleSaveAndTest = async () => {
    if (!isValid || activeId === "new") return;
    setIsTesting(true);
    setTestResult(null);

    // 1. Save changes to DB first
    const saveSuccess = await updateEndpoint(currentProject.id, formData);
    if (!saveSuccess) {
      setIsTesting(false);
      return; 
    }

    // 2. Run the live test
    try {
      const result = await testEndpoint(currentProject.id, formData.id as string);
      if (result.success) {
        setTestResult(result.data);
      } else {
        alert("Test failed to execute.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTesting(false);
    }
  };

  const handleCreateEndpoint = async () => {
    if (!isValid) return;
    await addEndpoint(currentProject.id, formData);
    const newEndpointList = [...endpoints, formData];
    setEndpoints(newEndpointList);
    setIsManualMode(false);
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  };

  const executeImport = async () => {
    if (!importUrl.trim()) return;
    setIsImporting(true);
    try {
      await importSwagger(currentProject.id, importUrl.trim());
      setIsImporting(false);
      setShowImportBox(false);
      setImportUrl("");
      setIsManualMode(false); 
    } catch (error) {
      console.error(error);
      setIsImporting(false); 
    }
  };

  const handleAddHeader = () => setFormData({ ...formData, headers: [...formData.headers, { key: "", value: "" }] });
  const handleRemoveHeader = (index: number) => setFormData({ ...formData, headers: formData.headers.filter((_, i) => i !== index) });
  const handleHeaderChange = (index: number, field: "key" | "value", newValue: string) => {
    const newHeaders = [...formData.headers];
    newHeaders[index][field] = newValue;
    setFormData({ ...formData, headers: newHeaders });
  };

  const getMethodColor = (method: HttpMethod) => {
    switch (method) {
      case "GET": return { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" };
      case "POST": return { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" };
      case "DELETE": return { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" };
      case "PUT": return { bg: "#fffbeb", text: "#d97706", border: "#fde68a" };
      default: return { bg: "#f3f4f6", text: "#4b5563", border: "#d1d5db" };
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value.replace(/\s/g, "");
    try {
      const urlObj = new URL(url);
      setFormData({ ...formData, url, path: urlObj.pathname });
    } catch {
      const fallbackPath = url.replace(/^https?:\/\/[^\/]+/, "") || "/...";
      setFormData({ ...formData, url, path: fallbackPath });
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f9fafb" }}>
      
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div style={{ padding: "24px 32px", backgroundColor: "#ffffff", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/projects" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: "50%", color: "#6b7280", backgroundColor: "#f3f4f6", transition: "all 0.2s", pointerEvents: (isTesting || isDeletingEndpoint) ? "none" : "auto", opacity: (isTesting || isDeletingEndpoint) ? 0.5 : 1 }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#e5e7eb"; e.currentTarget.style.color = "#111827"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#f3f4f6"; e.currentTarget.style.color = "#6b7280"; }}>
            <ArrowLeft size={18} />
        </Link>
        <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #bfdbfe" }}>
          <Settings2 size={20} color="#2563eb" />
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0 }}>API Manager</h1>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "2px 0 0" }}>
            Project: <strong style={{color: "#111827"}}>{currentProject.title}</strong> · {endpoints.length} endpoints configured
          </p>
        </div>
      </div>

      {/* ── Main Master-Detail Layout ───────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* ── LEFT PANE: The Roster ─────────────────────────────── */}
        {/* ✨ UX LOCK: Freeze and fade sidebar during active backend operations */}
        <div style={{ width: 340, backgroundColor: "#ffffff", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", zIndex: 10, transition: "opacity 0.2s", pointerEvents: (isTesting || isDeletingEndpoint) ? "none" : "auto", opacity: (isTesting || isDeletingEndpoint) ? 0.6 : 1 }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Configured Endpoints
          </div>
          
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px" }}>
            {endpoints.length === 0 && !isCreating ? (
              <div style={{ padding: 24, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
                No endpoints yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {endpoints.map((ep) => {
                  const isActive = activeId === ep.id && !showZeroState;
                  const colors = getMethodColor(ep.method);
                  return (
                    <div key={ep.id} onClick={() => handleSelect(ep)} style={{ display: "flex", alignItems: "center", padding: "10px 12px", borderRadius: 8, cursor: "pointer", transition: "all 0.15s ease", backgroundColor: isActive ? "#eff6ff" : "transparent", border: `1px solid ${isActive ? "#bfdbfe" : "transparent"}` }} onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "#f3f4f6"; }} onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, marginRight: 12, width: 48, textAlign: "center" }}>{ep.method}</span>
                      <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 500, color: isActive ? "#111827" : "#374151", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ep.path}</span>
                    </div>
                  );
                })}

                {isCreating && (
                  <div style={{ display: "flex", alignItems: "center", padding: "10px 12px", borderRadius: 8, backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", animation: "fadeIn 0.2s" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, backgroundColor: "#e5e7eb", color: "#6b7280", marginRight: 12, width: 48, textAlign: "center" }}>NEW</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#2563eb", fontStyle: "italic", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{formData.path}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ padding: 16, borderTop: "1px solid #e5e7eb", backgroundColor: "#fafafa" }}>
            <button onClick={handleAddNew} disabled={isTesting || isDeletingEndpoint} style={{ width: "100%", padding: "10px", fontSize: 13, fontWeight: 600, color: "#2563eb", backgroundColor: "transparent", border: "1px dashed #93c5fd", borderRadius: 8, cursor: (isTesting || isDeletingEndpoint) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#eff6ff"; e.currentTarget.style.borderColor = "#60a5fa"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.borderColor = "#93c5fd"; }}>
              <Plus size={16} /> Add new endpoint
            </button>
          </div>
        </div>

        {/* ── RIGHT PANE: ZERO STATE OR CONFIG FORM ──────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: showZeroState ? "#f3f4f6" : "#ffffff", position: "relative" }}>
          
          {showZeroState ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40, animation: "fadeIn 0.3s ease" }}>
              <div style={{ maxWidth: 560, width: "100%" }}>
                <div style={{ textAlign: "center", marginBottom: 40 }}>
                  <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: "0 0 12px 0" }}>Welcome to your Workspace</h2>
                  <p style={{ fontSize: 15, color: "#6b7280", margin: 0, lineHeight: 1.5 }}>You don&apos;t have any endpoints configured yet. How would you like to add your APIs to this project?</p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {!showImportBox ? (
                    <div onClick={() => setShowImportBox(true)} style={{ display: "flex", alignItems: "flex-start", gap: 20, padding: 24, backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 16, cursor: "pointer", transition: "all 0.2s", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#bfdbfe"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(37, 99, 235, 0.08)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.02)"; }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <UploadCloud size={24} color="#2563eb" />
                      </div>
                      <div>
                        <h3 style={{ margin: "0 0 6px 0", fontSize: 16, fontWeight: 600, color: "#111827" }}>Import from URL</h3>
                        <p style={{ margin: 0, fontSize: 14, color: "#6b7280", lineHeight: 1.5 }}>Automatically generate all your endpoints from a Swagger, OpenAPI, or Postman URL.</p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: 24, backgroundColor: "#ffffff", border: "1px solid #bfdbfe", borderRadius: 16, boxShadow: "0 4px 12px rgba(37, 99, 235, 0.08)", animation: "fadeIn 0.2s ease" }}>
                      <h3 style={{ margin: "0 0 16px 0", fontSize: 14, fontWeight: 600, color: "#111827" }}>Paste your Documentation URL</h3>
                      <input type="text" autoFocus disabled={isImporting} value={importUrl} onChange={(e) => setImportUrl(e.target.value)} placeholder="https://petstore.swagger.io/v2/swagger.json" style={{ width: "100%", padding: "12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 16, opacity: isImporting ? 0.6 : 1 }} />
                      <div style={{ display: "flex", gap: 12 }}>
                        <button onClick={() => setShowImportBox(false)} disabled={isImporting} style={{ flex: 1, padding: "10px", backgroundColor: "transparent", border: "1px solid #d1d5db", borderRadius: 8, color: "#374151", fontSize: 14, fontWeight: 500, cursor: isImporting ? "not-allowed" : "pointer", opacity: isImporting ? 0.6 : 1 }}>Cancel</button>
                        <button onClick={executeImport} disabled={!importUrl.trim() || isImporting} style={{ flex: 2, padding: "10px", backgroundColor: importUrl.trim() ? "#2563eb" : "#9ca3af", border: "none", borderRadius: 8, color: "#ffffff", fontSize: 14, fontWeight: 600, cursor: (!importUrl.trim() || isImporting) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                          {isImporting ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }}/> Importing APIs...</> : "Start Import"}
                        </button>
                      </div>
                    </div>
                  )}

                  <div onClick={handleAddNew} style={{ display: "flex", alignItems: "flex-start", gap: 20, padding: 24, backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 16, cursor: "pointer", transition: "all 0.2s", boxShadow: "0 1px 2px rgba(0,0,0,0.02)", opacity: showImportBox ? 0.5 : 1, pointerEvents: showImportBox ? "none" : "auto" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.05)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.02)"; }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <PenLine size={24} color="#4b5563" />
                    </div>
                    <div>
                      <h3 style={{ margin: "0 0 6px 0", fontSize: 16, fontWeight: 600, color: "#111827" }}>Create manually</h3>
                      <p style={{ margin: 0, fontSize: 14, color: "#6b7280", lineHeight: 1.5 }}>Start from scratch and configure every detail of your request, headers, and body.</p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          ) : (
            /* --- THE STANDARD CONFIGURATION FORM --- */
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e7eb", paddingRight: 24 }}>
                
                {/* 🔴 NEW SMART TABS WITH ERROR INDICATORS 🔴 */}
                <div style={{ display: "flex", paddingLeft: 24 }}>
                  {["Request", "Auth", "Headers", "Body", "Assertions"].map((tab) => {
                    let hasError = false;
                    if (tab === "Request" && errors.url) hasError = true;
                    if (tab === "Auth" && errors.auth) hasError = true;
                    if (tab === "Body" && errors.body) hasError = true;

                    return (
                      <div key={tab} onClick={() => setActiveTab(tab)} style={{ position: "relative", padding: "16px 20px", fontSize: 14, fontWeight: activeTab === tab ? 600 : 500, color: activeTab === tab ? "#2563eb" : (hasError ? "#ef4444" : "#6b7280"), borderBottom: `2px solid ${activeTab === tab ? "#2563eb" : "transparent"}`, cursor: "pointer", transition: "color 0.2s" }}>
                        {tab}
                        {hasError && <div style={{ position: "absolute", top: 12, right: 8, width: 6, height: 6, borderRadius: "50%", backgroundColor: "#ef4444" }} title="Missing required configuration" />}
                      </div>
                    );
                  })}
                </div>
                
              </div>

              {/* Form Content Area */}
              <div style={{ flex: 1, padding: 32, overflowY: "auto", display: "flex", flexDirection: "column", pointerEvents: (isTesting || isDeletingEndpoint) ? "none" : "auto", opacity: (isTesting || isDeletingEndpoint) ? 0.7 : 1 }}>
                <div style={{ maxWidth: 800, display: "flex", flexDirection: "column", gap: 32, flex: 1 }}>
                  
                  {/* TAB 1: Request */}
                  {activeTab === "Request" && (
                    <div style={{ animation: "fadeIn 0.2s ease" }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: "0 0 16px 0" }}>Request Coordinates</h3>
                      <div style={{ display: "flex", gap: 16 }}>
                        <div style={{ width: 140 }}>
                          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8, display: "block" }}>Method</label>
                          <select value={formData.method} onChange={(e) => setFormData({ ...formData, method: e.target.value as HttpMethod })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, backgroundColor: "#fff", outline: "none", cursor: "pointer" }}>
                            <option value="GET">GET</option><option value="POST">POST</option><option value="PUT">PUT</option><option value="DELETE">DELETE</option>
                          </select>
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8, display: "block" }}>URL</label>
                          <input type="text" value={formData.url} onChange={handleUrlChange} placeholder="https://api.example.com/endpoint" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${errors.url ? "#ef4444" : "#d1d5db"}`, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "monospace", backgroundColor: errors.url ? "#fef2f2" : "#ffffff" }} />
                          {errors.url && <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#ef4444", fontSize: 12, fontWeight: 500, marginTop: 8 }}><AlertCircle size={14} /> {errors.url}</div>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: Auth */}
{activeTab === "Auth" && (
  <div style={{ animation: "fadeIn 0.2s ease" }}>
    <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: "0 0 16px 0" }}>Authentication</h3>
    <div style={{ display: "flex", gap: 16 }}>
      
      <div style={{ width: 200 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: "#6b7280", marginBottom: 8, display: "block" }}>Auth type</label>
        {/* ✨ THE FIX 1: Safely map the backend string to the dropdown option values */}
        <select 
          value={
            formData.authType === "Bearer Token (JWT)" || formData.authType === "BEARER" ? "BEARER" : 
            formData.authType === "API Key" || formData.authType === "API_KEY" ? "API_KEY" : 
            "NONE"
          } 
          onChange={(e) => setFormData({ ...formData, authType: e.target.value })} 
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, backgroundColor: "#fff", outline: "none" }}
        >
          <option value="NONE">None</option>
          <option value="BEARER">Bearer Token (JWT)</option>
          <option value="API_KEY">API Key</option>
        </select>
      </div>

      {/* TAB 2 AUTH */}
      {(formData.authType === "Bearer Token (JWT)" || formData.authType === "BEARER" || formData.authType === "API Key" || formData.authType === "API_KEY") && (
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: "#6b7280", marginBottom: 8, display: "block" }}>Token / Key value</label>
          <input type="password" value={formData.token || ""} onChange={(e) => setFormData({ ...formData, token: e.target.value })} placeholder="Paste your token here..." style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${errors.auth ? "#ef4444" : "#d1d5db"}`, fontSize: 14, outline: "none", boxSizing: "border-box", backgroundColor: errors.auth ? "#fef2f2" : "#ffffff" }} />
          {errors.auth && <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#ef4444", fontSize: 12, fontWeight: 500, marginTop: 8 }}><AlertCircle size={14} /> {errors.auth}</div>}
        </div>
      )}

    </div>
  </div>
)}

                  {/* TAB 3: Headers */}
                  {activeTab === "Headers" && (
                    <div style={{ animation: "fadeIn 0.2s ease" }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: "0 0 16px 0" }}>Custom Headers</h3>
                      {formData.headers.map((header, index) => (
                        <div key={index} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                          <input type="text" value={header.key} onChange={(e) => handleHeaderChange(index, "key", e.target.value)} placeholder="Key (e.g. Content-Type)" style={{ width: 200, padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, fontFamily: "monospace", outline: "none" }} />
                          <input type="text" value={header.value} onChange={(e) => handleHeaderChange(index, "value", e.target.value)} placeholder="Value (e.g. application/json)" style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, fontFamily: "monospace", outline: "none" }} />
                          <button onClick={() => handleRemoveHeader(index)} style={{ padding: "0 12px", backgroundColor: "transparent", border: "1px solid #d1d5db", borderRadius: 8, color: "#ef4444", cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fee2e2"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button onClick={handleAddHeader} style={{ padding: "8px 12px", fontSize: 13, fontWeight: 500, color: "#4b5563", backgroundColor: "#ffffff", border: "1px solid #d1d5db", borderRadius: 6, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#ffffff"}><Plus size={14} /> Add header</button>
                    </div>
                  )}

                  {/* TAB 4: Body */}
                  {activeTab === "Body" && (
                    <div style={{ animation: "fadeIn 0.2s ease" }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: "0 0 16px 0" }}>Request Body (JSON)</h3>
                      {formData.method === "GET" || formData.method === "DELETE" ? (
                        <div style={{ padding: 16, backgroundColor: "#f3f4f6", borderRadius: 8, color: "#6b7280", fontSize: 14, fontStyle: "italic" }}>A request body is typically not required for {formData.method} requests.</div>
                      ) : (
                        <>
                          <textarea value={formData.body} onChange={(e) => setFormData({ ...formData, body: e.target.value })} placeholder="{\n  &quot;key&quot;: &quot;value&quot;\n}" style={{ width: "100%", height: 200, padding: "12px", borderRadius: 8, border: `1px solid ${errors.body ? "#ef4444" : "#d1d5db"}`, fontSize: 14, fontFamily: "monospace", outline: "none", resize: "vertical", backgroundColor: errors.body ? "#fef2f2" : "#f9fafb" }} />
                          {errors.body && <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#ef4444", fontSize: 12, fontWeight: 500, marginTop: 8 }}><AlertCircle size={14} /> {errors.body}</div>}
                        </>
                      )}
                    </div>
                  )}

                  {/* TAB 5: Assertions */}
                  {activeTab === "Assertions" && (
                    <div style={{ animation: "fadeIn 0.2s ease" }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: "0 0 16px 0" }}>Assertions (Expected Rules)</h3>
                      <div style={{ display: "flex", gap: 24 }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 13, fontWeight: 500, color: "#6b7280", marginBottom: 8, display: "block" }}>Expected Status Code(s)</label>
                          <input type="text" value={formData.expectedStatus} onChange={(e) => setFormData({ ...formData, expectedStatus: e.target.value })} placeholder="e.g. 200, 201" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 13, fontWeight: 500, color: "#6b7280", marginBottom: 8, display: "block" }}>Max Response Time (ms)</label>
                          <input type="text" value={formData.maxResponseTime} onChange={(e) => setFormData({ ...formData, maxResponseTime: e.target.value })} placeholder="e.g. 500" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* LIVE TEST RESULTS PANE */}
                {testResult && (
                  <div style={{ marginTop: 32, padding: 24, borderRadius: 8, border: "1px solid", borderColor: testResult.passed ? "#bbf7d0" : "#fecaca", backgroundColor: testResult.passed ? "#f0fdf4" : "#fef2f2", animation: "fadeIn 0.3s ease" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: testResult.passed ? "#16a34a" : "#dc2626" }}>
                        {testResult.passed ? "TEST PASSED" : "TEST FAILED"}
                      </span>
                      <span style={{ fontSize: 13, color: "#374151", backgroundColor: "#fff", padding: "4px 8px", borderRadius: 4, border: "1px solid #d1d5db" }}>
                        Status: <strong>{testResult.statusCode}</strong>
                      </span>
                      <span style={{ fontSize: 13, color: "#374151", backgroundColor: "#fff", padding: "4px 8px", borderRadius: 4, border: "1px solid #d1d5db" }}>
                        Time: <strong>{testResult.responseTime}ms</strong>
                      </span>
                    </div>
                    <textarea 
                      readOnly 
                      value={testResult.responseBody} 
                      style={{ width: "100%", height: 120, padding: 12, borderRadius: 8, border: "1px solid #d1d5db", backgroundColor: "#1f2937", color: "#e5e7eb", fontFamily: "monospace", fontSize: 13, outline: "none", resize: "vertical" }}
                    />
                  </div>
                )}
              </div>

              {/* ✨ ACTION FOOTER: Protected by Master UX Lock ✨ */}
              <div style={{ padding: "16px 32px", backgroundColor: "#f9fafb", borderTop: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 12 }}>
                
                {/* 🔴 Delete Button (Locked if processing) 🔴 */}
                {!isCreating && (
                  <button 
                    onClick={handleDeleteEndpoint}
                    disabled={isTesting || isDeletingEndpoint}
                    style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      backgroundColor: "transparent",
                      color: (isTesting || isDeletingEndpoint) ? "#fca5a5" : "#ef4444",
                      border: `1px solid ${(isTesting || isDeletingEndpoint) ? "#fecaca" : "#f87171"}`,
                      padding: "8px 16px", borderRadius: "6px", fontSize: "14px", fontWeight: 500,
                      cursor: (isTesting || isDeletingEndpoint) ? "wait" : "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    {isDeletingEndpoint ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={16} />}
                    {isDeletingEndpoint ? "Deleting..." : "Delete Endpoint"}
                  </button>
                )}

                {/* Explicit Form Validation Warning */}
                {!isValid && !isCreating && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#ef4444", fontSize: 13, fontWeight: 500, marginLeft: 12 }}>
                    <AlertCircle size={14} />
                    {errors.url ? "Request config required" : errors.auth ? "Auth config required" : errors.body ? "Body config required" : "Config required"}
                  </div>
                )}

                {/* Pushes Save buttons to the right edge */}
                <div style={{ flex: 1 }}></div>

                {isCreating ? (
                  <>
                    <button onClick={() => endpoints.length > 0 ? handleSelect(endpoints[0]) : setIsManualMode(false)} disabled={isTesting || isDeletingEndpoint} style={{ padding: "10px 20px", fontSize: 14, fontWeight: 500, color: "#dc2626", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, cursor: (isTesting || isDeletingEndpoint) ? "not-allowed" : "pointer", transition: "all 0.2s", opacity: (isTesting || isDeletingEndpoint) ? 0.6 : 1 }}>
                      Cancel
                    </button>
                    <button onClick={handleCreateEndpoint} disabled={!isValid || isTesting || isDeletingEndpoint} title={!isValid ? "Please fix errors before creating" : ""} style={{ padding: "10px 20px", fontSize: 14, fontWeight: 600, color: "#ffffff", backgroundColor: isValid ? "#2563eb" : "#9ca3af", border: "none", borderRadius: 8, cursor: (isValid && !isTesting && !isDeletingEndpoint) ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s", opacity: (isTesting || isDeletingEndpoint) ? 0.6 : 1 }}>
                      <Save size={16} /> Create Endpoint
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={handleSaveOnly} disabled={!isValid || isTesting || isDeletingEndpoint} title={!isValid ? "Please fix errors before saving" : ""} style={{ padding: "10px 20px", fontSize: 14, fontWeight: 500, color: saveStatus === "saved" ? "#16a34a" : (!isValid ? "#9ca3af" : "#374151"), backgroundColor: saveStatus === "saved" ? "#f0fdf4" : "#ffffff", border: `1px solid ${saveStatus === "saved" ? "#bbf7d0" : "#d1d5db"}`, borderRadius: 8, cursor: (isValid && !isTesting && !isDeletingEndpoint) ? "pointer" : "not-allowed", transition: "all 0.3s ease", display: "flex", alignItems: "center", gap: 6, opacity: isValid && !isTesting && !isDeletingEndpoint ? 1 : 0.6 }}>
                      {saveStatus === "saved" ? <><Check size={16} /> Saved!</> : "Save only"}
                    </button>
                    <button onClick={handleSaveAndTest} disabled={!isValid || isTesting || isDeletingEndpoint} style={{ padding: "10px 20px", fontSize: 14, fontWeight: 600, color: "#ffffff", backgroundColor: isValid ? "#2563eb" : "#9ca3af", border: "none", borderRadius: 8, cursor: (isValid && !isTesting && !isDeletingEndpoint) ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 8, transition: "background 0.2s", opacity: (isTesting || isDeletingEndpoint) ? 0.7 : 1 }}>
                      {isTesting ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }}/> Testing...</> : <><Play size={16} /> Save & Run test</>}
                    </button>
                  </>
                )}
              </div>
            </>
          )}

        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}} />
    </div>
  );
}