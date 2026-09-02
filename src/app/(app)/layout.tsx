import Sidebar from "@/components/Sidebar";
import NavigationWrapper from "@/components/NavigationWrapper";

import { ProjectProvider } from "@/context/ProjectContext";
import { AlertProvider } from "@/context/AlertContext";
import { NavigationProvider } from "@/context/NavigationContext";

/**
 * The signed-in shell. Everything the middleware protects renders inside it,
 * so the sidebar, the nav chrome and the project/alert providers only mount
 * once there is a session to render them for — /login gets none of it.
 */
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
