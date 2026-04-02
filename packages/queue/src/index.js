const Redis = require("ioredis");

const QUEUE_KEY = "rotation-jobs";

function createRedisClient() {
  return new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
  });
}

async function pushToQueue(client, job) {
  await client.lpush(QUEUE_KEY, JSON.stringify(job));
}

async function popFromQueue(client) {
  const result = await client.brpop(QUEUE_KEY, 0);
  if (!result) return null;
  return JSON.parse(result[1]);
}

module.exports = { createRedisClient, pushToQueue, popFromQueue, QUEUE_KEY };
