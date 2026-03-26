const mongoose = require("mongoose");

const RotationLogSchema = new mongoose.Schema(
  {
    rotationId: {
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
    status: {
      type: String,
      enum: ["pending", "in-progress", "success", "failed", "rolled-back"],
      default: "pending",
      index: true,
    },
    oldSecretVersion: {
      type: String,
      required: true,
    },
    newSecretVersion: {
      type: String,
      default: null,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: null,
    },
    validationStatus: {
      type: String,
      enum: ["pending", "validated", "failed", null],
      default: "pending",
    },
    validationResults: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    affectedServices: {
      type: [String],
      default: [],
    },
    errorMessage: {
      type: String,
      default: null,
    },
    rollbackMessage: {
      type: String,
      default: null,
    },
    scheduledRotation: {
      type: Boolean,
      default: false,
    },
    triggeredBy: {
      type: String,
      enum: ["manual", "cron", "api"],
      default: "manual",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

// Index for querying recent rotations
RotationLogSchema.index({ createdAt: -1 });
RotationLogSchema.index({ secretName: 1, status: 1 });

module.exports = mongoose.model("RotationLog", RotationLogSchema);
