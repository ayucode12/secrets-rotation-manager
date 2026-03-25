const logger = require("../utils/logger");

/**
 * Global Error Handler Middleware
 */
module.exports = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  logger.error(`${req.method} ${req.path}`, { status, message, error: err.message });

  res.status(status).json({
    error: {
      status,
      message,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
};
