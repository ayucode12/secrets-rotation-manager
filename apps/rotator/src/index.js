const {
  connectDatabase,
  secretQueries,
  rotationLogQueries,
} = require("@repo/database");
const { createRedisClient, popFromQueue } = require("@repo/queue");
const { generateNewValue } = require("./strategies");
const { deliverToTargets } = require("./targets");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/secrets-manager";

async function handleRotation({ secretId, triggeredBy }) {
  const secret = await secretQueries.findById(secretId);
  if (!secret) {
    throw new Error(`Secret ${secretId} not found`);
  }

  try {
    const newValue = await generateNewValue(secret);
    const now = new Date();
    const nextRotationAt = new Date(
      now.getTime() + secret.rotationIntervalDays * 24 * 60 * 60 * 1000
    );

    await secretQueries.updateById(secretId, {
      value: newValue,
      lastRotatedAt: now,
      nextRotationAt,
      status: "active",
    });

    const deliveryResults = await deliverToTargets(secret, newValue);

    const failed = deliveryResults.filter((r) => !r.ok);
    let message = `Rotated via ${secret.provider || "generic"} strategy`;
    if (deliveryResults.length > 0) {
      message += ` — delivered to ${deliveryResults.length - failed.length}/${deliveryResults.length} targets`;
    }
    if (failed.length > 0) {
      message += ` (failed: ${failed.map((f) => f.label).join(", ")})`;
    }

    await rotationLogQueries.create({
      secretId: secret._id,
      secretName: secret.name,
      status: failed.length > 0 ? "failure" : "success",
      triggeredBy,
      message,
    });

    console.log(`[rotator] ${message} — "${secret.name}" (${triggeredBy})`);
  } catch (err) {
    await rotationLogQueries.create({
      secretId: secret._id,
      secretName: secret.name,
      status: "failure",
      triggeredBy,
      message: err.message,
    });
    console.error(`[rotator] Failed to rotate "${secret.name}":`, err.message);
  }
}

async function start() {
  await connectDatabase(MONGO_URI);
  console.log("[rotator] Connected to database");

  const redis = createRedisClient();
  console.log("[rotator] Listening for rotation jobs...");

  while (true) {
    const job = await popFromQueue(redis);
    if (job) {
      await handleRotation(job);
    }
  }
}

start().catch((err) => {
  console.error("[rotator] Failed to start:", err.message);
  process.exit(1);
});
