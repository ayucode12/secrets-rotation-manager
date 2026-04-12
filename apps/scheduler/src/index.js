const { connectDatabase, secretQueries } = require("@repo/database");
const { createRedisClient, pushToQueue } = require("@repo/queue");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/secrets-manager";
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS) || 15000;

const redis = createRedisClient();

async function checkAndEnqueue() {
  const dueSecrets = await secretQueries.findDueForRotation();

  if (dueSecrets.length === 0) {
    return;
  }

  console.log(
    `[scheduler] Found ${dueSecrets.length} secret(s) due for rotation`
  );

  for (const secret of dueSecrets) {
    await secretQueries.updateById(secret._id, { status: "rotating" });
    await pushToQueue(redis, {
      secretId: secret._id.toString(),
      triggeredBy: "scheduled",
    });
    console.log(`[scheduler] Queued "${secret.name}" for rotation`);
  }
}

async function start() {
  await connectDatabase(MONGO_URI);
  console.log("[scheduler] Connected to database");
  console.log(`[scheduler] Polling every ${POLL_INTERVAL_MS / 1000}s`);

  setInterval(() => {
    checkAndEnqueue().catch((err) =>
      console.error("[scheduler] Error:", err.message)
    );
  }, POLL_INTERVAL_MS);
}

start().catch((err) => {
  console.error("[scheduler] Failed to start:", err.message);
  process.exit(1);
});
