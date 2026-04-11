const express = require("express");
const cors = require("cors");
const { connectDatabase } = require("@repo/database");
const v1Router = require("./routes");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/secrets-manager";

app.use(cors());
app.use(express.json());

// --- Demo/testing only: must be registered before the v1Router catch-all ---
const { secretQueries, Secret, RotationLog } = require("@repo/database");

const webhookHits = [];

app.post("/api/test/webhook", (req, res) => {
  const entry = {
    receivedAt: new Date().toISOString(),
    secretName: req.body.secretName,
    service: req.body.service,
  };
  webhookHits.push(entry);
  console.log(`[api] Test webhook received: ${entry.secretName} (${entry.service})`);
  res.json({ ok: true });
});

app.get("/api/test/webhook", (_req, res) => {
  res.json(webhookHits);
});

const TEST_WEBHOOK = `http://localhost:${PORT}/api/test/webhook`;

const demoSecrets = [
  {
    name: "AWS_ACCESS_KEY",
    service: "aws",
    value: "AKIA_demo_abc123xyz789",
    rotationIntervalDays: 30,
    provider: "generic",
    targets: [{ type: "webhook", label: "Backend API", config: { url: TEST_WEBHOOK } }],
    overdue: true,
  },
  {
    name: "STRIPE_SECRET_KEY",
    service: "stripe",
    value: "sk_test_demo_abc123xyz789",
    rotationIntervalDays: 15,
    provider: "generic",
    targets: [{ type: "webhook", label: "Payment Service", config: { url: TEST_WEBHOOK } }],
    overdue: true,
  },
  {
    name: "DATABASE_PASSWORD",
    service: "database",
    value: "super-secret-db-pass-2024",
    rotationIntervalDays: 7,
    provider: "database",
    providerConfig: {
      connectionUri: "postgresql://admin:pass@localhost:5432/myapp",
      dbUser: "app_user",
    },
    targets: [{ type: "webhook", label: "Backend API", config: { url: TEST_WEBHOOK } }],
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

app.post("/api/demo/seed", async (_req, res) => {
  try {
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

app.delete("/api/demo", async (_req, res) => {
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
// --- End demo/testing only ---

app.use("/api/v1", v1Router);
app.use("/api", v1Router);

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
