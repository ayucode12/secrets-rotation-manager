const { apiKeyQueries } = require("@repo/database");

async function requireApiKey(req, res, next) {
  const key = req.headers["x-api-key"];
  if (!key) {
    return res.status(401).json({ error: "Missing x-api-key header" });
  }

  const apiKey = await apiKeyQueries.findByKey(key);
  if (!apiKey) {
    return res.status(403).json({ error: "Invalid or revoked API key" });
  }

  apiKeyQueries.touchLastUsed(apiKey._id).catch(() => {});
  req.apiKey = apiKey;
  next();
}

module.exports = { requireApiKey };
