import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { createApp } from "../app.js";
import { FIXTURE_PASSWORD, seedFixtures } from "../scripts/fixtures.js";

let replSet;

export async function startDb() {
  // A single-node replica set so multi-document transactions are exercised.
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(replSet.getUri("smp-test"), { autoIndex: true });
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
}

export async function stopDb() {
  await mongoose.disconnect();
  await replSet?.stop();
}

export async function resetDb() {
  await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
  return seedFixtures();
}

export const app = createApp();

// Supertest agent that keeps cookies and sends the CSRF header, like the SPA.
export function client() {
  const agent = request.agent(app);
  const wrap = (method) => (url) => agent[method](url).set("X-Requested-With", "XMLHttpRequest");
  return {
    agent,
    get: wrap("get"),
    post: wrap("post"),
    patch: wrap("patch"),
    delete: wrap("delete"),
  };
}

export async function loginAs(email, password = FIXTURE_PASSWORD) {
  const c = client();
  const res = await c.post("/api/v1/auth/login").send({ email, password });
  if (res.status !== 200) throw new Error(`login failed for ${email}: ${res.status} ${res.body.message}`);
  return c;
}
