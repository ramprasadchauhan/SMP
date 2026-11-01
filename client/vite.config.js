import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    server: {
      proxy: {
        // Same-origin API in development, so the session cookie just works.
        "/api": {
          target: env.VITE_API_PROXY_TARGET || "http://localhost:8000",
          changeOrigin: false,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          // Stable vendor chunks cache well across deploys.
          manualChunks: {
            react: ["react", "react-dom", "react-router-dom", "react-redux", "@reduxjs/toolkit", "@tanstack/react-query"],
            charts: ["recharts"],
          },
        },
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test/setup.js"],
      include: ["src/**/*.test.{js,jsx}"],
      css: false,
      // Typing into Ant Design inputs under jsdom is slow.
      testTimeout: 20000,
    },
  };
});
