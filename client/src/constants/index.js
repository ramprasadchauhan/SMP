// Mirrors api/constants. Labels are presentation-only.
export const CATEGORIES = [
  { value: "electronics", label: "Electronics" },
  { value: "fashion", label: "Fashion" },
  { value: "home", label: "Home" },
  { value: "sports", label: "Sports" },
  { value: "books", label: "Books" },
];
export const categoryLabel = (v) => CATEGORIES.find((c) => c.value === v?.toLowerCase())?.label || v || "—";

export const AGE_RANGES = [
  { value: "0-2", label: "0–2 years" },
  { value: "3-5", label: "3–5 years" },
  { value: "6-8", label: "6–8 years" },
  { value: "9-12", label: "9–12 years" },
  { value: "13+", label: "13+ years" },
];

export const PRODUCT_STATUSES = ["pending", "approved", "rejected", "blocked"];
export const USER_STATUSES = ["active", "blocked"];
export const ROLES = ["user", "admin"];

// Admin moderation actions available from each product status.
export const PRODUCT_ACTIONS = {
  pending: [
    { to: "approved", label: "Approve" },
    { to: "rejected", label: "Reject", danger: true },
  ],
  approved: [{ to: "blocked", label: "Block listing", danger: true }],
  rejected: [{ to: "approved", label: "Approve" }],
  blocked: [{ to: "approved", label: "Unblock" }],
};

export const DATE_RANGES = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
  { value: 365, label: "12 months" },
];

export const AUDIT_ACTION_LABELS = {
  "user.status_changed": "User status changed",
  "user.role_changed": "User role changed",
  "product.status_changed": "Product status changed",
  "product.deleted": "Product deleted",
};
