import User from "../models/userModel.js";
import Product from "../models/productModel.js";
import Bids from "../models/bidModel.js";
import { AUDIT_ACTIONS, EXPORT_ROW_LIMIT, ROLES, USER_STATUS } from "../constants/index.js";
import { badRequest, conflict, notFound } from "../utils/AppError.js";
import { escapeRegex, paginationMeta, toSort } from "../utils/query.js";
import { runInTransaction } from "../utils/transaction.js";
import { listAuditLogs, recordAudit } from "./audit.service.js";

const PUBLIC_FIELDS = "name email role status profilePicture lastLoginAt statusChangedAt createdAt updatedAt";

// Explicit allow-list: password hashes and session versions never leave the server.
export const serializeUser = (u) =>
  u && {
    _id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    profilePicture: u.profilePicture || "",
    lastLoginAt: u.lastLoginAt || null,
    statusChangedAt: u.statusChangedAt || null,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };

function buildFilter({ q, role, status }) {
  const filter = {};
  if (role) filter.role = role;
  if (status) filter.status = status;
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ name: rx }, { email: rx }];
  }
  return filter;
}

export async function listUsers({ page, limit, sort, order, ...filters }) {
  const filter = buildFilter(filters);
  const [items, total] = await Promise.all([
    User.find(filter)
      .select(PUBLIC_FIELDS)
      .sort(toSort(sort, order))
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);
  return { items: items.map(serializeUser), meta: paginationMeta(page, limit, total) };
}

export async function exportUsers({ sort, order, ...filters }) {
  return (
    await User.find(buildFilter(filters)).select(PUBLIC_FIELDS).sort(toSort(sort, order)).limit(EXPORT_ROW_LIMIT).lean()
  ).map(serializeUser);
}

export async function getUserDetail(id) {
  const user = await User.findById(id).select(PUBLIC_FIELDS).lean();
  if (!user) throw notFound("User not found");

  const [productsByStatus, bidsPlaced, bidsReceived, activity] = await Promise.all([
    Product.aggregate([{ $match: { seller: user._id } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Bids.countDocuments({ buyer: user._id }),
    Bids.countDocuments({ seller: user._id }),
    listAuditLogs({ targetType: "user", targetId: user._id, page: 1, limit: 10 }),
  ]);

  return {
    user: serializeUser(user),
    stats: {
      products: Object.fromEntries(productsByStatus.map((p) => [p._id, p.count])),
      bidsPlaced,
      bidsReceived,
    },
    activity: activity.items,
  };
}

export async function updateUserStatus(actor, id, status, requestId) {
  if (String(actor._id) === String(id)) {
    throw badRequest("You cannot change the status of your own account", { code: "SELF_LOCKOUT" });
  }
  return runInTransaction(async (session) => {
    const user = await User.findById(id).select(`${PUBLIC_FIELDS} +tokenVersion`).session(session);
    if (!user) throw notFound("User not found");
    if (user.status === status) return serializeUser(user.toObject());

    const previous = user.status;
    const update = { status, statusChangedAt: new Date(), statusChangedBy: actor._id };
    // Blocking revokes every active session for that user immediately.
    const inc = status === USER_STATUS.BLOCKED ? { tokenVersion: 1 } : undefined;
    const updated = await User.findByIdAndUpdate(
      id,
      { $set: update, ...(inc && { $inc: inc }) },
      { new: true, session }
    )
      .select(PUBLIC_FIELDS)
      .lean();

    await recordAudit(
      {
        actor,
        action: AUDIT_ACTIONS.USER_STATUS_CHANGED,
        targetType: "user",
        targetId: user._id,
        targetLabel: user.email,
        changes: { status: { from: previous, to: status } },
        requestId,
      },
      session
    );
    return serializeUser(updated);
  });
}

export async function updateUserRole(actor, id, role, requestId) {
  if (String(actor._id) === String(id)) {
    throw badRequest("You cannot change your own role", { code: "SELF_LOCKOUT" });
  }
  return runInTransaction(async (session) => {
    const user = await User.findById(id).select(PUBLIC_FIELDS).session(session);
    if (!user) throw notFound("User not found");
    if (user.role === role) return serializeUser(user.toObject());

    if (user.role === ROLES.ADMIN) {
      const otherAdmins = await User.countDocuments({
        _id: { $ne: user._id },
        role: ROLES.ADMIN,
        status: USER_STATUS.ACTIVE,
      }).session(session);
      if (otherAdmins === 0) throw conflict("At least one active administrator is required", { code: "LAST_ADMIN" });
    }

    const previous = user.role;
    const updated = await User.findByIdAndUpdate(id, { $set: { role } }, { new: true, session })
      .select(PUBLIC_FIELDS)
      .lean();
    await recordAudit(
      {
        actor,
        action: AUDIT_ACTIONS.USER_ROLE_CHANGED,
        targetType: "user",
        targetId: user._id,
        targetLabel: user.email,
        changes: { role: { from: previous, to: role } },
        requestId,
      },
      session
    );
    return serializeUser(updated);
  });
}
