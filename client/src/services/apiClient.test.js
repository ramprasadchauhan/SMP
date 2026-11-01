import { afterEach, describe, expect, it, vi } from "vitest";
import { api, setSessionEndedHandler, toApiError } from "./apiClient";

const respond = (status, data, headers = {}) =>
  vi.fn(async (config) => {
    const response = { status, data, headers, config, statusText: "" };
    if (status >= 400) {
      const err = new Error(`Request failed with status ${status}`);
      err.response = response;
      err.config = config;
      err.isAxiosError = true;
      throw err;
    }
    return response;
  });

afterEach(() => setSessionEndedHandler(() => {}));

describe("api client", () => {
  it("sends credentials and the CSRF header", async () => {
    const adapter = respond(200, { success: true, data: {} });
    await api.get("/x", { adapter });
    const config = adapter.mock.calls[0][0];
    expect(config.withCredentials).toBe(true);
    expect(config.headers["X-Requested-With"]).toBe("XMLHttpRequest");
    expect(config.baseURL).toBe("/api/v1");
  });

  it("normalises server errors into ApiError with code and message", async () => {
    const adapter = respond(422, { success: false, code: "VALIDATION_ERROR", message: "Enter a valid email address", details: [{ field: "email" }] });
    await expect(api.post("/auth/login", {}, { adapter })).rejects.toMatchObject({
      name: "ApiError",
      status: 422,
      code: "VALIDATION_ERROR",
      message: "Enter a valid email address",
    });
  });

  it("rejects HTML responses to API calls instead of treating them as data", async () => {
    const adapter = respond(200, "<!doctype html><html></html>");
    await expect(api.get("/auth/me", { adapter })).rejects.toMatchObject({ code: "UNEXPECTED_RESPONSE" });
  });

  it("ends the session on 401 SESSION_EXPIRED, but not on wrong credentials or plain 403", async () => {
    const ended = vi.fn();
    setSessionEndedHandler(ended);
    await expect(api.get("/products/mine", { adapter: respond(401, { code: "SESSION_EXPIRED", message: "expired" }) })).rejects.toBeTruthy();
    expect(ended).toHaveBeenCalledTimes(1);

    await expect(api.post("/auth/login", {}, { adapter: respond(401, { code: "INVALID_CREDENTIALS", message: "bad" }) })).rejects.toBeTruthy();
    await expect(api.get("/users", { adapter: respond(403, { code: "FORBIDDEN", message: "no" }) })).rejects.toBeTruthy();
    expect(ended).toHaveBeenCalledTimes(1);

    await expect(api.get("/products/mine", { adapter: respond(403, { code: "ACCOUNT_BLOCKED", message: "blocked" }) })).rejects.toBeTruthy();
    expect(ended).toHaveBeenCalledTimes(2);
  });

  it("describes network failures and timeouts", () => {
    expect(toApiError({ code: "ECONNABORTED" })).toMatchObject({ code: "TIMEOUT" });
    expect(toApiError({ message: "Network Error" })).toMatchObject({ code: "NETWORK_ERROR" });
  });
});
