import mongoose from "mongoose";
import env from "./env.js";
import { logger } from "../utils/logger.js";

mongoose.set("strictQuery", true);

const connectDB = async (uri = env.MONGO) => {
  await mongoose.connect(uri, {
    autoIndex: env.MONGO_AUTO_INDEX,
    serverSelectionTimeoutMS: 10000,
  });
  logger.info("MongoDB connected", { db: mongoose.connection.name });
  mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));
  mongoose.connection.on("reconnected", () => logger.info("MongoDB reconnected"));
};

export const isDbReady = () => mongoose.connection.readyState === 1;

export default connectDB;
