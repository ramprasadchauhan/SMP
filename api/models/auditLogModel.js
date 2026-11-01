import mongoose from "mongoose";

// Append-only record of administrative actions. Holds only non-sensitive
// metadata: never passwords, tokens or full request bodies.
const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    actorName: String,
    action: { type: String, required: true },
    targetType: { type: String, enum: ["user", "product"], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    targetLabel: String,
    changes: { type: mongoose.Schema.Types.Mixed },
    requestId: String,
  },
  { timestamps: { createdAt: true, updatedAt: false }, toJSON: { versionKey: false } }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
