const { rotationLogQueries } = require("@repo/database");

async function getAll(req, res) {
  try {
    const logs = await rotationLogQueries.findAll();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getBySecretId(req, res) {
  try {
    const logs = await rotationLogQueries.findBySecretId(req.params.id);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAll, getBySecretId };
