// frontend/src/layouts/MainLayout.tsx
import { useLocation } from "react-router-dom";
import { Box } from "@mui/material";
import { Navbar }  from "../components/Navbar";
import { ChatBot } from "../components/ChatBot";

interface Props {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: Props) => {
  const location = useLocation();
  const onAiPage = location.pathname === "/ai-assistant";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", bgcolor: "#F4F6FA" }}>
      <Navbar />

      <Box component="main" sx={{ flex: 1, overflow: "auto" }}>
        {children}
      </Box>

      {/* Floating chatbot — hidden on the AI Assistant full page */}
      {!onAiPage && <ChatBot />}
    </Box>
  );
};
