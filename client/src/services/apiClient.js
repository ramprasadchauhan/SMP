import axios from "axios";

// Normalised error thrown by every API call. Components can rely on
// `status`, `code` and a user-safe `message`.
export class ApiError extends Error {
  constructor({ status = 0, code = "NETWORK_ERROR", message, details, requestId }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

// Codes that mean the current session is over (vs. "you lack permission").
const SESSION_ENDING = new Set(["AUTH_REQUIRED", "INVALID_SESSION", "SESSION_EXPIRED", "SESSION_REVOKED", "ACCOUNT_BLOCKED"]);

let onSessionEnded = () => {};
export const setSessionEndedHandler = (fn) => {
  onSessionEnded = fn;
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
  // The session lives in an HttpOnly cookie; the app never sees the token.
  withCredentials: true,
  timeout: 20000,
  headers: { "X-Requested-With": "XMLHttpRequest" },
});

export function toApiError(error) {
  if (error instanceof ApiError) return error;
  if (axios.isCancel(error)) return new ApiError({ code: "CANCELLED", message: "Request cancelled" });
  const res = error.response;
  if (!res) {
    const timedOut = error.code === "ECONNABORTED";
    return new ApiError({
      code: timedOut ? "TIMEOUT" : "NETWORK_ERROR",
      message: timedOut
        ? "The server took too long to respond. Please try again."
        : "Unable to reach the server. Check your connection and try again.",
    });
  }
  const body = res.data && typeof res.data === "object" ? res.data : {};
  return new ApiError({
    status: res.status,
    code: body.code || (res.status >= 500 ? "SERVER_ERROR" : "REQUEST_FAILED"),
    message:
      body.message || (res.status >= 500 ? "Something went wrong on our side. Please try again." : "The request failed."),
    details: body.details,
    requestId: body.requestId,
  });
}

api.interceptors.response.use(
  (response) => {
    // Guard against a misconfigured server answering API calls with the SPA
    // HTML shell (the cause of the original blank screen / logout loop).
    if (typeof response.data === "string" && response.config.responseType !== "blob") {
      return Promise.reject(
        new ApiError({ status: response.status, code: "UNEXPECTED_RESPONSE", message: "The server returned an unexpected response." })
      );
    }
    return response;
  },
  (error) => {
    const err = toApiError(error);
    const isAuthProbe = error.config?.url === "/auth/me";
    if (!isAuthProbe && (err.status === 401 || (err.status === 403 && err.code === "ACCOUNT_BLOCKED")) && SESSION_ENDING.has(err.code)) {
      onSessionEnded(err);
    }
    return Promise.reject(err);
  }
);

// Unwraps the `{ success, data, meta }` envelope.
export const unwrap = (promise) => promise.then((res) => res.data);

export async function downloadFile(url, params, fallbackName) {
  const res = await api.get(url, { params, responseType: "blob", paramsSerializer: { indexes: null } });
  const disposition = res.headers["content-disposition"] || "";
  const name = /filename="([^"]+)"/.exec(disposition)?.[1] || fallbackName;
  const href = URL.createObjectURL(res.data);
  const a = Object.assign(document.createElement("a"), { href, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}
