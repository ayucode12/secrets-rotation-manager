const mongoose = require("mongoose");

const DEFAULT_OPTIONS = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

async function connectDatabase(uri, options = {}) {
  const merged = { ...DEFAULT_OPTIONS, ...options };

  mongoose.connection.on("connected", () =>
    console.log("[database] MongoDB connected")
  );
  mongoose.connection.on("disconnected", () =>
    console.log("[database] MongoDB disconnected")
  );
  mongoose.connection.on("error", (err) =>
    console.error("[database] MongoDB error:", err)
  );

  return mongoose.connect(uri, merged);
}

async function disconnectDatabase() {
  return mongoose.disconnect();
}

module.exports = { connectDatabase, disconnectDatabase };
