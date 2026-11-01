import { theme as antdTheme } from "antd";

// Keep in sync with the CSS variables in src/index.css.
const palettes = {
  light: {
    bg: "#f5f6f8",
    surface: "#ffffff",
    surface2: "#f8fafc",
    border: "#e4e7ec",
    text: "#101828",
    muted: "#5d6676",
    primary: "#0f766e",
  },
  dark: {
    bg: "#0b0e13",
    surface: "#12161d",
    surface2: "#161b23",
    border: "#242b36",
    text: "#e6e9ef",
    muted: "#a3acba",
    primary: "#2fb5a5",
  },
};

export function buildTheme(mode) {
  const p = palettes[mode];
  return {
    algorithm: mode === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: p.primary,
      colorInfo: p.primary,
      colorLink: p.primary,
      colorBgLayout: p.bg,
      colorBgContainer: p.surface,
      colorBgElevated: p.surface,
      colorBorder: mode === "dark" ? "#323b48" : "#d0d5dd",
      colorBorderSecondary: p.border,
      colorText: p.text,
      colorTextSecondary: p.muted,
      colorError: mode === "dark" ? "#f87171" : "#d92d20",
      colorSuccess: mode === "dark" ? "#4ade80" : "#15803d",
      colorWarning: mode === "dark" ? "#fbbf24" : "#b45309",
      borderRadius: 8,
      borderRadiusLG: 12,
      controlHeight: 36,
      fontFamily: "var(--font-sans)",
      fontSize: 14,
      motionDurationMid: "0.18s",
      boxShadowSecondary: "var(--shadow-md)",
    },
    components: {
      Layout: { headerBg: p.surface, siderBg: p.surface, bodyBg: p.bg, headerPadding: "0 20px", headerHeight: 60 },
      Menu: {
        itemBg: "transparent",
        itemBorderRadius: 8,
        itemMarginInline: 8,
        itemHeight: 38,
        itemSelectedBg: mode === "dark" ? "#11302d" : "#e6f4f2",
        itemSelectedColor: mode === "dark" ? "#7fdcd0" : "#0b5c55",
        groupTitleColor: p.muted,
        groupTitleFontSize: 11,
      },
      Table: { headerBg: p.surface2, headerSplitColor: "transparent", rowHoverBg: mode === "dark" ? "#1b212b" : "#f8fafc" },
      Card: { headerFontSize: 15 },
      Button: { fontWeight: 500, primaryShadow: "none", defaultShadow: "none", dangerShadow: "none" },
      Segmented: { itemSelectedBg: p.surface, trackBg: mode === "dark" ? "#0b0e13" : "#eef0f3" },
      Modal: { titleFontSize: 17 },
    },
  };
}
