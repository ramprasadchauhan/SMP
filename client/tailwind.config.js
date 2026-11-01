/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        "surface-hover": "var(--surface-hover)",
        line: "var(--border)",
        "line-strong": "var(--border-strong)",
        fg: "var(--text)",
        muted: "var(--text-muted)",
        subtle: "var(--text-subtle)",
        primary: "var(--primary)",
        "primary-soft": "var(--primary-soft)",
        "primary-soft-fg": "var(--primary-soft-text)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
      },
      fontFamily: {
        sans: "var(--font-sans)",
      },
    },
  },
  plugins: [],
  // Ant Design ships its own reset; Tailwind's preflight would fight it.
  corePlugins: {
    preflight: false,
  },
};
