// frontend/src/theme.ts
export type UserRole = "admin" | "tech" | "user" | "leader";

export const C = {
  bg: "#FFFFFF",
  bgPage: "#F4F6FA",
  bgHover: "#F0F4FF",
  card: "#FFFFFF",
  sidebar: "#1C2942",
  sidebarHover: "#243552",
  sidebarActive: "#2D4163",
  sidebarText: "rgba(255,255,255,0.65)",
  sidebarTextActive: "#FFFFFF",
  sidebarBorder: "rgba(255,255,255,0.08)",
  navbar: "#1C2942",
  navbarBorder: "rgba(255,255,255,0.08)",
  border: "#E4E9F2",
  borderStrong: "#C8D0E0",
  divider: "#F0F4FA",
  accent: "#5FC2BA",
  accentHover: "#4AADA5",
  accentLight: "rgba(95, 194, 186, 0.10)",
  accentMid: "rgba(95, 194, 186, 0.18)",
  navy: "#0B162C",
  navyMid: "#1C2942",
  slate: "#3B556D",
  textPrimary: "#0B162C",
  textSecondary: "#3B556D",
  textMuted: "#8896AB",
  danger: "#EF4444",
  dangerBg: "rgba(239, 68, 68, 0.08)",
  dangerHover: "#DC2626",
  success: "#22C55E",
  successBg: "rgba(34, 197, 94, 0.08)",
  warning: "#F97316",
  warningBg: "rgba(249, 115, 22, 0.08)",
  info: "#3B82F6",
  infoBg: "rgba(59, 130, 246, 0.08)",
  shadow: "0 2px 12px rgba(11, 22, 44, 0.08)",
  shadowMd: "0 4px 24px rgba(11, 22, 44, 0.12)",
  shadowLg: "0 8px 40px rgba(11, 22, 44, 0.16)",
};

export const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  open: {
    bg: "rgba(95, 194, 186, 0.10)",
    text: "#0E9188",
    border: "rgba(95, 194, 186, 0.30)",
  },
  pending: {
    bg: "rgba(124, 58, 237, 0.08)",
    text: "#7C3AED",
    border: "rgba(124, 58, 237, 0.20)",
  },
  assigned: {
    bg: "rgba(59, 130, 246, 0.10)",
    text: "#2563EB",
    border: "rgba(59, 130, 246, 0.25)",
  },
  in_progress: {
    bg: "rgba(249, 115, 22, 0.10)",
    text: "#EA580C",
    border: "rgba(249, 115, 22, 0.25)",
  },
  waiting: {
    bg: "rgba(234, 179, 8, 0.10)",
    text: "#B45309",
    border: "rgba(234, 179, 8, 0.30)",
  },
  resolved: {
    bg: "rgba(34, 197, 94, 0.10)",
    text: "#16A34A",
    border: "rgba(34, 197, 94, 0.25)",
  },
  closed: {
    bg: "rgba(148, 163, 184, 0.10)",
    text: "#64748B",
    border: "rgba(148, 163, 184, 0.25)",
  },
};

export const priorityColors: Record<string, { bg: string; text: string; border: string }> = {
  low: {
    bg: "rgba(34, 197, 94, 0.10)",
    text: "#16A34A",
    border: "rgba(34, 197, 94, 0.25)",
  },
  medium: {
    bg: "rgba(59, 130, 246, 0.10)",
    text: "#2563EB",
    border: "rgba(59, 130, 246, 0.25)",
  },
  high: {
    bg: "rgba(249, 115, 22, 0.10)",
    text: "#EA580C",
    border: "rgba(249, 115, 22, 0.25)",
  },
  critical: {
    bg: "rgba(239, 68, 68, 0.08)",
    text: "#DC2626",
    border: "rgba(239, 68, 68, 0.20)",
  },
};

export const roleColors: Record<string, { bg: string; text: string; border: string }> = {
  admin: {
    bg: "rgba(95, 194, 186, 0.10)",
    text: "#0E9188",
    border: "rgba(95, 194, 186, 0.25)",
  },
  leader: {
    bg: "rgba(59, 130, 246, 0.10)",
    text: "#2563EB",
    border: "rgba(59, 130, 246, 0.25)",
  },
  tech: {
    bg: "rgba(249, 115, 22, 0.10)",
    text: "#EA580C",
    border: "rgba(249, 115, 22, 0.25)",
  },
  user: {
    bg: "rgba(124, 58, 237, 0.10)",
    text: "#7C3AED",
    border: "rgba(124, 58, 237, 0.20)",
  },
};

export const chartColors = {
  green: "#22C55E",
  blue: "#3B82F6",
  red: "#EF4444",
  orange: "#F97316",
  teal: "#5FC2BA",
  navy: "#1C2942",
  purple: "#8B5CF6",
};

export const PERMISSIONS: Record<UserRole, {
  // Visibility
  canSeeUsers: boolean;
  canSeeAllTickets: boolean;
  canSeeAnalytics: boolean;
  canSeeTeam: boolean;
  canSeeProjects: boolean;
  canSeeKnowledgeBase: boolean;
  // Ticket navigation
  canCreateTicket: boolean;
  canSeeMyTickets: boolean;
  canSeeAssignedTickets: boolean;
  // Ticket actions
  canManageUsers: boolean;
  canAssignTickets: boolean;
  canAssignToTeam: boolean;
  canResolveTickets: boolean;
  canEscalateTickets: boolean;
  canSeeAdminQueue: boolean;
  // Knowledge Base
  canManageKnowledge: boolean;
  // Analytics
  canSeeTeamAnalytics: boolean;
  canSeeProjectAnalytics: boolean;
  // Projects
  canCreateProjects: boolean;
  canManageProjects: boolean;
  // Teams
  canManageTeams: boolean;
  canSeeTeamDashboard: boolean;
  canManageTeamMembers: boolean;
}> = {
  admin: {
    canSeeUsers: true,
    canSeeAllTickets: true,
    canSeeAnalytics: true,
    canSeeTeam: true,
    canSeeProjects: true,
    canSeeKnowledgeBase: true,
    canCreateTicket: true,
    canSeeMyTickets: true,
    canSeeAssignedTickets: true,
    canManageUsers: true,
    canAssignTickets: true,
    canAssignToTeam: true,
    canResolveTickets: true,
    canEscalateTickets: true,
    canSeeAdminQueue: true,
    canManageKnowledge: true,
    canSeeTeamAnalytics: true,
    canSeeProjectAnalytics: true,
    canCreateProjects: true,
    canManageProjects: true,
    canManageTeams: true,
    canSeeTeamDashboard: false,
    canManageTeamMembers: true,
  },
  leader: {
    canSeeUsers: false,
    canSeeAllTickets: false,
    canSeeAnalytics: true,
    canSeeTeam: true,
    canSeeProjects: true,
    canSeeKnowledgeBase: true,
    canCreateTicket: false,
    canSeeMyTickets: false,
    canSeeAssignedTickets: true,
    canManageUsers: false,
    canAssignTickets: true,
    canAssignToTeam: false,
    canResolveTickets: true,
    canEscalateTickets: true,
    canSeeAdminQueue: false,
    canManageKnowledge: true,
    canSeeTeamAnalytics: true,
    canSeeProjectAnalytics: true,
    canCreateProjects: false,
    canManageProjects: true,
    canManageTeams: false,
    canSeeTeamDashboard: true,
    canManageTeamMembers: true,
  },
  tech: {
    canSeeUsers: false,
    canSeeAllTickets: false,
    canSeeAnalytics: false,
    canSeeTeam: true,
    canSeeProjects: false,
    canSeeKnowledgeBase: true,
    canCreateTicket: false,
    canSeeMyTickets: false,
    canSeeAssignedTickets: true,
    canManageUsers: false,
    canAssignTickets: false,
    canAssignToTeam: false,
    canResolveTickets: true,
    canEscalateTickets: false,
    canSeeAdminQueue: false,
    canManageKnowledge: false,
    canSeeTeamAnalytics: false,
    canSeeProjectAnalytics: false,
    canCreateProjects: false,
    canManageProjects: false,
    canManageTeams: false,
    canSeeTeamDashboard: true,
    canManageTeamMembers: false,
  },
  user: {
    canSeeUsers: false,
    canSeeAllTickets: false,
    canSeeAnalytics: false,
    canSeeTeam: false,
    canSeeProjects: false,
    canSeeKnowledgeBase: true,
    canCreateTicket: true,
    canSeeMyTickets: true,
    canSeeAssignedTickets: false,
    canManageUsers: false,
    canAssignTickets: false,
    canAssignToTeam: false,
    canResolveTickets: false,
    canEscalateTickets: false,
    canSeeAdminQueue: false,
    canManageKnowledge: false,
    canSeeTeamAnalytics: false,
    canSeeProjectAnalytics: false,
    canCreateProjects: false,
    canManageProjects: false,
    canManageTeams: false,
    canSeeTeamDashboard: false,
    canManageTeamMembers: false,
  },
};