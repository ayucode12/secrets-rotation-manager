const logger = require("../utils/logger");

/**
 * Request Logging Middleware
 */
module.exports = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusColor =
      status >= 500 ? "\x1b[31m" : status >= 400 ? "\x1b[33m" : "\x1b[32m";

    const message = `${statusColor}${req.method} ${req.path}\x1b[0m ${status} - ${duration}ms`;
    console.log(message);

    logger.debug("HTTP Request", {
      method: req.method,
      path: req.path,
      status,
      duration,
      query: req.query,
    });
  });

  next();
};
