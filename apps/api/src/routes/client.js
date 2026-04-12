const { Router } = require("express");
const { Secret } = require("@repo/database");
const { requireApiKey } = require("../middleware/apiKey");

const clientRouter = Router();

clientRouter.use(requireApiKey);

clientRouter.get("/secrets/:name", async (req, res) => {
  try {
    const secret = await Secret.findOne({ name: req.params.name }).lean();
    if (!secret) {
      return res.status(404).json({ error: "Secret not found" });
    }

    res.json({
      name: secret.name,
      service: secret.service,
      value: secret.value,
      status: secret.status,
      lastRotatedAt: secret.lastRotatedAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = clientRouter;
