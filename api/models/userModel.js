import mongoose from "mongoose";
import { ROLES, ROLE_VALUES, USER_STATUS, USER_STATUS_VALUES } from "../constants/index.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    // bcrypt hash; never selected unless explicitly requested.
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ROLE_VALUES,
      default: ROLES.USER,
    },
    status: {
      type: String,
      enum: USER_STATUS_VALUES,
      default: USER_STATUS.ACTIVE,
    },
    profilePicture: {
      type: String,
      default: "",
    },
    // Incremented to revoke every session issued before the change
    // (block, password change). Embedded in the JWT as `tv`.
    tokenVersion: {
      type: Number,
      default: 0,
      select: false,
    },
    lastLoginAt: Date,
    statusChangedAt: Date,
    statusChangedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.tokenVersion;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.index({ role: 1, status: 1 });
userSchema.index({ createdAt: -1 });

const User = mongoose.model("User", userSchema);
export default User;
