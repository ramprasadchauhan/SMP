// Idempotent, non-destructive data migration for existing databases.
//
//   node api/scripts/migrate.js           # dry run: reports what would change
//   node api/scripts/migrate.js --apply   # applies the changes
//
// What it does (each step is safe to re-run):
//   1. Lowercases user emails (login matches lowercase emails).
//   2. Lowercases product categories ("Electronics" -> "electronics").
//   3. Fixes the legacy default status typo "panding" -> "pending".
//   4. Creates the indexes declared in the models (never drops any).
// No documents are deleted. Back up the database before running with --apply.
import mongoose from "mongoose";
import env from "../config/env.js";
import User from "../models/userModel.js";
import Product from "../models/productModel.js";
import Bids from "../models/bidModel.js";
import Notification from "../models/notificationModel.js";
import AuditLog from "../models/auditLogModel.js";

const apply = process.argv.includes("--apply");

await mongoose.connect(env.MONGO, { autoIndex: false });
console.log(`Connected to "${mongoose.connection.name}". Mode: ${apply ? "APPLY" : "dry run"}\n`);

const steps = [
  {
    name: "Lowercase user emails",
    count: () => User.countDocuments({ email: /[A-Z]/ }),
    run: async () => {
      // Guard against creating duplicates that the unique index would reject.
      const users = await User.find({ email: /[A-Z]/ }).select("email").lean();
      let changed = 0;
      for (const u of users) {
        const lower = u.email.toLowerCase();
        if (await User.exists({ email: lower, _id: { $ne: u._id } })) {
          console.warn(`  skipped ${u._id}: "${lower}" already exists (resolve manually)`);
          continue;
        }
        await User.updateOne({ _id: u._id }, { $set: { email: lower } });
        changed++;
      }
      return changed;
    },
  },
  {
    name: "Lowercase product categories",
    count: () => Product.countDocuments({ category: /[A-Z]/ }),
    run: async () =>
      (await Product.updateMany({ category: /[A-Z]/ }, [{ $set: { category: { $toLower: "$category" } } }])).modifiedCount,
  },
  {
    name: 'Fix product status typo "panding"',
    count: () => Product.countDocuments({ status: "panding" }),
    run: async () => (await Product.updateMany({ status: "panding" }, { $set: { status: "pending" } })).modifiedCount,
  },
];

for (const step of steps) {
  const pending = await step.count();
  if (!apply || pending === 0) {
    console.log(`- ${step.name}: ${pending} document(s) ${apply ? "already up to date" : "would change"}`);
    continue;
  }
  console.log(`- ${step.name}: ${await step.run()} document(s) updated`);
}

for (const model of [User, Product, Bids, Notification, AuditLog]) {
  if (apply) {
    await model.createIndexes();
    console.log(`- Indexes ensured for ${model.collection.name}`);
  } else {
    const existing = new Set((await model.collection.indexes().catch(() => [])).map((i) => JSON.stringify(i.key)));
    const missing = model.schema.indexes().filter(([key]) => !existing.has(JSON.stringify(key)));
    console.log(`- ${model.collection.name}: ${missing.length} index(es) would be created`);
  }
}

await mongoose.disconnect();
