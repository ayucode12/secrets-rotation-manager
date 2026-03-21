const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

/**
 * Setup Script - Initialize Secrets Rotation Manager
 * Run: node scripts/setup.js
 */

const setupDatabase = async () => {
  console.log("\n📦 INITIALIZING SECRETS ROTATION MANAGER\n");

  try {
    // Connect to MongoDB
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/secrets-rotation-manager", {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✓ MongoDB connected\n");

    const RotationLog = require("../models/RotationLog");
    const RotationSchedule = require("../models/RotationSchedule");
    const SecretVault = require("../models/SecretVault");

    // Sync indexes (Mongoose automatically creates indexes from schema definitions)
    console.log("📑 Syncing database indexes...");
    try {
      await RotationLog.syncIndexes();
      await RotationSchedule.syncIndexes();
      await SecretVault.syncIndexes();
      console.log("✓ Indexes synced\n");
    } catch (indexError) {
      console.log("✓ Indexes already exist (skipping)\n");
    }

    // Seed sample data
    console.log("🌱 Creating sample data...");

    // Sample 1: Database Password Secret
    const dbSecret = await SecretVault.findOneAndUpdate(
      { secretName: "production-db-password" },
      {
        secretName: "production-db-password",
        secretType: "database_password",
        currentVersion: `v_${Date.now()}_initial`,
        encryptedValue: "encrypted_placeholder",
        rotationPolicy: "db-credentials-v1",
        dependentServices: ["webapp", "api-service", "worker-service"],
        status: "active",
        metadata: {
          environment: "production",
          database: "postgresql",
          description: "Main application database password",
        },
      },
      { upsert: true, returnDocument: 'after' }
    );
    console.log("  ✓ Created: production-db-password");

    // Sample 2: API Key Secret
    const apiSecret = await SecretVault.findOneAndUpdate(
      { secretName: "stripe-api-key" },
      {
        secretName: "stripe-api-key",
        secretType: "api_key",
        currentVersion: `v_${Date.now()}_initial`,
        encryptedValue: "encrypted_placeholder",
        rotationPolicy: "api-keys-v1",
        dependentServices: ["payment-service", "webhook-processor"],
        status: "active",
        metadata: {
          environment: "production",
          provider: "stripe",
          description: "Stripe API key for payment processing",
        },
      },
      { upsert: true, returnDocument: 'after' }
    );
    console.log("  ✓ Created: stripe-api-key");

    // Sample 3: Cache Secret
    const cacheSecret = await SecretVault.findOneAndUpdate(
      { secretName: "redis-password" },
      {
        secretName: "redis-password",
        secretType: "custom",
        currentVersion: `v_${Date.now()}_initial`,
        encryptedValue: "encrypted_placeholder",
        rotationPolicy: "cache-credentials-v1",
        dependentServices: ["cache-layer", "session-service"],
        status: "active",
        metadata: {
          environment: "production",
          service: "redis",
          description: "Redis authentication password",
        },
      },
      { upsert: true, returnDocument: 'after' }
    );
    console.log("  ✓ Created: redis-password\n");

    // Create rotation schedules
    console.log("📅 Creating rotation schedules...");

    const dbSchedule = await RotationSchedule.findOneAndUpdate(
      { secretName: "production-db-password" },
      {
        scheduleId: uuidv4(),
        secretName: "production-db-password",
        cronExpression: "0 3 * * 0", // Weekly Sunday 3 AM UTC
        isActive: true,
        affectedServices: ["webapp", "api-service", "worker-service"],
        description: "Weekly database credential rotation",
        retryAttempts: 3,
        retryDelayMs: 5000,
        notificationEmail: ["devops@example.com"],
      },
      { upsert: true, returnDocument: 'after' }
    );
    console.log("  ✓ Created: Database rotation schedule");

    const apiSchedule = await RotationSchedule.findOneAndUpdate(
      { secretName: "stripe-api-key" },
      {
        scheduleId: uuidv4(),
        secretName: "stripe-api-key",
        cronExpression: "0 2 1 * *", // Monthly 1st at 2 AM UTC
        isActive: true,
        affectedServices: ["payment-service"],
        description: "Monthly API key rotation",
        retryAttempts: 3,
        retryDelayMs: 5000,
        notificationEmail: ["payment-team@example.com"],
      },
      { upsert: true, returnDocument: 'after' }
    );
    console.log("  ✓ Created: API key rotation schedule");

    const cacheSchedule = await RotationSchedule.findOneAndUpdate(
      { secretName: "redis-password" },
      {
        scheduleId: uuidv4(),
        secretName: "redis-password",
        cronExpression: "0 0 15 * *", // 15th of month at midnight UTC
        isActive: true,
        affectedServices: ["cache-layer"],
        description: "Monthly cache credential rotation",
        retryAttempts: 3,
        retryDelayMs: 5000,
        notificationEmail: ["infra-team@example.com"],
      },
      { upsert: true, returnDocument: 'after' }
    );
    console.log("  ✓ Created: Cache rotation schedule\n");

    // Create sample rotation log
    console.log("📝 Creating sample rotation history...");

    const sampleLog = await RotationLog.create({
      rotationId: uuidv4(),
      secretName: "production-db-password",
      status: "success",
      oldSecretVersion: "v_1234567890_initial",
      newSecretVersion: "v_1234567891_rotated",
      validationStatus: "validated",
      affectedServices: ["webapp", "api-service"],
      triggeredBy: "manual",
    });
    console.log("  ✓ Created: Sample rotation log\n");

    console.log("═".repeat(60));
    console.log("✅ SETUP COMPLETE\n");
    console.log("Next steps:");
    console.log("1. Configure .env file with your MongoDB URI");
    console.log("2. Update shell scripts in /scripts directory");
    console.log("3. Configure rotation policies in /rotation-policies");
    console.log("4. Start server: npm start");
    console.log("5. Test API: curl http://localhost:5000/health\n");
    console.log("Sample API calls:");
    console.log("  POST   http://localhost:5000/api/rotations/manual");
    console.log("  GET    http://localhost:5000/api/rotations/history/production-db-password");
    console.log("  GET    http://localhost:5000/api/rotations/schedules");
    console.log("  GET    http://localhost:5000/api/rotations/secrets\n");
    console.log("═".repeat(60) + "\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Setup failed:", error.message);
    process.exit(1);
  }
};

// Run setup
setupDatabase();
