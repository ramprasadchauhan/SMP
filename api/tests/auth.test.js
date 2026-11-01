import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import request from "supertest";
import User from "../models/userModel.js";
import { FIXTURE_PASSWORD, FIXTURE_USERS } from "../scripts/fixtures.js";
import { app, client, loginAs, resetDb, startDb, stopDb } from "./helpers.js";

beforeAll(startDb);
afterAll(stopDb);
beforeEach(resetDb);

const { admin, buyer, blocked } = FIXTURE_USERS;

describe("auth: login", () => {
  it("signs in with valid credentials and sets an HttpOnly session cookie", async () => {
    const res = await client().post("/api/v1/auth/login").send({ email: buyer.email, password: FIXTURE_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ email: buyer.email, role: "user" });
    expect(res.body.data.user.password).toBeUndefined();
    const cookie = res.headers["set-cookie"][0];
    expect(cookie).toMatch(/^smp_session=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
  });

  it("matches email case-insensitively", async () => {
    const res = await client().post("/api/v1/auth/login").send({ email: buyer.email.toUpperCase(), password: FIXTURE_PASSWORD });
    expect(res.status).toBe(200);
  });

  it("returns the same generic error for unknown email and wrong password", async () => {
    const unknown = await client().post("/api/v1/auth/login").send({ email: "nobody@smp.test", password: "x" });
    const wrong = await client().post("/api/v1/auth/login").send({ email: buyer.email, password: "wrong-password" });
    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(unknown.body.message).toBe(wrong.body.message);
  });

  it("rejects missing credentials with a validation error", async () => {
    const res = await client().post("/api/v1/auth/login").send({ email: "" });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("rejects operator injection in the body", async () => {
    const res = await client().post("/api/v1/auth/login").send({ email: { $ne: null }, password: { $ne: null } });
    expect(res.status).toBe(422);
  });

  it("refuses blocked accounts", async () => {
    const res = await client().post("/api/v1/auth/login").send({ email: blocked.email, password: FIXTURE_PASSWORD });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("ACCOUNT_BLOCKED");
  });

  it("records the last sign-in time", async () => {
    await loginAs(buyer.email);
    const user = await User.findOne({ email: buyer.email }).lean();
    expect(user.lastLoginAt).toBeInstanceOf(Date);
  });
});

describe("auth: session", () => {
  it("restores the user from the cookie via /auth/me", async () => {
    const c = await loginAs(buyer.email);
    const res = await c.get("/api/v1/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(buyer.email);
  });

  it("requires authentication for /auth/me", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("AUTH_REQUIRED");
  });

  it("rejects a tampered token", async () => {
    const token = jwt.sign({ userId: "000000000000000000000000" }, "some-other-secret");
    const res = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_SESSION");
  });

  it("rejects an expired token", async () => {
    const user = await User.findOne({ email: buyer.email });
    const token = jwt.sign({ userId: String(user._id), tv: 0, exp: Math.floor(Date.now() / 1000) - 60 }, process.env.JWT_SECRET);
    const res = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("SESSION_EXPIRED");
  });

  it("accepts legacy tokens without a version claim while the version is 0", async () => {
    const user = await User.findOne({ email: buyer.email });
    const token = jwt.sign({ userId: String(user._id) }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const res = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it("clears the session on logout", async () => {
    const c = await loginAs(buyer.email);
    const out = await c.post("/api/v1/auth/logout");
    expect(out.status).toBe(200);
    expect((await c.get("/api/v1/auth/me")).status).toBe(401);
  });

  it("blocks state-changing requests without the CSRF header", async () => {
    const c = await loginAs(buyer.email);
    const res = await c.agent.patch("/api/v1/auth/me").send({ name: "Changed" });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("CSRF_CHECK_FAILED");
  });
});

describe("auth: register and account", () => {
  it("registers, normalises email and signs the user in", async () => {
    const c = client();
    const res = await c.post("/api/v1/auth/register").send({ name: "New Person", email: "New.Person@SMP.test", password: "abcdef12" });
    expect(res.status).toBe(201);
    expect(res.body.data.user).toMatchObject({ email: "new.person@smp.test", role: "user", status: "active" });
    expect((await c.get("/api/v1/auth/me")).status).toBe(200);
  });

  it("ignores attempts to self-assign a role at registration", async () => {
    const res = await client().post("/api/v1/auth/register").send({ name: "Sneaky", email: "sneaky@smp.test", password: "abcdef12", role: "admin" });
    expect(res.status).toBe(422);
    expect(await User.countDocuments({ email: "sneaky@smp.test" })).toBe(0);
  });

  it("rejects duplicate emails with 409", async () => {
    const res = await client().post("/api/v1/auth/register").send({ name: "Dup", email: buyer.email, password: "abcdef12" });
    expect(res.status).toBe(409);
  });

  it("enforces the password policy for new passwords", async () => {
    const res = await client().post("/api/v1/auth/register").send({ name: "Weak", email: "weak@smp.test", password: "123456" });
    expect(res.status).toBe(422);
  });

  it("updates the profile name", async () => {
    const c = await loginAs(buyer.email);
    const res = await c.patch("/api/v1/auth/me").send({ name: "Bailey B." });
    expect(res.status).toBe(200);
    expect(res.body.data.user.name).toBe("Bailey B.");
  });

  it("changes password and revokes other sessions", async () => {
    const first = await loginAs(buyer.email);
    const second = await loginAs(buyer.email);
    const res = await first.post("/api/v1/auth/change-password").send({ currentPassword: FIXTURE_PASSWORD, newPassword: "Another#123" });
    expect(res.status).toBe(200);
    expect((await first.get("/api/v1/auth/me")).status).toBe(200);
    expect((await second.get("/api/v1/auth/me")).status).toBe(401);
    expect((await client().post("/api/v1/auth/login").send({ email: buyer.email, password: "Another#123" })).status).toBe(200);
  });

  it("rejects password change with a wrong current password", async () => {
    const c = await loginAs(buyer.email);
    const res = await c.post("/api/v1/auth/change-password").send({ currentPassword: "nope", newPassword: "Another#123" });
    expect(res.status).toBe(401);
  });
});

describe("blocking enforcement", () => {
  it("immediately revokes an active session when an admin blocks the user", async () => {
    const victim = await loginAs(buyer.email);
    const adminClient = await loginAs(admin.email);
    const user = await User.findOne({ email: buyer.email });

    expect((await victim.get("/api/v1/products/mine")).status).toBe(200);
    const res = await adminClient.patch(`/api/v1/users/${user._id}/status`).send({ status: "blocked" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("blocked");

    const after = await victim.get("/api/v1/products/mine");
    expect(after.status).toBe(403);
    expect(after.body.code).toBe("ACCOUNT_BLOCKED");
    expect((await client().post("/api/v1/auth/login").send({ email: buyer.email, password: FIXTURE_PASSWORD })).status).toBe(403);

    // Unblocking does not resurrect the old session (cookie was cleared and the version bumped).
    await adminClient.patch(`/api/v1/users/${user._id}/status`).send({ status: "active" });
    const stale = await victim.get("/api/v1/products/mine");
    expect(stale.status).toBe(401);
  });

  it("rejects a still-valid token once the account is blocked, even without a version bump", async () => {
    const victim = await loginAs(buyer.email);
    await User.updateOne({ email: buyer.email }, { $set: { status: "blocked" } });
    const res = await victim.get("/api/v1/auth/me");
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("ACCOUNT_BLOCKED");
  });
});

describe("system", () => {
  it("reports liveness and readiness", async () => {
    expect((await request(app).get("/api/v1/health")).body.data.status).toBe("ok");
    const ready = await request(app).get("/api/v1/health/ready");
    expect(ready.status).toBe(200);
    expect(ready.body.data.database).toBe("up");
  });

  it("returns JSON 404 for unknown API routes", async () => {
    const res = await request(app).get("/api/v1/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toMatch(/json/);
  });

  it("sets security headers and a request id", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.headers["x-request-id"]).toBeTruthy();
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});
