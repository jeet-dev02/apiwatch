import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

// 1. IMPORT BOTH PROVIDERS HERE
import { ProjectProvider } from "@/context/ProjectContext";
import { AlertProvider } from "@/context/AlertContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "APIWatch — API Testing Dashboard",
  description:
    "Internal API testing dashboard for monitoring REST, GraphQL, and Auth-protected APIs",
};

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
        {/* 2. WRAP EVERYTHING IN THE PROVIDERS */}
        <ProjectProvider>
          <AlertProvider>
            
            <Sidebar />
            <main style={{ marginLeft: 220, minHeight: "100vh" }}>
              {children}
            </main>

          </AlertProvider>
        </ProjectProvider>
      </body>
    </html>
  );
}