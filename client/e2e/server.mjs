// Serves the production build from the real Express app, backed by an
// in-memory MongoDB with fixtures. Exercises the exact production path
// (static files + SPA fallback + API) that caused the original blank screen.
process.env.NODE_ENV = "production";
process.env.PORT = process.env.E2E_PORT || "8765";
process.env.RATE_LIMIT_ENABLED = "false";
process.env.LOG_LEVEL = "warn";
process.chdir(new URL("../..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
await import("../../api/scripts/dev-memory.js");
