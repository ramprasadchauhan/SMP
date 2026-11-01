import mongoose from "mongoose";
import env from "./config/env.js";
import connectDB from "./config/dbConfig.js";
import { createApp } from "./app.js";
import { logger } from "./utils/logger.js";

async function start() {
  try {
    await connectDB();
  } catch (err) {
    logger.error("Could not connect to MongoDB. Check MONGO in .env and network access.", {
      error: err.message,
    });
    process.exit(1);
  }

  const server = createApp().listen(env.PORT, () => {
    logger.info(`API listening on port ${env.PORT}`, { env: env.NODE_ENV });
  });

  let closing = false;
  const shutdown = (signal) => {
    if (closing) return;
    closing = true;
    logger.info(`${signal} received, shutting down`);
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
    // Force exit if connections do not drain in time.
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { error: reason });
});

start();
