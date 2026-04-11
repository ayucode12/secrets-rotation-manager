const {
  connectDatabase,
  disconnectDatabase,
  secretQueries,
} = require("@repo/database");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/secrets-manager";
const API_PORT = process.env.PORT || 3000;
const TEST_WEBHOOK = `http://localhost:${API_PORT}/api/test/webhook`;

const demoSecrets = [
  {
    name: "AWS_ACCESS_KEY",
    service: "aws",
    value: "AKIA_demo_abc123xyz789",
    rotationIntervalDays: 30,
    provider: "generic",
    targets: [
      {
        type: "webhook",
        label: "Backend API",
        config: { url: TEST_WEBHOOK },
      },
    ],
    overdue: true,
  },
  {
    name: "STRIPE_SECRET_KEY",
    service: "stripe",
    value: "sk_test_demo_abc123xyz789",
    rotationIntervalDays: 15,
    provider: "generic",
    targets: [
      {
        type: "webhook",
        label: "Payment Service",
        config: { url: TEST_WEBHOOK },
      },
    ],
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
    targets: [
      {
        type: "webhook",
        label: "Backend API",
        config: { url: TEST_WEBHOOK },
      },
    ],
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

async function seed() {
  await connectDatabase(MONGO_URI);
  console.log("Connected to database\n");

  const existing = await secretQueries.findAll();

  for (const { overdue, ...data } of demoSecrets) {
    if (existing.find((s) => s.name === data.name)) {
      console.log(`  skip   "${data.name}" (already exists)`);
      continue;
    }

    const secret = await secretQueries.create(data);

    if (overdue) {
      await secretQueries.updateById(secret._id, {
        nextRotationAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      });
    }

    console.log(
      `  added  "${data.name}" [${data.provider}]${data.targets.length ? ` → ${data.targets.length} target(s)` : ""}${overdue ? "  ← overdue" : ""}`
    );
  }

  console.log("\nDone! Run 'npm run demo' to start all services.");
  console.log(`Test webhook endpoint: ${TEST_WEBHOOK}`);
  await disconnectDatabase();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
