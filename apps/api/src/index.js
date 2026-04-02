const express = require("express");
const cors = require("cors");
const {
  connectDatabase,
  secretQueries,
  rotationLogQueries,
} = require("@repo/database");
const { createRedisClient, pushToQueue } = require("@repo/queue");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/secrets-manager";

const redis = createRedisClient();

app.use(cors());
app.use(express.json());

function maskValue(value) {
  if (!value || value.length <= 8) return "********";
  return value.slice(0, 4) + "****" + value.slice(-4);
}

// --- Secret routes ---

app.get("/api/secrets", async (req, res) => {
  const secrets = await secretQueries.findAll();
  const masked = secrets.map((s) => ({ ...s, value: maskValue(s.value) }));
  res.json(masked);
});

app.post("/api/secrets", async (req, res) => {
  const { name, service, value, rotationIntervalDays } = req.body;
  if (!name || !service || !value) {
    return res
      .status(400)
      .json({ error: "name, service, and value are required" });
  }
  try {
    const secret = await secretQueries.create({
      name,
      service,
      value,
      rotationIntervalDays,
    });
    res
      .status(201)
      .json({ ...secret.toObject(), value: maskValue(secret.value) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/secrets/:id", async (req, res) => {
  const secret = await secretQueries.findById(req.params.id);
  if (!secret) return res.status(404).json({ error: "Secret not found" });
  res.json({ ...secret, value: maskValue(secret.value) });
});

app.put("/api/secrets/:id", async (req, res) => {
  const { name, service, rotationIntervalDays } = req.body;
  const updates = {};
  if (name) updates.name = name;
  if (service) updates.service = service;
  if (rotationIntervalDays) updates.rotationIntervalDays = rotationIntervalDays;

  const secret = await secretQueries.updateById(req.params.id, updates);
  if (!secret) return res.status(404).json({ error: "Secret not found" });
  res.json({ ...secret, value: maskValue(secret.value) });
});

app.delete("/api/secrets/:id", async (req, res) => {
  const secret = await secretQueries.deleteById(req.params.id);
  if (!secret) return res.status(404).json({ error: "Secret not found" });
  res.json({ message: "Deleted" });
});

app.post("/api/secrets/:id/rotate", async (req, res) => {
  const secret = await secretQueries.findById(req.params.id);
  if (!secret) return res.status(404).json({ error: "Secret not found" });

  await pushToQueue(redis, {
    secretId: req.params.id,
    triggeredBy: "manual",
  });

  res.json({ message: "Rotation job queued", secretId: req.params.id });
});

// --- Rotation log routes ---

app.get("/api/logs", async (req, res) => {
  const logs = await rotationLogQueries.findAll();
  res.json(logs);
});

app.get("/api/secrets/:id/logs", async (req, res) => {
  const logs = await rotationLogQueries.findBySecretId(req.params.id);
  res.json(logs);
});

// --- Start server ---

connectDatabase(MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[api] Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("[api] Failed to connect to database:", err.message);
    process.exit(1);
  });

module.exports = app;
