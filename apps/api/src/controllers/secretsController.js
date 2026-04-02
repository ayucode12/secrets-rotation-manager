const { secretQueries } = require("@repo/database");
const { createRedisClient, pushToQueue } = require("@repo/queue");

const redis = createRedisClient();

function maskValue(value) {
  if (!value || value.length <= 8) return "********";
  return value.slice(0, 4) + "****" + value.slice(-4);
}

async function getAll(req, res) {
  try {
    const secrets = await secretQueries.findAll();
    const masked = secrets.map((s) => ({ ...s, value: maskValue(s.value) }));
    res.json(masked);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function create(req, res) {
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
}

async function getById(req, res) {
  try {
    const secret = await secretQueries.findById(req.params.id);
    if (!secret) return res.status(404).json({ error: "Secret not found" });
    res.json({ ...secret, value: maskValue(secret.value) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function update(req, res) {
  try {
    const { name, service, rotationIntervalDays } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (service) updates.service = service;
    if (rotationIntervalDays)
      updates.rotationIntervalDays = rotationIntervalDays;

    const secret = await secretQueries.updateById(req.params.id, updates);
    if (!secret) return res.status(404).json({ error: "Secret not found" });
    res.json({ ...secret, value: maskValue(secret.value) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    const secret = await secretQueries.deleteById(req.params.id);
    if (!secret) return res.status(404).json({ error: "Secret not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function rotate(req, res) {
  try {
    const secret = await secretQueries.findById(req.params.id);
    if (!secret) return res.status(404).json({ error: "Secret not found" });

    await pushToQueue(redis, {
      secretId: req.params.id,
      triggeredBy: "manual",
    });

    res.json({ message: "Rotation job queued", secretId: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAll, create, getById, update, remove, rotate };
