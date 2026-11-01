import mongoose from "mongoose";
import { isDbReady } from "../config/dbConfig.js";
import { adminSummary, userSummary } from "../services/dashboard.service.js";
import { listAuditLogs } from "../services/audit.service.js";
import { ROLES } from "../constants/index.js";
import { sendSuccess } from "../utils/response.js";

// Liveness: the process is up. Exposes no configuration.
export const health = (_req, res) => {
  res.json({ success: true, data: { status: "ok", uptimeSeconds: Math.round(process.uptime()) } });
};

// Readiness: dependencies (MongoDB) are reachable.
export const ready = async (_req, res) => {
  let db = false;
  if (isDbReady()) {
    try {
      await mongoose.connection.db.admin().ping();
      db = true;
    } catch {
      db = false;
    }
  }
  res.status(db ? 200 : 503).json({ success: db, data: { status: db ? "ready" : "unavailable", database: db ? "up" : "down" } });
};

export const dashboardSummary = async (req, res) => {
  const { days } = req.valid.query;
  const data = req.user.role === ROLES.ADMIN ? await adminSummary(days) : await userSummary(req.user, days);
  sendSuccess(res, { data: { scope: req.user.role === ROLES.ADMIN ? "admin" : "user", ...data } });
};

export const auditLogs = async (req, res) => {
  const { items, meta } = await listAuditLogs(req.valid.query);
  sendSuccess(res, { data: items, meta });
};
