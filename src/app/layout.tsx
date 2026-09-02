import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "APIWatch — API Testing Dashboard",
  description:
    "Internal API testing dashboard for monitoring REST, GraphQL, and Auth-protected APIs",
};

/**
 * The document shell, and nothing else.
 *
 * The app chrome — sidebar, nav, project/alert data — lives in the (app) route
 * group so it only wraps signed-in pages. /login sits in (auth) and renders
 * standalone. AuthProvider stays here, above both groups, because the login
 * form needs it just as much as the dashboard does.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
        style={{
          fontFamily: "var(--font-sans), system-ui, sans-serif",
          backgroundColor: "#f9fafb",
          margin: 0,
        }}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
