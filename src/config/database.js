const mongoose = require("mongoose");
const logger = require("../utils/logger");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/secrets-rotation-manager";

/**
 * MongoDB Connection
 */
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });

    logger.info("✓ MongoDB Database Connection Successful");
    return mongoose.connection;
  } catch (error) {
    logger.error("✗ MongoDB Connection Failed:", error);
    throw error;
  }
};

// Connection Event Handlers
mongoose.connection.on("connected", () => {
  logger.info("Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  logger.error("Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  logger.warn("Mongoose disconnected from MongoDB");
});

module.exports = connectDB;
