// frontend/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PERMISSIONS } from "./theme";
import type { UserRole } from "./theme";

// ── export const (avec accolades) ──
import { Home }     from "./pages/Home";
import { Login }    from "./pages/login";
import { NotFound } from "./pages/NotFound";

// ── Layout ──
import { MainLayout } from "./layouts/MainLayout";

// ── export default (sans accolades) ──
import Dashbord        from "./pages/dashbord";
import CreateTicket    from "./pages/CreateTicket";
import TicketDetails   from "./pages/TicketDetails";
import AllTickets      from "./pages/AllTickets";
import MyTickets       from "./pages/MyTickets";
import AssignedTickets from "./pages/AssignedTickets";
import Analytics       from "./pages/Analytics";
import Team            from "./pages/Team";
import Projects        from "./pages/Projects";
import Settings        from "./pages/Settings";
import Users           from "./pages/Users";
import CompanyContext  from "./pages/CompanyContext";

// ════════════════════════════════════════════════════════
// Hook
// ════════════════════════════════════════════════════════
export const useCurrentUser = () => {
  const stored = localStorage.getItem("user");
  if (!stored) return null;
  try {
    return JSON.parse(stored) as {
      id: string;
      name: string;
      email: string;
      role: UserRole;
    };
  } catch {
    return null;
  }
};

// ════════════════════════════════════════════════════════
// ProtectedRoute
// ════════════════════════════════════════════════════════
interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: keyof typeof PERMISSIONS["admin"];
}

const ProtectedRoute = ({ children, permission }: ProtectedRouteProps) => {
  const token = localStorage.getItem("token");
  const user  = useCurrentUser();

  if (!token || !user) return <Navigate to="/login" replace />;

  if (permission) {
    const perms = PERMISSIONS[user.role] ?? PERMISSIONS["user"];
    if (!perms[permission]) return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// ════════════════════════════════════════════════════════
// App
// ════════════════════════════════════════════════════════
export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Pages publiques ── */}
        <Route path="/"      element={<Home />}  />
        <Route path="/login" element={<Login />} />

        {/* ── Dashboard ── */}
        <Route path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout><Dashbord /></MainLayout>
            </ProtectedRoute>
          }
        />

        {/* ── Tickets ── */}
        <Route path="/tickets/create"
          element={
            <ProtectedRoute>
              <MainLayout><CreateTicket /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/tickets/my"
          element={
            <ProtectedRoute>
              <MainLayout><MyTickets /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/tickets/assigned"
          element={
            <ProtectedRoute>
              <MainLayout><AssignedTickets /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/tickets/all"
          element={
            <ProtectedRoute permission="canSeeAllTickets">
              <MainLayout><AllTickets /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/tickets/:id"
          element={
            <ProtectedRoute>
              <MainLayout><TicketDetails /></MainLayout>
            </ProtectedRoute>
          }
        />

        {/* ── Analytics ── */}
        <Route path="/analytics"
          element={
            <ProtectedRoute permission="canSeeAnalytics">
              <MainLayout><Analytics /></MainLayout>
            </ProtectedRoute>
          }
        />

        {/* ── Team ── */}
        <Route path="/team"
          element={
            <ProtectedRoute permission="canSeeTeam">
              <MainLayout><Team /></MainLayout>
            </ProtectedRoute>
          }
        />

        {/* ── Projects ── */}
        <Route path="/projects"
          element={
            <ProtectedRoute>
              <MainLayout><Projects /></MainLayout>
            </ProtectedRoute>
          }
        />

        {/* ── Users ── */}
        <Route path="/users"
          element={
            <ProtectedRoute permission="canSeeUsers">
              <MainLayout><Users /></MainLayout>
            </ProtectedRoute>
          }
        />

        {/* ── Settings ── */}
        <Route path="/settings"
          element={
            <ProtectedRoute>
              <MainLayout><Settings /></MainLayout>
            </ProtectedRoute>
          }
        />

        {/* ── Company Context (admin only) ── */}
        <Route path="/company-context"
          element={
            <ProtectedRoute permission="canManageUsers">
              <MainLayout><CompanyContext /></MainLayout>
            </ProtectedRoute>
          }
        />

        {/* ── Compatibilité ── */}
        <Route path="/Dashbord"   element={<Navigate to="/dashboard"  replace />} />
        <Route path="/my-tickets" element={<Navigate to="/tickets/my" replace />} />

        {/* ── 404 ── */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
}