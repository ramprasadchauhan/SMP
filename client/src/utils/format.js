import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const currency = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const integer = new Intl.NumberFormat();

export const formatPrice = (n) => (typeof n === "number" ? currency.format(n) : "—");
export const formatNumber = (n) => (typeof n === "number" ? integer.format(n) : "—");
export const formatDate = (d) => (d ? dayjs(d).format("MMM D, YYYY") : "—");
export const formatDateTime = (d) => (d ? dayjs(d).format("MMM D, YYYY · h:mm A") : "—");
export const fromNow = (d) => (d ? dayjs(d).fromNow() : "—");
export const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

export const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("") || "?";

// Percentage change vs previous period; null when there is no baseline.
export const percentChange = (current, previous) =>
  previous ? Math.round(((current - previous) / previous) * 100) : null;
