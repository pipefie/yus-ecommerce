export const designTokens = {
  colors: {
    background: "#020611",
    surface: "#070d1f",
    surfaceSoft: "#0b122b",
    card: "rgba(255,255,255,0.03)",
    primary: "#95ff26",
    primaryForeground: "#0b1205",
    accent: "#ff66d9",
    accentForeground: "#0e031b",
    highlight: "#2dd4bf",
    muted: "#94a3b8",
    foreground: "#f8fafc",
    border: "rgba(255,255,255,0.12)",
    focus: "#7c3aed",
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
  },
  typography: {
    fontFamily: {
      sans: 'var(--font-geist-sans, "Inter", system-ui, -apple-system, BlinkMacSystemFont)',
      mono: 'var(--font-geist-mono, "JetBrains Mono", "SFMono-Regular", Menlo, monospace)',
      display: '"Press Start 2P", cursive',
    },
    size: {
      hero: "clamp(2.75rem, 6vw, 4.25rem)",
      h1: "2.75rem",
      h2: "2rem",
      h3: "1.5rem",
      body: "1rem",
      small: "0.9rem",
      tiny: "0.75rem",
    },
    lineHeight: {
      hero: "1.05",
      tight: "1.15",
      snug: "1.3",
      normal: "1.5",
    },
    weight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  radius: {
    xs: "0.375rem",
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1.25rem",
    xl: "1.75rem",
    pill: "999px",
  },
  shadows: {
    none: "none",
    soft: "0 10px 40px rgba(2, 6, 23, 0.25)",
    medium: "0 20px 60px rgba(2, 8, 23, 0.45)",
    strong: "0 30px 90px rgba(2, 8, 23, 0.6)",
    neon: "0 0 30px rgba(149, 255, 38, 0.45)",
  },
  layout: {
    maxWidth: "1200px",
    sectionPaddingY: "4.5rem",
    sectionPaddingX: "1.25rem",
    sectionPaddingXWide: "2.5rem",
    gap: {
      sm: "0.75rem",
      md: "1.25rem",
      lg: "2rem",
      xl: "2.75rem",
    },
    gridCols: {
      content: "repeat(auto-fit, minmax(260px, 1fr))",
    },
  },
  gradients: {
    hero:
      "radial-gradient(circle at 20% 20%, #1c2b6c 0%, transparent 55%), radial-gradient(circle at 80% 0%, rgba(255, 45, 92, 0.35) 0%, transparent 45%), radial-gradient(circle at 60% 80%, rgba(53, 249, 166, 0.35) 0%, transparent 55%)",
    surface:
      "linear-gradient(145deg, rgba(255,255,255,0.02), rgba(255,255,255,0))",
    cardAccent:
      "linear-gradient(120deg, rgba(149,255,38,0.16), rgba(255,102,217,0.1), rgba(41,196,255,0.12))",
  },
} as const;

export type DesignTokens = typeof designTokens;
