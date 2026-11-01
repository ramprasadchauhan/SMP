import { defineConfig } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT || 8765);

// Runs against the locally installed Chrome so no browser download is needed.
// Run `npm run build` first; the server below serves client/dist.
export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    channel: process.env.PW_CHANNEL || "chrome",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node e2e/server.mjs",
    url: `http://127.0.0.1:${PORT}/api/v1/health`,
    // First run may download the MongoDB binary for mongodb-memory-server.
    timeout: 600_000,
    reuseExistingServer: false,
    stdout: "ignore",
    stderr: "pipe",
    env: { E2E_PORT: String(PORT) },
  },
});
