export const ROLES = Object.freeze({ USER: "user", ADMIN: "admin" });
export const ROLE_VALUES = Object.values(ROLES);

export const USER_STATUS = Object.freeze({ ACTIVE: "active", BLOCKED: "blocked" });
export const USER_STATUS_VALUES = Object.values(USER_STATUS);

export const PRODUCT_STATUS = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  BLOCKED: "blocked",
});
export const PRODUCT_STATUS_VALUES = Object.values(PRODUCT_STATUS);

// Moderation transitions an administrator may perform.
export const PRODUCT_STATUS_TRANSITIONS = Object.freeze({
  pending: ["approved", "rejected"],
  approved: ["blocked"],
  rejected: ["approved"],
  blocked: ["approved"],
});

export const PRODUCT_CATEGORIES = ["electronics", "fashion", "home", "sports", "books"];

// Age buckets (years) used by the marketplace filter.
export const PRODUCT_AGE_RANGES = {
  "0-2": [0, 2],
  "3-5": [3, 5],
  "6-8": [6, 8],
  "9-12": [9, 12],
  "13+": [13, 200],
};

export const PRODUCT_MAX_IMAGES = 10;
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const AUDIT_ACTIONS = Object.freeze({
  USER_STATUS_CHANGED: "user.status_changed",
  USER_ROLE_CHANGED: "user.role_changed",
  PRODUCT_STATUS_CHANGED: "product.status_changed",
  PRODUCT_DELETED: "product.deleted",
});

export const SESSION_COOKIE = "smp_session";
export const EXPORT_ROW_LIMIT = 5000;
