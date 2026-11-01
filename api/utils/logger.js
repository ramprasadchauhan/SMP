import env from "../config/env.js";

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };
const threshold = LEVELS[env.LOG_LEVEL || (env.isTest ? "silent" : env.isProduction ? "info" : "debug")];

// Keys that must never reach logs, even if passed accidentally in metadata.
const REDACT = /pass(word)?|token|secret|authorization|cookie/i;

function scrub(meta) {
  if (!meta || typeof meta !== "object") return meta;
  const out = {};
  for (const [k, v] of Object.entries(meta)) {
    out[k] = REDACT.test(k) ? "[redacted]" : v instanceof Error ? { message: v.message, stack: v.stack } : v;
  }
  return out;
}

function write(level, msg, meta) {
  if (LEVELS[level] < threshold) return;
  const entry = { level, time: new Date().toISOString(), msg, ...scrub(meta) };
  const stream = level === "error" || level === "warn" ? process.stderr : process.stdout;
  if (env.isProduction) {
    stream.write(JSON.stringify(entry) + "\n");
  } else {
    const { level: _l, time: _t, msg: _m, ...rest } = entry;
    const extra = Object.keys(rest).length ? " " + JSON.stringify(rest) : "";
    stream.write(`[${level}] ${msg}${extra}\n`);
  }
}

export const logger = {
  debug: (msg, meta) => write("debug", msg, meta),
  info: (msg, meta) => write("info", msg, meta),
  warn: (msg, meta) => write("warn", msg, meta),
  error: (msg, meta) => write("error", msg, meta),
};
