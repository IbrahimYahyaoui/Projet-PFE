// frontend/src/layouts/MainLayout.tsx
import { useLocation } from "react-router-dom";
import { Box } from "@mui/material";
import { Navbar } from "../components/Navbar";
import { SecondarySidebar } from "../components/SecondarySidebar";

interface MainLayoutProps {
  children: React.ReactNode;
}

// ── Quel module est actif selon la route ──
const getActiveModule = (pathname: string): string | null => {
  if (pathname.startsWith("/team"))             return "team";
  if (pathname.startsWith("/tickets"))          return "team";
  if (pathname.startsWith("/analytics"))        return "team";
  if (pathname.startsWith("/projects"))         return "projects";
  if (pathname.startsWith("/users"))            return "users";
  return null;
};

export const MainLayout = ({ children }: MainLayoutProps) => {
  const location    = useLocation();
  const activeModule = getActiveModule(location.pathname);
  const hasSidebar   = activeModule !== null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", bgcolor: "#F4F6FA" }}>

      {/* ── TOP NAVBAR + SUBNAV ── */}
      <Navbar />

      {/* ── BODY ── */}
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── SIDEBAR SECONDAIRE (si module actif) ── */}
        {hasSidebar && (
          <SecondarySidebar activeModule={activeModule!} />
        )}

        {/* ── CONTENU PRINCIPAL ── */}
        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: "auto",
            minHeight: "calc(100vh - 108px)",
            transition: "all 0.25s ease",
          }}
        >
          {children}
        </Box>

      </Box>
    </Box>
  );
};