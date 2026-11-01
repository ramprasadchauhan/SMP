import fs from "node:fs";
import path from "node:path";
import express from "express";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import env from "./config/env.js";
import apiRoutes from "./routes/index.js";
import { requestContext } from "./middleware/requestContext.js";
import { csrfGuard } from "./middleware/csrf.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { apiNotFound, errorHandler } from "./middleware/errorHandler.js";

// Optional CORS for deployments where the client runs on another origin.
// Only explicitly configured origins are allowed (never "*").
const cors = (req, res, next) => {
  const origin = req.get("origin");
  if (origin && env.corsOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type,X-Requested-With,X-Request-Id");
      return res.sendStatus(204);
    }
  }
  next();
};

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", env.TRUST_PROXY);
  // "simple" parsing never produces nested objects from query strings, which
  // removes the `?field[$ne]=x` operator-injection vector entirely.
  app.set("query parser", "simple");

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "img-src": ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
          // Ant Design injects component styles at runtime.
          "style-src": ["'self'", "'unsafe-inline'"],
          // HTTPS redirection belongs to the hosting platform (HSTS is still
          // sent); upgrading here would break local production-mode runs.
          "upgrade-insecure-requests": null,
        },
      },
    })
  );
  app.use(compression());
  app.use(requestContext);
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  const api = express.Router();
  api.use(cors, apiLimiter, csrfGuard);
  api.use("/v1", apiRoutes);
  api.use(apiNotFound);
  app.use("/api", api);

  // The SPA is served only after every /api route has been registered, so a
  // client-side fallback can never shadow API responses.
  const dist = path.resolve("client", "dist");
  if (env.isProduction && fs.existsSync(path.join(dist, "index.html"))) {
    app.use(express.static(dist, { index: false, maxAge: "1h" }));
    app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
  }

  app.use(errorHandler);
  return app;
}
