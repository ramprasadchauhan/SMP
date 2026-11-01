// Builds RFC 4180 CSV and neutralises spreadsheet formula injection (CWE-1236).
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export const csvCell = (value) => {
  if (value === null || value === undefined) return "";
  let s = value instanceof Date ? value.toISOString() : String(value);
  if (FORMULA_PREFIX.test(s)) s = "'" + s;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const toCsv = (columns, rows) => {
  const header = columns.map((c) => csvCell(c.label)).join(",");
  const lines = rows.map((row) => columns.map((c) => csvCell(c.value(row))).join(","));
  return [header, ...lines].join("\r\n") + "\r\n";
};

export const sendCsv = (res, filename, csv) => {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send("﻿" + csv);
};
