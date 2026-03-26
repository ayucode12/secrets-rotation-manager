const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const logger = require("./utils/logger");
const errorHandler = require("./middleware/errorHandler");
const requestLogger = require("./middleware/requestLogger");

// Import Routes
const rotationRoutes = require("./api/routes/rotationRoutes");
const healthRoutes = require("./api/routes/healthRoutes");

const app = express();

// ===== SECURITY MIDDLEWARE =====
app.use(helmet());

// CORS Configuration
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || "http://localhost:5000").split(","),
    credentials: true,
  }),
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

if (process.env.RATE_LIMIT_ENABLED === "true") {
  app.use("/api/", limiter);
}

// ===== BODY PARSER MIDDLEWARE =====
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Data Sanitization
app.use(mongoSanitize());

// ===== LOGGING MIDDLEWARE =====
app.use(requestLogger);

// ===== STATIC FILES =====
app.use("/app", express.static(path.join(__dirname, "../../frontend/public")));
app.get(/^\/app\/.*$/, (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/public/index.html"));
});

// ===== API ROUTES =====

// Health Check
app.use("/health", healthRoutes);

// Rotation Management
app.use("/api/rotations", rotationRoutes);

// ===== ROOT ENDPOINT =====
app.get("/", (req, res) => {
  res.status(200).json({
    name: "Secrets Rotation Manager",
    version: "2.0.0",
    environment: process.env.NODE_ENV || "development",
    documentation: "/api/docs",
    endpoints: {
      health: "GET /health",
      rotations: {
        manual: "POST /api/rotations/manual",
        cancel: "POST /api/rotations/cancel/:rotationId",
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

// ===== 404 HANDLER =====
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    path: req.path,
    message: "The requested endpoint does not exist",
    timestamp: new Date().toISOString(),
  });
});

// ===== ERROR HANDLING MIDDLEWARE =====
app.use(errorHandler);

module.exports = app;
