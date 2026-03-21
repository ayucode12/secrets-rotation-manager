/**
 * Middleware functions for request validation and logging
 */

const rateLimit = require("express-rate-limit");

/**
 * Rate limiting middleware for API protection
 */
const createRateLimiter = (windowMs = 900000, maxRequests = 100) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === "test",
  });
};

/**
 * API Key validation middleware
 */
const validateApiKey = (req, res, next) => {
  if (process.env.NODE_ENV === "test") {
    return next();
  }

  const apiKey = req.headers["x-api-key"] || req.query.api_key;

  if (!apiKey) {
    return res.status(401).json({
      error: "API key required",
      message: "Please provide X-API-Key header or api_key query parameter",
    });
  }

  // Validate API key (implement your validation logic)
  if (apiKey !== process.env.API_KEY) {
    return res.status(403).json({
      error: "Invalid API key",
      message: "The provided API key is not valid",
    });
  }

  next();
};

/**
 * Request validation middleware
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    if (!schema) return next();

    // Simple validation (enhance with joi or yup for production)
    const errors = [];

    for (const field of schema.required || []) {
      if (!req.body[field]) {
        errors.push(`${field} is required`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors,
      });
    }

    next();
  };
};

/**
 * Error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error(`[ERROR] ${statusCode}: ${message}`, err);

  res.status(statusCode).json({
    error: message,
    statusCode,
    timestamp: new Date(),
    requestId: req.id,
  });
};

/**
 * 404 handler middleware
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: "Not Found",
    path: req.path,
    method: req.method,
    message: "The requested resource does not exist",
  });
};

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);

  // Log response
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
    );
  });

  next();
};

/**
 * CORS middleware configuration
 */
const corsConfig = {
  origin: (origin, callback) => {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:3000").split(",");

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "X-API-Key", "Authorization"],
};

module.exports = {
  createRateLimiter,
  validateApiKey,
  validateRequest,
  errorHandler,
  notFoundHandler,
  requestLogger,
  corsConfig,
};
