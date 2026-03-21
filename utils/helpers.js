/**
 * Utility functions for common operations
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

/**
 * Generate random token
 */
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString("hex");
};

/**
 * Hash password or string (one-way, for comparison)
 */
const hashValue = (value) => {
  return crypto.createHash("sha256").update(value).digest("hex");
};

/**
 * Verify if string matches hash
 */
const verifyHash = (value, hash) => {
  return hashValue(value) === hash;
};

/**
 * Sleep/delay function
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retry function with exponential backoff
 */
const retry = async (fn, options = {}) => {
  const { maxAttempts = 3, delayMs = 1000, backoff = 2 } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }

      const delay = delayMs * Math.pow(backoff, attempt - 1);
      console.log(`Retry attempt ${attempt}/${maxAttempts} after ${delay}ms`);
      await sleep(delay);
    }
  }
};

/**
 * Ensure directory exists
 */
const ensureDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * Write to file (ensure directory first)
 */
const writeFile = (filePath, content) => {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
};

/**
 * Read file safely
 */
const readFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, "utf8");
    }
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
  }
  return null;
};

/**
 * Format date to ISO string
 */
const formatDate = (date = new Date()) => {
  return date.toISOString();
};

/**
 * Parse cron expression description
 */
const describeCron = (expression) => {
  const parts = expression.split(" ");
  if (parts.length !== 5) return "Invalid cron expression";

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  const descriptions = [];

  if (minute !== "*") descriptions.push(`at minute ${minute}`);
  if (hour !== "*") descriptions.push(`hour ${hour}`);
  if (dayOfMonth !== "*") descriptions.push(`on day ${dayOfMonth}`);
  if (month !== "*") descriptions.push(`in month ${month}`);

  const daysName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  if (dayOfWeek !== "*" && dayOfWeek !== "?") {
    descriptions.push(`on ${daysName[parseInt(dayOfWeek)]}`);
  }

  return descriptions.join(" ") || "Every minute";
};

/**
 * Sanitize secret value for logging
 */
const maskSecret = (value, showChars = 4) => {
  if (!value || value.length <= showChars) return "***";
  return value.substring(0, showChars) + "*".repeat(Math.max(3, value.length - showChars));
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Parse environment variables safely
 */
const getEnvVar = (key, defaultValue = null, required = false) => {
  const value = process.env[key];

  if (!value && required) {
    throw new Error(`Required environment variable ${key} is not set`);
  }

  return value || defaultValue;
};

/**
 * Deep merge objects
 */
const deepMerge = (target, source) => {
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (typeof source[key] === "object" && source[key] !== null) {
        target[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  return target;
};

/**
 * Convert array to object by key
 */
const arrayToObject = (array, keyField) => {
  return array.reduce((obj, item) => {
    obj[item[keyField]] = item;
    return obj;
  }, {});
};

/**
 * Batch array into chunks
 */
const chunkArray = (array, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

module.exports = {
  generateToken,
  hashValue,
  verifyHash,
  sleep,
  retry,
  ensureDirectory,
  writeFile,
  readFile,
  formatDate,
  describeCron,
  maskSecret,
  isValidEmail,
  getEnvVar,
  deepMerge,
  arrayToObject,
  chunkArray,
};
