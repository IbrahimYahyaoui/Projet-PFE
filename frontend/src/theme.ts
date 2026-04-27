// ── Thème Desert Sand ──
export const C = {
  bg: "#1C1410",
  card: "#241A12",
  border: "rgba(245,158,11,0.12)",
  accent: "#F59E0B",
  accentHover: "#D97706",
  textPrimary: "#FEF3C7",
  textSecondary: "rgba(254,243,199,0.5)",
  textMuted: "rgba(254,243,199,0.3)",
  tableHeader: "rgba(245,158,11,0.06)",
  hoverBg: "rgba(245,158,11,0.08)",
  iconBg: "rgba(245,158,11,0.15)",
  danger: "#c62828",
  dangerBg: "rgba(198,40,40,0.1)",
};

export const statusColors: Record<string, { bg: string; text: string }> = {
  open: { bg: "rgba(245,158,11,0.15)", text: "#F59E0B" },
  in_progress: { bg: "rgba(180,83,9,0.2)", text: "#D97706" },
  resolved: { bg: "rgba(120,53,15,0.2)", text: "#B45309" },
  closed: { bg: "rgba(254,243,199,0.08)", text: "rgba(254,243,199,0.4)" },
};

export const priorityColors: Record<string, { bg: string; text: string }> = {
  low: { bg: "rgba(245,158,11,0.15)", text: "#F59E0B" },
  medium: { bg: "rgba(180,83,9,0.2)", text: "#D97706" },
  high: { bg: "rgba(255,152,0,0.15)", text: "#e65100" },
  critical: { bg: "rgba(198,40,40,0.15)", text: "#c62828" },
};