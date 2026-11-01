import mongoose from "mongoose";

// Runs `work(session)` inside a MongoDB transaction. Standalone servers (e.g. a
// plain local mongod) cannot run transactions, so we fall back to running the
// work without a session there; replica sets and Atlas get full atomicity.
export async function runInTransaction(work) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (err) {
    if (isTransactionUnsupported(err)) return work(null);
    throw err;
  } finally {
    await session.endSession();
  }
}

function isTransactionUnsupported(err) {
  return (
    err?.code === 20 ||
    /Transaction numbers are only allowed on a replica set member or mongos/i.test(err?.message || "")
  );
}
