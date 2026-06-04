// frontend/src/pages/teams/TeamsPage.tsx
import AdminTeamsView from "./AdminTeamsView";
import TeamDashboard  from "./TeamDashboard";

export default function TeamsPage() {
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  if (user?.role === "admin") return <AdminTeamsView />;
  return <TeamDashboard />;
}
