// ── TicketFlow Theme — White & Teal ──

export const C = {
  // Backgrounds
  bg: "#FFFFFF",
  bgPage: "#F8FAFC",
  card: "#FFFFFF",
  sidebar: "#FFFFFF",
  navbar: "#FFFFFF",

  // Borders
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  divider: "#F1F5F9",

  // Accent — Teal
  accent: "#5FC2BA",
  accentHover: "#4AADA5",
  accentLight: "rgba(95, 194, 186, 0.08)",
  accentMid: "rgba(95, 194, 186, 0.15)",

  // Navy
  navy: "#0B162C",
  navyMid: "#1C2942",
  slate: "#3B556D",

  // Text
  textPrimary: "#0B162C",
  textSecondary: "#3B556D",
  textMuted: "#94A3B8",

  // States
  danger: "#EF4444",
  dangerBg: "rgba(239, 68, 68, 0.08)",
  success: "#22C55E",
  successBg: "rgba(34, 197, 94, 0.08)",
  warning: "#F97316",
  warningBg: "rgba(249, 115, 22, 0.08)",
};

export const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  open: {
    bg: "rgba(95, 194, 186, 0.1)",
    text: "#0E9188",
    border: "rgba(95, 194, 186, 0.3)",
  },
  in_progress: {
    bg: "rgba(59, 130, 246, 0.1)",
    text: "#2563EB",
    border: "rgba(59, 130, 246, 0.25)",
  },
  resolved: {
    bg: "rgba(34, 197, 94, 0.1)",
    text: "#16A34A",
    border: "rgba(34, 197, 94, 0.25)",
  },
  closed: {
    bg: "rgba(148, 163, 184, 0.1)",
    text: "#64748B",
    border: "rgba(148, 163, 184, 0.25)",
  },
};

export const priorityColors: Record<string, { bg: string; text: string; border: string }> = {
  low: {
    bg: "rgba(34, 197, 94, 0.1)",
    text: "#16A34A",
    border: "rgba(34, 197, 94, 0.25)",
  },
  medium: {
    bg: "rgba(59, 130, 246, 0.1)",
    text: "#2563EB",
    border: "rgba(59, 130, 246, 0.25)",
  },
  high: {
    bg: "rgba(249, 115, 22, 0.1)",
    text: "#EA580C",
    border: "rgba(249, 115, 22, 0.25)",
  },
  critical: {
    bg: "rgba(239, 68, 68, 0.08)",
    text: "#DC2626",
    border: "rgba(239, 68, 68, 0.2)",
  },
};

export const roleColors: Record<string, { bg: string; text: string; border: string }> = {
  admin: {
    bg: "rgba(95, 194, 186, 0.1)",
    text: "#0E9188",
    border: "rgba(95, 194, 186, 0.25)",
  },
  tech: {
    bg: "rgba(59, 130, 246, 0.1)",
    text: "#2563EB",
    border: "rgba(59, 130, 246, 0.25)",
  },
  user: {
    bg: "rgba(34, 197, 94, 0.08)",
    text: "#16A34A",
    border: "rgba(34, 197, 94, 0.2)",
  },
};

export const chartColors = {
  green: "#22C55E",
  blue: "#3B82F6",
  red: "#EF4444",
  orange: "#F97316",
  teal: "#5FC2BA",
  navy: "#1C2942",
};