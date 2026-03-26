const express = require("express");
const rotationService = require("../../services/rotationService");
const cronScheduler = require("../../services/cronScheduler");

const router = express.Router();

/**
 * GET /health
 * System health check endpoint
 */
router.get("/", (req, res) => {
  try {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      database: "connected",
      activeRotations: rotationService.activeRotations?.size || 0,
      scheduledTasks: cronScheduler.getAllTasks().length,
      memory: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
      },
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      message: error.message,
    });
  }
});

/**
 * GET /health/ready
 * Readiness probe for orchestration
 */
router.get("/ready", (req, res) => {
  const isReady = process.uptime() > 5; // Ready after 5 seconds
  const status = isReady ? 200 : 503;
  res.status(status).json({ ready: isReady });
});

/**
 * GET /health/live
 * Liveness probe for orchestration
 */
router.get("/live", (req, res) => {
  res.status(200).json({ alive: true });
});

module.exports = router;
