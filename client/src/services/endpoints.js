import { api, downloadFile, unwrap } from "./apiClient";

// Repeated query keys (`?category=a&category=b`) instead of `category[]=`.
const params = (p) => ({ params: clean(p), paramsSerializer: { indexes: null } });
const clean = (p = {}) =>
  Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && !v.length)));

export const authApi = {
  me: () => unwrap(api.get("/auth/me")),
  login: (body) => unwrap(api.post("/auth/login", body)),
  register: (body) => unwrap(api.post("/auth/register", body)),
  logout: () => unwrap(api.post("/auth/logout")),
  updateMe: (body) => unwrap(api.patch("/auth/me", body)),
  changePassword: (body) => unwrap(api.post("/auth/change-password", body)),
};

export const usersApi = {
  list: (p) => unwrap(api.get("/users", params(p))),
  get: (id) => unwrap(api.get(`/users/${id}`)),
  setStatus: (id, status) => unwrap(api.patch(`/users/${id}/status`, { status })),
  setRole: (id, role) => unwrap(api.patch(`/users/${id}/role`, { role })),
  exportCsv: (p) => downloadFile("/users/export", clean(p), "users.csv"),
};

export const productsApi = {
  marketplace: (p) => unwrap(api.get("/products", params(p))),
  mine: (p) => unwrap(api.get("/products/mine", params(p))),
  manage: (p) => unwrap(api.get("/products/manage", params(p))),
  exportCsv: (p) => downloadFile("/products/manage/export", clean(p), "products.csv"),
  get: (id) => unwrap(api.get(`/products/${id}`)),
  create: (body) => unwrap(api.post("/products", body)),
  update: (id, body) => unwrap(api.patch(`/products/${id}`, body)),
  remove: (id) => unwrap(api.delete(`/products/${id}`)),
  setStatus: (id, status) => unwrap(api.patch(`/products/${id}/status`, { status })),
  uploadImage: (id, file, onUploadProgress) => {
    const form = new FormData();
    form.append("file", file);
    return unwrap(api.post(`/products/${id}/images`, form, { onUploadProgress, timeout: 60000 }));
  },
  removeImage: (id, url) => unwrap(api.delete(`/products/${id}/images`, { data: { url } })),
  bids: (id, p) => unwrap(api.get(`/products/${id}/bids`, params(p))),
  placeBid: (id, body) => unwrap(api.post(`/products/${id}/bids`, body)),
};

export const bidsApi = {
  mine: (p) => unwrap(api.get("/bids/mine", params(p))),
  received: (p) => unwrap(api.get("/bids/received", params(p))),
};

export const notificationsApi = {
  list: (p) => unwrap(api.get("/notifications", params(p))),
  readAll: () => unwrap(api.patch("/notifications/read-all")),
  read: (id) => unwrap(api.patch(`/notifications/${id}/read`)),
  remove: (id) => unwrap(api.delete(`/notifications/${id}`)),
};

export const dashboardApi = {
  summary: (days) => unwrap(api.get("/dashboard/summary", params({ days }))),
};

export const auditApi = {
  list: (p) => unwrap(api.get("/audit-logs", params(p))),
};
