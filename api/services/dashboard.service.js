import User from "../models/userModel.js";
import Product from "../models/productModel.js";
import Bids from "../models/bidModel.js";
import Notification from "../models/notificationModel.js";
import AuditLog from "../models/auditLogModel.js";
import { PRODUCT_STATUS_VALUES, USER_STATUS } from "../constants/index.js";

const DAY = 24 * 60 * 60 * 1000;

// Day buckets are UTC. `start` is midnight UTC `days - 1` days ago so the
// window contains exactly `days` buckets including today.
function window(days) {
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const start = new Date(todayUtc - (days - 1) * DAY);
  const prevStart = new Date(start.getTime() - days * DAY);
  return { start, prevStart, days };
}

function emptySeries({ start, days }) {
  return Array.from({ length: days }, (_, i) => new Date(start.getTime() + i * DAY).toISOString().slice(0, 10));
}

const dailyCounts = (start, match = {}) => [
  { $match: { ...match, createdAt: { $gte: start } } },
  { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
];

const rangeCounts = (start, prevStart, match = {}) => ({
  total: [{ $match: match }, { $count: "n" }],
  current: [{ $match: { ...match, createdAt: { $gte: start } } }, { $count: "n" }],
  previous: [{ $match: { ...match, createdAt: { $gte: prevStart, $lt: start } } }, { $count: "n" }],
});

const first = (arr) => arr?.[0]?.n ?? 0;
const toMap = (rows) => Object.fromEntries(rows.map((r) => [r._id, r.count]));

function mergeSeries(dates, seriesByKey) {
  return dates.map((date) => {
    const row = { date };
    for (const [key, map] of Object.entries(seriesByKey)) row[key] = map[date] || 0;
    return row;
  });
}

export async function adminSummary(days) {
  const w = window(days);
  const [users, products, bids, recentUsers, recentProducts, recentActivity] = await Promise.all([
    User.aggregate([
      {
        $facet: {
          ...rangeCounts(w.start, w.prevStart),
          byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
          byRole: [{ $group: { _id: "$role", count: { $sum: 1 } } }],
          daily: dailyCounts(w.start),
        },
      },
    ]),
    Product.aggregate([
      {
        $facet: {
          ...rangeCounts(w.start, w.prevStart),
          byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
          byCategory: [
            { $group: { _id: { $toLower: "$category" }, count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          daily: dailyCounts(w.start),
        },
      },
    ]),
    Bids.aggregate([
      {
        $facet: {
          ...rangeCounts(w.start, w.prevStart),
          daily: dailyCounts(w.start),
          volume: [{ $match: { createdAt: { $gte: w.start } } }, { $group: { _id: null, sum: { $sum: "$bidAmount" } } }],
        },
      },
    ]),
    User.find().select("name email role status createdAt").sort({ createdAt: -1 }).limit(5).lean(),
    Product.find()
      .select("name price status category images updatedAt createdAt seller")
      .populate("seller", "name")
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean(),
    AuditLog.find().sort({ createdAt: -1 }).limit(8).lean(),
  ]);

  const [u] = users;
  const [p] = products;
  const [b] = bids;
  const userStatus = toMap(u.byStatus);
  const productStatus = toMap(p.byStatus);

  return {
    range: { days, start: w.start, previousStart: w.prevStart },
    users: {
      total: first(u.total),
      active: userStatus[USER_STATUS.ACTIVE] || 0,
      blocked: userStatus[USER_STATUS.BLOCKED] || 0,
      admins: toMap(u.byRole).admin || 0,
      newInRange: first(u.current),
      newInPreviousRange: first(u.previous),
    },
    products: {
      total: first(p.total),
      byStatus: Object.fromEntries(PRODUCT_STATUS_VALUES.map((s) => [s, productStatus[s] || 0])),
      byCategory: p.byCategory.map((c) => ({ category: c._id, count: c.count })),
      newInRange: first(p.current),
      newInPreviousRange: first(p.previous),
    },
    bids: {
      total: first(b.total),
      inRange: first(b.current),
      inPreviousRange: first(b.previous),
      volumeInRange: b.volume[0]?.sum || 0,
    },
    trend: mergeSeries(emptySeries(w), {
      users: toMap(u.daily),
      products: toMap(p.daily),
      bids: toMap(b.daily),
    }),
    recentUsers,
    recentProducts,
    recentActivity,
  };
}

export async function userSummary(user, days) {
  const w = window(days);
  const [products, placed, received, unreadNotifications, recentBids] = await Promise.all([
    Product.aggregate([{ $match: { seller: user._id } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Bids.aggregate([
      { $match: { buyer: user._id } },
      { $facet: { ...rangeCounts(w.start, w.prevStart), daily: dailyCounts(w.start) } },
    ]),
    Bids.aggregate([
      { $match: { seller: user._id } },
      { $facet: { ...rangeCounts(w.start, w.prevStart), daily: dailyCounts(w.start) } },
    ]),
    Notification.countDocuments({ user: user._id, read: false }),
    Bids.find({ seller: user._id })
      .populate("product", "name images")
      .populate("buyer", "name")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);
  const productStatus = toMap(products);
  const [pl] = placed;
  const [rc] = received;

  return {
    range: { days, start: w.start, previousStart: w.prevStart },
    products: {
      total: products.reduce((sum, p) => sum + p.count, 0),
      byStatus: Object.fromEntries(PRODUCT_STATUS_VALUES.map((s) => [s, productStatus[s] || 0])),
    },
    bidsPlaced: { total: first(pl.total), inRange: first(pl.current), inPreviousRange: first(pl.previous) },
    bidsReceived: { total: first(rc.total), inRange: first(rc.current), inPreviousRange: first(rc.previous) },
    unreadNotifications,
    trend: mergeSeries(emptySeries(w), { bidsPlaced: toMap(pl.daily), bidsReceived: toMap(rc.daily) }),
    recentBidsReceived: recentBids.map((bid) => ({
      _id: bid._id,
      bidAmount: bid.bidAmount,
      createdAt: bid.createdAt,
      product: bid.product && { _id: bid.product._id, name: bid.product.name, image: bid.product.images?.[0] || null },
      buyer: bid.buyer && { _id: bid.buyer._id, name: bid.buyer.name },
    })),
  };
}
