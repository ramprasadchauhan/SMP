import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import User from "../models/userModel.js";
import AuditLog from "../models/auditLogModel.js";
import { FIXTURE_USERS } from "../scripts/fixtures.js";
import { loginAs, resetDb, startDb, stopDb } from "./helpers.js";

beforeAll(startDb);
afterAll(stopDb);
beforeEach(resetDb);

const { admin, admin2, buyer } = FIXTURE_USERS;
const idOf = async (email) => String((await User.findOne({ email }))._id);

describe("user management authorization", () => {
  it("forbids normal users from listing users", async () => {
    const c = await loginAs(buyer.email);
    expect((await c.get("/api/v1/users")).status).toBe(403);
  });

  it("forbids normal users from changing anyone's status or role", async () => {
    const c = await loginAs(buyer.email);
    const self = await idOf(buyer.email);
    expect((await c.patch(`/api/v1/users/${self}/role`).send({ role: "admin" })).status).toBe(403);
    expect((await c.patch(`/api/v1/users/${await idOf(admin.email)}/status`).send({ status: "blocked" })).status).toBe(403);
    expect((await User.findById(self)).role).toBe("user");
  });

  it("rejects arbitrary fields in a status update (no mass assignment)", async () => {
    const c = await loginAs(admin.email);
    const id = await idOf(buyer.email);
    const res = await c.patch(`/api/v1/users/${id}/status`).send({ status: "active", role: "admin" });
    expect(res.status).toBe(422);
    expect((await User.findById(id)).role).toBe("user");
  });
});

describe("user listing", () => {
  it("paginates, never exposes password hashes, and reports totals", async () => {
    const c = await loginAs(admin.email);
    const res = await c.get("/api/v1/users?page=1&limit=2");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 2, total: 5, totalPages: 3 });
    for (const u of res.body.data) {
      expect(u.password).toBeUndefined();
      expect(u.tokenVersion).toBeUndefined();
    }
  });

  it("filters by search, role and status", async () => {
    const c = await loginAs(admin.email);
    expect((await c.get("/api/v1/users?q=bailey")).body.data.map((u) => u.email)).toEqual([buyer.email]);
    expect((await c.get("/api/v1/users?role=admin")).body.meta.total).toBe(2);
    expect((await c.get("/api/v1/users?status=blocked")).body.meta.total).toBe(1);
  });

  it("treats regex characters in search literally", async () => {
    const c = await loginAs(admin.email);
    const res = await c.get("/api/v1/users?q=" + encodeURIComponent(".*"));
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(0);
  });

  it("rejects invalid sort fields and page sizes", async () => {
    const c = await loginAs(admin.email);
    expect((await c.get("/api/v1/users?sort=password")).status).toBe(422);
    expect((await c.get("/api/v1/users?limit=1000")).status).toBe(422);
  });

  it("rejects nested query objects", async () => {
    const c = await loginAs(admin.email);
    expect((await c.get("/api/v1/users?status[$ne]=active")).status).toBe(422);
  });

  it("returns user detail with stats, and 404/400 for missing/invalid ids", async () => {
    const c = await loginAs(admin.email);
    const res = await c.get(`/api/v1/users/${await idOf(FIXTURE_USERS.seller.email)}`);
    expect(res.status).toBe(200);
    expect(res.body.data.stats.products.approved).toBe(2);
    expect(res.body.data.stats.bidsReceived).toBe(1);
    expect((await c.get("/api/v1/users/000000000000000000000000")).status).toBe(404);
    expect((await c.get("/api/v1/users/not-an-id")).status).toBe(422);
  });

  it("exports a CSV that respects filters and neutralises formulas", async () => {
    await User.updateOne({ email: buyer.email }, { $set: { name: "=HYPERLINK(\"x\")" } });
    const c = await loginAs(admin.email);
    const res = await c.get("/api/v1/users/export?q=buyer");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/csv/);
    const lines = res.text.trim().split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain(`"'=HYPERLINK(""x"")"`);
    expect(res.text).not.toMatch(/\$2[aby]\$/);
  });
});

describe("status and role changes", () => {
  it("prevents admins from blocking themselves", async () => {
    const c = await loginAs(admin.email);
    const res = await c.patch(`/api/v1/users/${await idOf(admin.email)}/status`).send({ status: "blocked" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("SELF_LOCKOUT");
  });

  it("records an audit entry with actor and change", async () => {
    const c = await loginAs(admin.email);
    const id = await idOf(buyer.email);
    await c.patch(`/api/v1/users/${id}/status`).send({ status: "blocked" });
    await c.patch(`/api/v1/users/${id}/status`).send({ status: "active" });
    const logs = await AuditLog.find({ targetId: id }).sort({ createdAt: 1 }).lean();
    expect(logs).toHaveLength(2);
    expect(logs[0]).toMatchObject({ action: "user.status_changed", actorName: admin.name, changes: { status: { from: "active", to: "blocked" } } });
    expect(logs[0].requestId).toBeTruthy();

    const res = await c.get("/api/v1/audit-logs?targetType=user");
    expect(res.body.meta.total).toBe(2);
  });

  it("promotes and demotes users, but never the last active admin", async () => {
    const c = await loginAs(admin.email);
    const buyerId = await idOf(buyer.email);
    expect((await c.patch(`/api/v1/users/${buyerId}/role`).send({ role: "admin" })).body.data.role).toBe("admin");
    expect((await c.patch(`/api/v1/users/${buyerId}/role`).send({ role: "user" })).body.data.role).toBe("user");

    // admin2 demoted -> admin is then the only admin; admin2 cannot be re-demoted and
    // admin cannot demote themselves.
    const admin2Id = await idOf(admin2.email);
    expect((await c.patch(`/api/v1/users/${admin2Id}/role`).send({ role: "user" })).status).toBe(200);
    expect((await c.patch(`/api/v1/users/${await idOf(admin.email)}/role`).send({ role: "user" })).status).toBe(400);
  });
});
