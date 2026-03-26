const mongoose = require("mongoose");

const RotationScheduleSchema = new mongoose.Schema(
  {
    scheduleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    secretName: {
      type: String,
      required: true,
      index: true,
    },
    cronExpression: {
      type: String,
      required: true,
      description: "Unix cron format (e.g., '0 3 * * 0' for weekly)",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastExecutionTime: {
      type: Date,
      default: null,
    },
    nextExecutionTime: {
      type: Date,
      default: null,
    },
    rotationDuration: {
      type: Number,
      default: 3600,
      description: "Duration in seconds for zero-downtime rotation",
    },
    affectedServices: {
      type: [String],
      default: [],
      description: "Services that depend on this secret",
    },
    validationScript: {
      type: String,
      default: null,
      description: "Path to validation script",
    },
    notificationEmail: {
      type: [String],
      default: [],
    },
    retryAttempts: {
      type: Number,
      default: 3,
    },
    retryDelayMs: {
      type: Number,
      default: 5000,
    },
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

RotationScheduleSchema.index({ isActive: 1, nextExecutionTime: 1 });

module.exports = mongoose.model("RotationSchedule", RotationScheduleSchema);
