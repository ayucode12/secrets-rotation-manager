const {
  connectDatabase,
  disconnectDatabase,
  secretQueries,
} = require("@repo/database");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/secrets-manager";

const demoSecrets = [
  {
    name: "AWS_ACCESS_KEY",
    service: "aws",
    value: "aws_demo_key_abc123xyz789",
    rotationIntervalDays: 30,
    overdue: true,
  },
  {
    name: "STRIPE_SECRET_KEY",
    service: "stripe",
    value: "stripe_demo_key_abc123xyz789",
    rotationIntervalDays: 15,
    overdue: true,
  },
  {
    name: "DATABASE_PASSWORD",
    service: "database",
    value: "super-secret-db-pass-2024",
    rotationIntervalDays: 7,
    overdue: false,
  },
  {
    name: "GITHUB_TOKEN",
    service: "github",
    value: "ghp_ABCDe1f2g3h4i5j6k7l8m9n0OPQRST",
    rotationIntervalDays: 90,
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

    console.log(`  added  "${data.name}"${overdue ? "  ← overdue (will auto-rotate)" : ""}`);
  }

  console.log("\nDone! Start the scheduler to auto-rotate the overdue secrets.");
  await disconnectDatabase();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
