"use client";

import { useState, FormEvent, CSSProperties } from "react";
import { Shield, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const labelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 8,
  display: "block",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  color: "#111827",
  backgroundColor: "#ffffff",
  transition: "border-color 150ms, box-shadow 150ms",
};

/** Focus ring in the app blue, applied the way the sidebar applies its hover. */
const focusHandlers = {
  onFocus: (e: { currentTarget: HTMLInputElement }) => {
    e.currentTarget.style.borderColor = "#2563eb";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.12)";
  },
  onBlur: (e: { currentTarget: HTMLInputElement }) => {
    e.currentTarget.style.borderColor = "#d1d5db";
    e.currentTarget.style.boxShadow = "none";
  },
};

export default function LoginPage() {
  const { login, register } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isRegister = mode === "register";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRegister && password.length < 12) {
      setError("Password must be at least 12 characters");
      return;
    }

    setBusy(true);
    try {
      if (isRegister) {
        await register({ email, password, name: name || undefined, orgName });
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError((err as Error).message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04), 0 12px 32px -12px rgba(0, 0, 0, 0.12)",
          }}
        >
          {/* Header — the sidebar brand lockup, in the modals' icon tile */}
          <div style={{ padding: "28px 28px 0", display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: "#eff6ff",
                border: "1px solid #bfdbfe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Shield size={20} color="#2563eb" strokeWidth={2.2} />
            </div>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#111827",
                  letterSpacing: "-0.01em",
                }}
              >
                APIWatch
              </h1>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6b7280" }}>
                {isRegister
                  ? "Create an account to start monitoring."
                  : "Sign in to your dashboard."}
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}
          >
            {isRegister && (
              <>
                <div>
                  <label htmlFor="orgName" style={labelStyle}>
                    Organisation name <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    id="orgName"
                    type="text"
                    required
                    autoFocus
                    disabled={busy}
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Acme Engineering"
                    style={{ ...inputStyle, opacity: busy ? 0.6 : 1 }}
                    {...focusHandlers}
                  />
                </div>

                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <label htmlFor="name" style={{ ...labelStyle, marginBottom: 0 }}>
                      Your name
                    </label>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: "#9ca3af",
                        backgroundColor: "#f3f4f6",
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      Optional
                    </span>
                  </div>
                  <input
                    id="name"
                    type="text"
                    disabled={busy}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ada Lovelace"
                    style={{ ...inputStyle, opacity: busy ? 0.6 : 1 }}
                    {...focusHandlers}
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" style={labelStyle}>
                Email <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                autoFocus={!isRegister}
                autoComplete="email"
                disabled={busy}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                style={{ ...inputStyle, opacity: busy ? 0.6 : 1 }}
                {...focusHandlers}
              />
            </div>

            <div>
              <label htmlFor="password" style={labelStyle}>
                Password <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete={isRegister ? "new-password" : "current-password"}
                disabled={busy}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{ ...inputStyle, opacity: busy ? 0.6 : 1 }}
                {...focusHandlers}
              />
              {isRegister && (
                <p style={{ margin: "6px 0 0", fontSize: 12, color: "#6b7280" }}>
                  At least 12 characters.
                </p>
              )}
            </div>

            {error && (
              <div
                role="alert"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontSize: 13,
                  color: "#b91c1c",
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              style={{
                width: "100%",
                backgroundColor: busy ? "#9ca3af" : "#2563eb",
                border: "none",
                color: "#ffffff",
                padding: "10px 16px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: busy ? "not-allowed" : "pointer",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "background-color 150ms",
              }}
              onMouseEnter={(e) => {
                if (!busy) e.currentTarget.style.backgroundColor = "#1d4ed8";
              }}
              onMouseLeave={(e) => {
                if (!busy) e.currentTarget.style.backgroundColor = "#2563eb";
              }}
            >
              {busy ? (
                <>
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  {isRegister ? "Creating account…" : "Signing in…"}
                </>
              ) : isRegister ? (
                "Create account"
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Footer strip — the same treatment the modals give theirs */}
          <div
            style={{
              padding: "16px 28px",
              backgroundColor: "#f9fafb",
              borderTop: "1px solid #e5e7eb",
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              color: "#6b7280",
            }}
          >
            {isRegister ? "Already have an account?" : "Need an account?"}
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setMode(isRegister ? "login" : "register");
                setError(null);
              }}
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                fontSize: 13,
                fontWeight: 600,
                color: "#2563eb",
                cursor: busy ? "not-allowed" : "pointer",
                opacity: busy ? 0.5 : 1,
              }}
            >
              {isRegister ? "Sign in" : "Create one"}
            </button>
          </div>
        </div>

        <p style={{ margin: "16px 0 0", textAlign: "center", fontSize: 12, color: "#9ca3af" }}>
          APIWatch — internal API monitoring
        </p>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`,
        }}
      />
    </div>
  );
}
