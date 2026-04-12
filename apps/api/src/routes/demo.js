const { Router } = require("express");
const { secretQueries, Secret, RotationLog } = require("@repo/database");

const demoRouter = Router();

const webhookHits = [];

demoRouter.post("/test/webhook", (req, res) => {
  const entry = {
    receivedAt: new Date().toISOString(),
    secretName: req.body.secretName,
    service: req.body.service,
  };
  webhookHits.push(entry);
  console.log(`[api] Test webhook received: ${entry.secretName} (${entry.service})`);
  res.json({ ok: true });
});

demoRouter.get("/test/webhook", (_req, res) => {
  res.json(webhookHits);
});

function buildDemoSecrets(port) {
  const testWebhook = `http://localhost:${port}/api/test/webhook`;
  return [
    {
      name: "AWS_ACCESS_KEY",
      service: "aws",
      value: "AKIA_demo_abc123xyz789",
      rotationIntervalDays: 30,
      provider: "generic",
      targets: [{ type: "webhook", label: "Backend API", config: { url: testWebhook } }],
      overdue: true,
    },
    {
      name: "STRIPE_SECRET_KEY",
      service: "stripe",
      value: "sk_test_demo_abc123xyz789",
      rotationIntervalDays: 15,
      provider: "generic",
      targets: [{ type: "webhook", label: "Payment Service", config: { url: testWebhook } }],
      overdue: true,
    },
    {
      name: "DATABASE_PASSWORD",
      service: "database",
      value: "super-secret-db-pass-2024",
      rotationIntervalDays: 7,
      provider: "generic",
      targets: [{ type: "webhook", label: "Backend API", config: { url: testWebhook } }],
      overdue: false,
    },
    {
      name: "GITHUB_TOKEN",
      service: "github",
      value: "ghp_ABCDe1f2g3h4i5j6k7l8m9n0OPQRST",
      rotationIntervalDays: 90,
      provider: "generic",
      targets: [],
      overdue: false,
    },
  ];
}

demoRouter.post("/demo/seed", async (req, res) => {
  try {
    const port = req.app.get("port") || 3000;
    const demoSecrets = buildDemoSecrets(port);
    const existing = await secretQueries.findAll();
    const added = [];

    for (const { overdue, ...data } of demoSecrets) {
      if (existing.find((s) => s.name === data.name)) continue;

      const secret = await secretQueries.create(data);
      if (overdue) {
        await secretQueries.updateById(secret._id, {
          nextRotationAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        });
      }
      added.push(data.name);
    }

    console.log(`[api] Demo seeded: ${added.length} secret(s) added`);
    res.json({ message: `Seeded ${added.length} demo secret(s)`, added });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

demoRouter.delete("/demo", async (_req, res) => {
  try {
    const { deletedCount: secrets } = await Secret.deleteMany({});
    const { deletedCount: logs } = await RotationLog.deleteMany({});
    webhookHits.length = 0;

    console.log(`[api] Demo cleared: ${secrets} secrets, ${logs} logs`);
    res.json({ message: "Demo cleared", deleted: { secrets, logs } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = demoRouter;
