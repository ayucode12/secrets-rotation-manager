const crypto = require("crypto");
const {
  connectDatabase,
  secretQueries,
  rotationLogQueries,
} = require("@repo/database");
const { createRedisClient, popFromQueue } = require("@repo/queue");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/secrets-manager";

function generateSecretValue() {
  return crypto.randomBytes(32).toString("hex");
}

async function handleRotation({ secretId, triggeredBy }) {
  const secret = await secretQueries.findById(secretId);
  if (!secret) {
    throw new Error(`Secret ${secretId} not found`);
  }

  try {
    const newValue = generateSecretValue();
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

    await rotationLogQueries.create({
      secretId: secret._id,
      secretName: secret.name,
      status: "success",
      triggeredBy,
      message: "Rotated successfully",
    });

    console.log(`[rotator] Rotated "${secret.name}" (${triggeredBy})`);
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
