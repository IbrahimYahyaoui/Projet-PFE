// frontend/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PERMISSIONS } from "./theme";
import type { UserRole } from "./theme";
import { getCurrentUser } from "./hooks/useAuth";

// ── Public pages ──
import { Login }    from "./pages/login";
import { NotFound } from "./pages/NotFound";

// ── Layout ──
import { MainLayout } from "./layouts/MainLayout";

// ── Dashboard ──
import Dashboard from "./pages/Dashboard";

// ── Tickets ──
import CreateTicket    from "./pages/CreateTicket";
import TicketDetails   from "./pages/TicketDetails";
import AllTickets      from "./pages/AllTickets";
import MyTickets       from "./pages/MyTickets";
import AssignedTickets from "./pages/AssignedTickets";
import AdminQueue      from "./pages/tickets/AdminQueue";
import TicketHistory   from "./pages/tickets/TicketHistory";

// ── Teams ──
import TeamsPage     from "./pages/teams/TeamsPage";
import TeamMembers   from "./pages/teams/TeamMembers";
import TeamTickets   from "./pages/teams/TeamTickets";
import TeamWorkload  from "./pages/teams/TeamWorkload";
import TeamAnalytics from "./pages/teams/TeamAnalytics";

// ── Projects ──
import Projects           from "./pages/Projects";
import ProjectDetail      from "./pages/projects/ProjectDetail";
import ProjectKanban      from "./pages/projects/ProjectKanban";
import ProjectTasks       from "./pages/projects/ProjectTasks";
import ProjectAnalytics   from "./pages/projects/ProjectAnalytics";

// ── Knowledge Base ──
import KnowledgeBase        from "./pages/KnowledgeBase";
import KnowledgeBaseCreate  from "./pages/KnowledgeBaseCreate";
import KnowledgeBaseArticle from "./pages/KnowledgeBaseArticle";

// ── AI Assistant ──
import AIAssistant from "./pages/AIAssistant";

// ── Admin ──
import Analytics    from "./pages/Analytics";
import Users        from "./pages/Users";
import CompanyContext from "./pages/CompanyContext";

// ── Profile ──
import Profile from "./pages/Profile";

// ── Settings ──
import Settings from "./pages/Settings";

// ════════════════════════════════════════════════════════
// Legacy re-export so pages that import useCurrentUser still compile
// ════════════════════════════════════════════════════════
export const useCurrentUser = getCurrentUser;

// ════════════════════════════════════════════════════════
// ProtectedRoute
// ════════════════════════════════════════════════════════
interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: keyof typeof PERMISSIONS["admin"];
}

const ProtectedRoute = ({ children, permission }: ProtectedRouteProps) => {
  const token = localStorage.getItem("token");
  const user  = getCurrentUser();

  if (!token || !user) return <Navigate to="/login" replace />;

  if (permission) {
    const perms = PERMISSIONS[user.role as UserRole] ?? PERMISSIONS["user"];
    if (!perms[permission]) return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const P = ({ children, permission }: ProtectedRouteProps) => (
  <ProtectedRoute permission={permission}>
    <MainLayout>{children}</MainLayout>
  </ProtectedRoute>
);

// ════════════════════════════════════════════════════════
// App
// ════════════════════════════════════════════════════════
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public ── */}
        <Route path="/"      element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* ── Dashboard ── */}
        <Route path="/dashboard" element={<P><Dashboard /></P>} />

        {/* ── Tickets ── */}
        <Route path="/tickets/admin-queue" element={<P permission="canSeeAdminQueue"><AdminQueue /></P>} />
        <Route path="/tickets/all"         element={<P permission="canSeeAllTickets"><AllTickets /></P>} />
        <Route path="/tickets/create"      element={<P><CreateTicket /></P>} />
        <Route path="/tickets/my"          element={<P><MyTickets /></P>} />
        <Route path="/tickets/assigned"    element={<P><AssignedTickets /></P>} />
        <Route path="/tickets/history"     element={<P permission="canSeeAllTickets"><TicketHistory /></P>} />
        <Route path="/tickets/:id"         element={<P><TicketDetails /></P>} />

        {/* ── Teams ── */}
        <Route path="/teams"             element={<P permission="canSeeTeam"><TeamsPage /></P>} />
        <Route path="/teams/members"     element={<P permission="canSeeTeam"><TeamMembers /></P>} />
        <Route path="/teams/tickets"     element={<P permission="canSeeTeam"><TeamTickets /></P>} />
        <Route path="/teams/workload"    element={<P permission="canSeeTeam"><TeamWorkload /></P>} />
        <Route path="/teams/analytics"   element={<P permission="canSeeTeamAnalytics"><TeamAnalytics /></P>} />

        {/* ── Projects ── */}
        <Route path="/projects"            element={<P permission="canSeeProjects"><Projects /></P>} />
        <Route path="/projects/tasks"      element={<P permission="canSeeProjects"><ProjectTasks /></P>} />
        <Route path="/projects/kanban"     element={<P permission="canSeeProjects"><ProjectKanban /></P>} />
        <Route path="/projects/analytics"  element={<P permission="canSeeProjectAnalytics"><ProjectAnalytics /></P>} />
        <Route path="/projects/:id"        element={<P permission="canSeeProjects"><ProjectDetail /></P>} />

        {/* ── Knowledge Base ── */}
        <Route path="/knowledge-base"           element={<P permission="canSeeKnowledgeBase"><KnowledgeBase /></P>} />
        <Route path="/knowledge-base/create"    element={<P permission="canManageKnowledge"><KnowledgeBaseCreate /></P>} />
        <Route path="/knowledge-base/:id/edit"  element={<P permission="canManageKnowledge"><KnowledgeBaseCreate /></P>} />
        <Route path="/knowledge-base/:id"       element={<P permission="canSeeKnowledgeBase"><KnowledgeBaseArticle /></P>} />

        {/* ── AI Assistant ── */}
        <Route path="/ai-assistant" element={<P><AIAssistant /></P>} />

        {/* ── Analytics (global — admin/leader) ── */}
        <Route path="/analytics" element={<P permission="canSeeAnalytics"><Analytics /></P>} />

        {/* ── Admin ── */}
        <Route path="/users"           element={<P permission="canSeeUsers"><Users /></P>} />
        <Route path="/company-context" element={<P permission="canManageUsers"><CompanyContext /></P>} />

        {/* ── Profile ── */}
        <Route path="/profile" element={<P><Profile /></P>} />

        {/* ── Settings ── */}
        <Route path="/settings" element={<P><Settings /></P>} />

        {/* ── Redirects for backward compat ── */}
        <Route path="/Dashbord"   element={<Navigate to="/dashboard"  replace />} />
        <Route path="/team"       element={<Navigate to="/teams"      replace />} />
        <Route path="/team/*"     element={<Navigate to="/teams"      replace />} />
        <Route path="/my-tickets" element={<Navigate to="/tickets/my" replace />} />

        {/* ── 404 ── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
