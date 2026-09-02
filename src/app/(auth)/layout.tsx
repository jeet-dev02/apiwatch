/**
 * Standalone pages — no sidebar, no nav, no app chrome.
 *
 * These render for visitors who have no session yet, so anything that assumes
 * one (the project and alert providers, the sidebar) deliberately lives in the
 * (app) group instead. AuthProvider comes from the root layout above.
 */
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
