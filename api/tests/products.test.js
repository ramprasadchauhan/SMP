import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import Product from "../models/productModel.js";
import Bids from "../models/bidModel.js";
import Notification from "../models/notificationModel.js";
import AuditLog from "../models/auditLogModel.js";
import User from "../models/userModel.js";
import { FIXTURE_USERS } from "../scripts/fixtures.js";
import { app, loginAs, resetDb, startDb, stopDb } from "./helpers.js";

beforeAll(startDb);
afterAll(stopDb);

let fx;
beforeEach(async () => {
  fx = await resetDb();
});

const { admin, seller, buyer } = FIXTURE_USERS;
const valid = {
  name: "Vintage Turntable",
  description: "Belt-drive turntable, recently serviced, with dust cover.",
  price: 150,
  category: "electronics",
  age: 12,
};

describe("marketplace", () => {
  it("lists only approved products publicly, without seller emails", async () => {
    const res = await request(app).get("/api/v1/products");
    expect(res.status).toBe(200);
    expect(res.body.data.map((p) => p.status)).toEqual(["approved", "approved"]);
    expect(res.body.data[0].seller.email).toBeUndefined();
    expect(res.body.data[0].seller.password).toBeUndefined();
  });

  it("filters by multiple categories and age ranges (all ranges, not just the last)", async () => {
    const both = await request(app).get("/api/v1/products?age=0-2&age=3-5");
    expect(both.body.meta.total).toBe(2);
    const cat = await request(app).get("/api/v1/products?category=fashion");
    expect(cat.body.data.map((p) => p.name)).toEqual(["Leather Jacket"]);
  });

  it("searches by name, sorts by price and paginates", async () => {
    expect((await request(app).get("/api/v1/products?q=camera")).body.meta.total).toBe(1);
    const sorted = await request(app).get("/api/v1/products?sort=price_asc");
    expect(sorted.body.data.map((p) => p.price)).toEqual([120, 640]);
    const page2 = await request(app).get("/api/v1/products?limit=1&page=2");
    expect(page2.body.data).toHaveLength(1);
    expect(page2.body.meta.totalPages).toBe(2);
  });

  it("rejects unknown filter values", async () => {
    expect((await request(app).get("/api/v1/products?category=weapons")).status).toBe(422);
  });

  it("hides non-approved products from other users but shows them to the owner and admins", async () => {
    const id = fx.products.bike._id;
    expect((await request(app).get(`/api/v1/products/${id}`)).status).toBe(404);
    expect((await (await loginAs(buyer.email)).get(`/api/v1/products/${id}`)).status).toBe(404);
    expect((await (await loginAs(seller.email)).get(`/api/v1/products/${id}`)).status).toBe(200);
    expect((await (await loginAs(admin.email)).get(`/api/v1/products/${id}`)).status).toBe(200);
  });
});

describe("product ownership", () => {
  it("creates products as pending, owned by the caller, and notifies admins", async () => {
    const c = await loginAs(buyer.email);
    const res = await c.post("/api/v1/products").send(valid);
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("pending");
    const buyerId = String((await User.findOne({ email: buyer.email }))._id);
    expect(String(res.body.data.seller)).toBe(buyerId);
    expect(await Notification.countDocuments({ title: "New product awaiting review" })).toBe(2);
  });

  it("does not allow choosing seller or status on create (mass assignment)", async () => {
    const c = await loginAs(buyer.email);
    const res = await c.post("/api/v1/products").send({ ...valid, status: "approved" });
    expect(res.status).toBe(422);
  });

  it("validates product fields", async () => {
    const c = await loginAs(buyer.email);
    const res = await c.post("/api/v1/products").send({ ...valid, price: -5, age: 1.5 });
    expect(res.status).toBe(422);
    expect(res.body.details.map((d) => d.field).sort()).toEqual(["age", "price"]);
  });

  it("lets owners edit their own products but not others'", async () => {
    const owner = await loginAs(seller.email);
    const other = await loginAs(buyer.email);
    const id = fx.products.camera._id;
    expect((await owner.patch(`/api/v1/products/${id}`).send({ price: 599 })).body.data.price).toBe(599);
    expect((await other.patch(`/api/v1/products/${id}`).send({ price: 1 })).status).toBe(403);
    expect((await other.delete(`/api/v1/products/${id}`)).status).toBe(403);
  });

  it("deletes a product together with its bids", async () => {
    const owner = await loginAs(seller.email);
    const id = fx.products.camera._id;
    expect((await owner.delete(`/api/v1/products/${id}`)).status).toBe(200);
    expect(await Product.countDocuments({ _id: id })).toBe(0);
    expect(await Bids.countDocuments({ product: id })).toBe(0);
  });

  it("lists only the caller's products under /mine", async () => {
    const c = await loginAs(seller.email);
    const res = await c.get("/api/v1/products/mine?status=pending");
    expect(res.body.data.map((p) => p.name)).toEqual(["Road Bike"]);
    expect((await (await loginAs(buyer.email)).get("/api/v1/products/mine")).body.meta.total).toBe(0);
  });

  it("returns 503 for image uploads when Cloudinary is not configured", async () => {
    const c = await loginAs(seller.email);
    const res = await c
      .post(`/api/v1/products/${fx.products.camera._id}/images`)
      .attach("file", Buffer.from([0xff, 0xd8, 0xff]), { filename: "a.jpg", contentType: "image/jpeg" });
    expect(res.status).toBe(503);
  });

  it("rejects non-image uploads", async () => {
    const c = await loginAs(seller.email);
    const res = await c
      .post(`/api/v1/products/${fx.products.camera._id}/images`)
      .attach("file", Buffer.from("hello"), { filename: "a.txt", contentType: "text/plain" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_FILE_TYPE");
  });
});

describe("moderation", () => {
  it("is admin-only", async () => {
    const c = await loginAs(seller.email);
    expect((await c.get("/api/v1/products/manage")).status).toBe(403);
    expect((await c.patch(`/api/v1/products/${fx.products.bike._id}/status`).send({ status: "approved" })).status).toBe(403);
    expect((await request(app).patch(`/api/v1/products/${fx.products.bike._id}/status`).set("X-Requested-With", "XMLHttpRequest").send({ status: "approved" })).status).toBe(401);
  });

  it("approves a pending product, notifies the seller and audits the change", async () => {
    const c = await loginAs(admin.email);
    const res = await c.patch(`/api/v1/products/${fx.products.bike._id}/status`).send({ status: "approved" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("approved");
    expect(await Notification.countDocuments({ user: fx.users.seller._id, title: "Product status updated" })).toBe(1);
    expect(await AuditLog.countDocuments({ action: "product.status_changed", targetId: fx.products.bike._id })).toBe(1);
  });

  it("rejects invalid status transitions", async () => {
    const c = await loginAs(admin.email);
    const res = await c.patch(`/api/v1/products/${fx.products.bike._id}/status`).send({ status: "blocked" });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe("INVALID_TRANSITION");
  });

  it("lists all statuses with counts for admins", async () => {
    const c = await loginAs(admin.email);
    const res = await c.get("/api/v1/products/manage?status=pending");
    expect(res.body.data.map((p) => p.name)).toEqual(["Road Bike"]);
    expect(res.body.meta.statusCounts).toMatchObject({ approved: 2, pending: 1, rejected: 1 });
    expect(res.body.data[0].seller.email).toBe(seller.email);
  });
});

describe("bids", () => {
  it("places a bid as the authenticated buyer and notifies the seller", async () => {
    const c = await loginAs(buyer.email);
    const res = await c.post(`/api/v1/products/${fx.products.jacket._id}/bids`).send({ bidAmount: 100, message: "Interested", mobile: "0123 456 789" });
    expect(res.status).toBe(201);
    expect(res.body.data.mobile).toBe("0123 456 789");
    expect(String(res.body.data.buyer)).toBe(String(fx.users.buyer._id));
    expect(await Notification.countDocuments({ user: fx.users.seller._id, title: "New bid received" })).toBe(2);
  });

  it("prevents bidding on your own or a non-approved product", async () => {
    const owner = await loginAs(seller.email);
    expect((await owner.post(`/api/v1/products/${fx.products.jacket._id}/bids`).send({ bidAmount: 1, message: "x", mobile: "5550100100" })).status).toBe(400);
    const c = await loginAs(buyer.email);
    expect((await c.post(`/api/v1/products/${fx.products.bike._id}/bids`).send({ bidAmount: 1, message: "x", mobile: "5550100100" })).status).toBe(404);
  });

  it("shows bidder contact details only to the seller", async () => {
    const owner = await loginAs(seller.email);
    const ownerView = await owner.get(`/api/v1/products/${fx.products.camera._id}/bids`);
    expect(ownerView.body.data[0].buyer.email).toBe(buyer.email);
    expect(ownerView.body.data[0].mobile).toBe("+1 555 0100");

    await User.create({ name: "Other", email: "other@smp.test", password: "x" });
    const other = await loginAs(admin.email);
    expect((await other.get(`/api/v1/products/${fx.products.camera._id}/bids`)).body.meta.privileged).toBe(true);

    const buyerView = await (await loginAs(buyer.email)).get(`/api/v1/products/${fx.products.jacket._id}/bids`);
    expect(buyerView.body.meta.visible).toBe(false);
  });

  it("lists my bids and bids received", async () => {
    const mine = await (await loginAs(buyer.email)).get("/api/v1/bids/mine");
    expect(mine.body.data[0].product.name).toBe("Mirrorless Camera");
    const received = await (await loginAs(seller.email)).get("/api/v1/bids/received");
    expect(received.body.meta.total).toBe(1);
  });
});

describe("notifications", () => {
  it("lists, reads and deletes only the caller's notifications", async () => {
    const own = await loginAs(seller.email);
    const list = await own.get("/api/v1/notifications");
    expect(list.body.meta.unreadCount).toBe(1);
    const id = list.body.data[0]._id;

    const stranger = await loginAs(buyer.email);
    expect((await stranger.delete(`/api/v1/notifications/${id}`)).status).toBe(404);
    expect((await stranger.patch(`/api/v1/notifications/${id}/read`)).status).toBe(404);

    expect((await own.patch(`/api/v1/notifications/${id}/read`)).body.data.read).toBe(true);
    expect((await own.delete(`/api/v1/notifications/${id}`)).status).toBe(200);
    expect((await own.get("/api/v1/notifications")).body.meta.total).toBe(0);
  });
});

describe("dashboard", () => {
  it("returns database-backed admin metrics", async () => {
    const res = await (await loginAs(admin.email)).get("/api/v1/dashboard/summary?days=7");
    expect(res.status).toBe(200);
    const d = res.body.data;
    expect(d.scope).toBe("admin");
    expect(d.users).toMatchObject({ total: 5, active: 4, blocked: 1, admins: 2 });
    expect(d.products.byStatus).toEqual({ pending: 1, approved: 2, rejected: 1, blocked: 0 });
    expect(d.trend).toHaveLength(7);
    expect(d.bids.total).toBe(1);
  });

  it("returns a personal summary for normal users without admin data", async () => {
    const res = await (await loginAs(seller.email)).get("/api/v1/dashboard/summary");
    const d = res.body.data;
    expect(d.scope).toBe("user");
    expect(d.users).toBeUndefined();
    expect(d.products.total).toBe(4);
    expect(d.bidsReceived.total).toBe(1);
    expect(d.trend).toHaveLength(30);
  });

  it("validates the range and restricts audit logs to admins", async () => {
    const c = await loginAs(seller.email);
    expect((await c.get("/api/v1/dashboard/summary?days=3")).status).toBe(422);
    expect((await c.get("/api/v1/audit-logs")).status).toBe(403);
  });
});
