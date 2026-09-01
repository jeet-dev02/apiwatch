"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authApi, Session, SessionUser, SessionOrg, UnauthorizedError } from "@/lib/api";

interface AuthContextValue {
  user: SessionUser | null;
  org: SessionOrg | null;
  role: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    name?: string;
    orgName: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [org, setOrg] = useState<SessionOrg | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const applySession = useCallback((session: Session) => {
    setUser(session.user);
    setOrg(session.org);
    setRole(session.role ?? null);
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setOrg(null);
    setRole(null);
  }, []);

  // On mount, ask the backend who we are. The cookie is httpOnly, so this is
  // the only way to find out — the frontend cannot read it directly.
  useEffect(() => {
    let cancelled = false;

    authApi
      .me()
      .then((res) => {
        if (!cancelled) applySession(res.data);
      })
      .catch((err) => {
        if (cancelled) return;

        // Only a genuine 401 means "signed out".
        if (err instanceof UnauthorizedError) {
          clearSession();
          return;
        }

        // Anything else — a 429 from the auth rate limit, or an unreachable
        // server — means we could not determine the session, which is not the
        // same as being signed out. Keep whatever state we already had.
        console.warn("Session check inconclusive, keeping current session:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [applySession, clearSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login({ email, password });
      applySession(res.data);
      router.push("/");
    },
    [applySession, router]
  );

  const register = useCallback(
    async (input: { email: string; password: string; name?: string; orgName: string }) => {
      const res = await authApi.register(input);
      applySession(res.data);
      router.push("/");
    },
    [applySession, router]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearSession();
      router.push("/login");
    }
  }, [clearSession, router]);

  return (
    <AuthContext.Provider value={{ user, org, role, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
