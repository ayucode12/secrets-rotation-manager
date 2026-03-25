const fs = require("fs");
const path = require("path");

const LOG_DIR = process.env.LOG_DIR || "./logs";
const LOG_LEVEL = process.env.LOG_LEVEL || "info";

// Create logs directory if it doesn't exist
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

class Logger {
  constructor() {
    this.level = LOG_LEVELS[LOG_LEVEL] || LOG_LEVELS.info;
  }

  /**
   * Format log message with timestamp
   */
  formatMessage(level, message, data = "") {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${data ? data : ""}`;
  }

  /**
   * Write to log file
   */
  writeToFile(level, message, data) {
    const logFile = path.join(LOG_DIR, `${level}-${new Date().toISOString().split("T")[0]}.log`);
    const formatted = this.formatMessage(level, message, JSON.stringify(data || ""));
    fs.appendFileSync(logFile, formatted + "\n", "utf8");
  }

  /**
   * Log error
   */
  error(message, error = null) {
    if (this.level >= LOG_LEVELS.error) {
      console.error(`\x1b[31m${this.formatMessage("error", message)}\x1b[0m`);
      if (error instanceof Error) {
        console.error(`\x1b[31m${error.stack}\x1b[0m`);
      }
      this.writeToFile("error", message, error?.message || error);
    }
  }

  /**
   * Log warning
   */
  warn(message, data = null) {
    if (this.level >= LOG_LEVELS.warn) {
      console.warn(`\x1b[33m${this.formatMessage("warn", message)}\x1b[0m`);
      this.writeToFile("warn", message, data);
    }
  }

  /**
   * Log info
   */
  info(message, data = null) {
    if (this.level >= LOG_LEVELS.info) {
      console.log(`\x1b[36m${this.formatMessage("info", message)}\x1b[0m`);
      this.writeToFile("info", message, data);
    }
  }

  /**
   * Log debug
   */
  debug(message, data = null) {
    if (this.level >= LOG_LEVELS.debug) {
      console.debug(`\x1b[35m${this.formatMessage("debug", message)}\x1b[0m`);
      this.writeToFile("debug", message, data);
    }
  }
}

module.exports = new Logger();
