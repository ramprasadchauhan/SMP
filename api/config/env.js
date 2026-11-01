import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ quiet: true });

const bool = (fallback) =>
  z
    .enum(["true", "false", "1", "0"])
    .optional()
    .transform((v) => (v === undefined ? fallback : v === "true" || v === "1"));

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8000),
  MONGO: z.string().min(1, "MONGO (MongoDB connection string) is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  SESSION_TTL_HOURS: z.coerce.number().positive().max(24 * 30).default(24),
  CLOUD_NAME: z.string().optional(),
  CLOUD_API_KEY: z.string().optional(),
  CLOUD_API_SECRET: z.string().optional(),
  // Comma-separated list of browser origins allowed to call the API cross-origin.
  // Leave empty when the client is served from the same origin (default setup).
  CORS_ORIGINS: z.string().optional().default(""),
  // Number of reverse proxies in front of the app (e.g. 1 on Render/Heroku).
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  // Index builds are opt-in so that starting the app never alters a shared database.
  MONGO_AUTO_INDEX: bool(false),
  RATE_LIMIT_ENABLED: bool(true),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error", "silent"]).optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const problems = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  console.error(`Invalid server configuration. Check your .env file:\n${problems}`);
  process.exit(1);
}

const env = {
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === "production",
  isTest: parsed.data.NODE_ENV === "test",
  corsOrigins: parsed.data.CORS_ORIGINS.split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  cloudinaryConfigured: Boolean(
    parsed.data.CLOUD_NAME && parsed.data.CLOUD_API_KEY && parsed.data.CLOUD_API_SECRET
  ),
};

if (env.JWT_SECRET.length < 32 && env.isProduction) {
  console.warn(
    "Warning: JWT_SECRET is shorter than 32 characters. Use a long random value in production."
  );
}

export default env;
