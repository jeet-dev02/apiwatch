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

/**
 * Where to send someone once they are signed in.
 *
 * The middleware bounces unauthenticated visitors to /login?next=<path>, so
 * hand them back the page they were actually after. Read straight from
 * window.location instead of useSearchParams: this only ever runs from a submit
 * handler, and a search-param hook in a provider mounted this high would drag
 * every page underneath it into a Suspense boundary.
 *
 * Only same-origin paths are honoured. `next` comes off the URL bar, so
 * "//evil.example" or "https://evil.example" would otherwise make the login
 * form an open redirect.
 *
 * Exported so the login page can bounce an already-signed-in visitor to the
 * same place, through the same guard.
 */
export function destinationAfterAuth(): string {
  if (typeof window === "undefined") return "/";

  const next = new URLSearchParams(window.location.search).get("next");
  if (!next) return "/";
  if (!next.startsWith("/")) return "/";
  if (next.startsWith("//") || next.startsWith("/\\")) return "/";

  return next;
}

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

  /**
   * A real page load, deliberately — not router.push().
   *
   * The App Router still holds the middleware's redirect for "/" from back when
   * there was no cookie, so pushing there replays the cached redirect and the
   * user never leaves /login even though they are signed in. A document
   * navigation re-runs the middleware against the cookie the backend just set
   * and remounts the app with the session already in place. `replace` also
   * keeps /login out of the back-button history.
   */
  const leaveLoginPage = useCallback(() => {
    window.location.replace(destinationAfterAuth());
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login({ email, password });
      applySession(res.data);
      leaveLoginPage();
    },
    [applySession, leaveLoginPage]
  );

  const register = useCallback(
    async (input: { email: string; password: string; name?: string; orgName: string }) => {
      const res = await authApi.register(input);
      applySession(res.data);
      leaveLoginPage();
    },
    [applySession, leaveLoginPage]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearSession();
      router.push("/login");
      // Drop the cached RSC payloads for the pages we just signed out of, so
      // the next session does not render the previous org's data.
      router.refresh();
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
