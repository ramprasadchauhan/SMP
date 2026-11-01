import { defineConfig } from "vitest/config";

// Backend tests. The React client has its own config in client/.
export default defineConfig({
  test: {
    include: ["api/tests/**/*.test.js"],
    setupFiles: ["api/tests/setup.js"],
    environment: "node",
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
    // Share one module graph so Mongoose models are compiled once.
    isolate: false,
    testTimeout: 30000,
    hookTimeout: 120000,
  },
});
