require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/database");
const cronScheduler = require("../services/cronScheduler");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 5000;
const ENV = process.env.NODE_ENV || "development";

/**
 * Application Bootstrap
 */
async function bootstrap() {
  try {
    console.log(`\n${"═".repeat(70)}`);
    console.log(`   SECRETS ROTATION MANAGER - Server Initialization`);
    console.log(`${"═".repeat(70)}`);
    console.log(`   Environment: ${ENV}`);
    console.log(`   Port: ${PORT}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);
    console.log(`${"═".repeat(70)}\n`);

    // Database Connection
    logger.info("Connecting to MongoDB...");
    await connectDB();
    logger.info("✓ MongoDB Connected Successfully");

    // Start HTTP Server
    const server = app.listen(PORT, () => {
      logger.info(`✓ Server listening on port ${PORT}`);
    });

    // Initialize Cron Scheduler
    try {
      await cronScheduler.initialize();
      logger.info("✓ Cron Scheduler Initialized");
    } catch (schedulerError) {
      logger.warn("Failed to initialize Cron Scheduler:", schedulerError.message);
    }

    // Graceful Shutdown Handler
    process.on("SIGTERM", () => {
      logger.info("SIGTERM received: Shutting down gracefully...");
      gracefulShutdown(server);
    });

    process.on("SIGINT", () => {
      logger.info("SIGINT received: Shutting down gracefully...");
      gracefulShutdown(server);
    });

    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception:", error);
      process.exit(1);
    });

    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled Rejection at:", promise, "reason:", reason);
      process.exit(1);
    });
  } catch (error) {
    logger.error("Bootstrap failed:", error);
    process.exit(1);
  }
}

/**
 * Graceful Shutdown
 */
function gracefulShutdown(server) {
  logger.info("Closing HTTP server...");
  server.close(() => {
    logger.info("✓ HTTP server closed");

    cronScheduler.stopAll();
    logger.info("✓ Cron Scheduler stopped");

    const mongoose = require("mongoose");
    mongoose.connection.close(false, () => {
      logger.info("✓ MongoDB connection closed");
      logger.info("Server shut down complete");
      process.exit(0);
    });
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error("Forced shutdown - graceful shutdown timeout");
    process.exit(1);
  }, 30000);
}

// Start the application
bootstrap();
