require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const rotationRoutes = require("./routes/rotationRoutes");
const cronScheduler = require("./services/cronScheduler");

const app = express();

// ===== MIDDLEWARE =====
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Static frontend from public (available under /app)
app.use("/app", express.static(path.join(__dirname, "public")));
app.get(/^\/app\/.*$/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ===== DATABASE CONNECTION =====
let dbConnected = false;

connectDB()
  .then(() => {
    dbConnected = true;
    console.log("✓ MongoDB Connected Successfully");
  })
  .catch((err) => {
    console.error("✗ MongoDB Connection Failed:", err.message);
    process.exit(1);
  });

// ===== ROUTES =====

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date(),
    database: dbConnected ? "connected" : "disconnected",
    activeRotations: require("./services/rotationService").activeRotations?.size || 0,
    scheduledTasks: cronScheduler.getAllTasks().length,
  });
});

// Main landing page
app.get("/", (req, res) => {
  res.status(200).json({
    name: "Secrets Rotation Manager",
    version: "1.0.0",
    description: "Enterprise-grade secrets rotation system with zero-downtime deployment",
    endpoints: {
      health: "GET /health",
      api: "See API documentation at /docs",
      rotations: {
        manual: "POST /api/rotations/manual",
        history: "GET /api/rotations/history/:secretName",
        status: "GET /api/rotations/status/:rotationId",
        logs: "GET /api/rotations/logs",
      },
      schedules: {
        create: "POST /api/rotations/schedules/create",
        list: "GET /api/rotations/schedules",
        get: "GET /api/rotations/schedules/:secretName",
        update: "PATCH /api/rotations/schedules/:scheduleId",
        delete: "DELETE /api/rotations/schedules/:scheduleId",
      },
      secrets: {
        register: "POST /api/rotations/secrets/register",
        list: "GET /api/rotations/secrets",
        get: "GET /api/rotations/secrets/:secretName",
        update: "PATCH /api/rotations/secrets/:secretName",
      },
    },
  });
});

// API Routes
app.use("/api/rotations", rotationRoutes);

// ===== ERROR HANDLING MIDDLEWARE =====
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    timestamp: new Date(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    path: req.path,
    message: "The requested endpoint does not exist",
  });
});

// ===== SERVER STARTUP =====
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, async () => {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`   SECRETS ROTATION MANAGER - Server Started`);
  console.log(`${"═".repeat(60)}`);
  console.log(`   Port: ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`   Timestamp: ${new Date().toISOString()}`);
  console.log(`${"═".repeat(60)}\n`);

  // Initialize cron scheduler after server start
  try {
    await cronScheduler.initialize();
    console.log("✓ Cron Scheduler Initialized\n");
  } catch (error) {
    console.error("✗ Failed to initialize Cron Scheduler:", error.message);
    // Continue running even if scheduler fails
  }
});

// ===== GRACEFUL SHUTDOWN =====
process.on("SIGTERM", () => {
  console.log("\n[SHUTDOWN] SIGTERM signal received: closing HTTP server");
  cronScheduler.stopAll();
  server.close(() => {
    console.log("[SHUTDOWN] HTTP server closed");
    mongoose.connection.close(false, () => {
      console.log("[SHUTDOWN] MongoDB connection closed");
      process.exit(0);
    });
  });
});

process.on("SIGINT", () => {
  console.log("\n[SHUTDOWN] SIGINT signal received: closing HTTP server");
  cronScheduler.stopAll();
  server.close(() => {
    console.log("[SHUTDOWN] HTTP server closed");
    mongoose.connection.close(false, () => {
      console.log("[SHUTDOWN] MongoDB connection closed");
      process.exit(0);
    });
  });
});

process.on("uncaughtException", (error) => {
  console.error("[ERROR] Uncaught Exception:", error);
  process.exit(1);
});

module.exports = app;
