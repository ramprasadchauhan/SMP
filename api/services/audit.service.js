import AuditLog from "../models/auditLogModel.js";
import { paginationMeta } from "../utils/query.js";

export async function recordAudit(
  { actor, action, targetType, targetId, targetLabel, changes, requestId },
  session = null
) {
  await AuditLog.create(
    [{ actor: actor._id, actorName: actor.name, action, targetType, targetId, targetLabel, changes, requestId }],
    { session }
  );
}

export async function listAuditLogs({ action, targetType, targetId, page, limit }) {
  const filter = {};
  if (action) filter.action = action;
  if (targetType) filter.targetType = targetType;
  if (targetId) filter.targetId = targetId;

  const [items, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);
  return { items, meta: paginationMeta(page, limit, total) };
}
