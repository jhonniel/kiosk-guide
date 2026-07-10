export const KIOSK_COLORS = {
  navy: "#1a2744",
  navyDark: "#0f1a2e",
  navyLight: "#243352",
  green: "#22c55e",
  greenDark: "#16a34a",
  background: "#eef2f7",
  searchBg: "#dce8f5",
  white: "#ffffff",
  card: {
    blue: { bg: "#eff6ff", icon: "#2563eb", text: "#1d4ed8" },
    green: { bg: "#f0fdf4", icon: "#16a34a", text: "#15803d" },
    teal: { bg: "#f0fdfa", icon: "#0d9488", text: "#0f766e" },
    purple: { bg: "#faf5ff", icon: "#9333ea", text: "#7e22ce" },
    orange: { bg: "#fff7ed", icon: "#ea580c", text: "#c2410c" },
    "red-orange": { bg: "#fff7ed", icon: "#f97316", text: "#ea580c" },
    sky: { bg: "#f0f9ff", icon: "#0284c7", text: "#0369a1" },
    pink: { bg: "#fdf2f8", icon: "#db2777", text: "#be185d" },
    red: { bg: "#fef2f2", icon: "#dc2626", text: "#b91c1c" },
    violet: { bg: "#f5f3ff", icon: "#7c3aed", text: "#6d28d9" },
    amber: { bg: "#fffbeb", icon: "#d97706", text: "#b45309" },
  },
} as const;

export type CardColor = keyof typeof KIOSK_COLORS.card;
