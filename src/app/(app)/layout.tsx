"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import Sidebar from "@/components/Sidebar";
import NavigationWrapper from "@/components/NavigationWrapper";

import { useAuth } from "@/context/AuthContext";
import { ProjectProvider } from "@/context/ProjectContext";
import { AlertProvider } from "@/context/AlertContext";
import { NavigationProvider } from "@/context/NavigationContext";

/**
 * The signed-in shell, and the guard in front of it.
 *
 * This guard replaces src/middleware.ts, which could not have worked. It
 * checked request.cookies.has("aw_session"), but the backend sets that cookie
 * on its own domain and Next.js middleware only sees cookies for the domain it
 * is served from. Across two registrable domains — the app on vercel.app, the
 * API on duckdns.org — the check was always false, so every visit bounced to
 * /login no matter how valid the session was. It only ever looked correct on
 * localhost, where both servers share one host and cookies ignore the port.
 *
 * /auth/me is the only thing on this side that can answer the question, which
 * is what AuthContext already calls. So the guard waits for that answer and
 * redirects on a definite "no session" — never on a guess about a cookie it
 * cannot see.
 */
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const signedOut = !loading && user === null;

  useEffect(() => {
    if (!signedOut) return;

    // Remember where they were headed so login can send them back — including
    // the query string, so a filtered deep link survives the round trip.
    const next = window.location.pathname + window.location.search;
    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [signedOut, router]);

  // Until /auth/me answers we genuinely do not know, and once we know it is a
  // "no" the redirect is already in flight. Showing the shell in either case
  // would flash the sidebar and nav at someone who may not be signed in, which
  // is the one thing the old middleware did get right.
  if (loading || signedOut) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#f9fafb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader2 size={28} color="#9ca3af" style={{ animation: "spin 1s linear infinite" }} />
        <style
          dangerouslySetInnerHTML={{
            __html: `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`,
          }}
        />
      </div>
    );
  }

  return (
    <NavigationProvider>
      <ProjectProvider>
        <AlertProvider>
          <Sidebar />

          <NavigationWrapper>{children}</NavigationWrapper>
        </AlertProvider>
      </ProjectProvider>
    </NavigationProvider>
  );
}
