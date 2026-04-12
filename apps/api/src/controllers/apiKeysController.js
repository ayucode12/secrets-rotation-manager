const { apiKeyQueries } = require("@repo/database");

async function getAll(_req, res) {
  try {
    const keys = await apiKeyQueries.findAll();
    res.json(keys);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function create(req, res) {
  const { name, service } = req.body;
  if (!name) {
    return res.status(400).json({ error: "name is required" });
  }

  try {
    const apiKey = await apiKeyQueries.create({ name, service });
    res.status(201).json(apiKey);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function revoke(req, res) {
  try {
    const apiKey = await apiKeyQueries.revoke(req.params.id);
    if (!apiKey) return res.status(404).json({ error: "API key not found" });
    res.json({ message: "API key revoked", apiKey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    const apiKey = await apiKeyQueries.deleteById(req.params.id);
    if (!apiKey) return res.status(404).json({ error: "API key not found" });
    res.json({ message: "API key deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAll, create, revoke, remove };
