import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import NavigationWrapper from "@/components/NavigationWrapper"; 

import { AuthProvider } from "@/context/AuthContext";
import { ProjectProvider } from "@/context/ProjectContext";
import { AlertProvider } from "@/context/AlertContext";
import { NavigationProvider } from "@/context/NavigationContext";

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
        <AuthProvider>
          <NavigationProvider>
            <ProjectProvider>
              <AlertProvider>

                <Sidebar />

                <NavigationWrapper>
                  {children}
                </NavigationWrapper>

              </AlertProvider>
            </ProjectProvider>
          </NavigationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}