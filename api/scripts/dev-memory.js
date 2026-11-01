// Starts the API against a throw-away in-memory MongoDB seeded with fixtures.
// Used for local demos and end-to-end tests; it never touches the database in
// .env. Usage: node api/scripts/dev-memory.js   (PORT defaults to 8000)
import { MongoMemoryReplSet } from "mongodb-memory-server";

const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
process.env.MONGO = replSet.getUri("smp-dev");
process.env.MONGO_AUTO_INDEX = "true";
process.env.JWT_SECRET ||= "dev-memory-secret-0123456789abcdef0123456789";

const { default: env } = await import("../config/env.js");
const { default: connectDB } = await import("../config/dbConfig.js");
const { createApp } = await import("../app.js");
const { seedFixtures, FIXTURE_USERS } = await import("./fixtures.js");

await connectDB(process.env.MONGO);
await seedFixtures({ extraUsers: 14, rich: true });

const server = createApp().listen(env.PORT, () => {
  console.log(`In-memory API ready on http://localhost:${env.PORT} (NODE_ENV=${env.NODE_ENV})`);
  console.log(`Fixture accounts: ${Object.values(FIXTURE_USERS).map((u) => u.email).join(", ")}`);
  console.log("Fixture password: see FIXTURE_PASSWORD in api/scripts/fixtures.js");
});

const stop = async () => {
  server.close();
  await replSet.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
