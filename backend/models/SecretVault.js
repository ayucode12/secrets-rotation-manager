const mongoose = require("mongoose");

const SecretVaultSchema = new mongoose.Schema(
  {
    secretName: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    secretType: {
      type: String,
      enum: ["database_password", "api_key", "certificate", "token", "custom"],
      default: "custom",
    },
    currentVersion: {
      type: String,
      required: true,
    },
    previousVersion: {
      type: String,
      default: null,
    },
    encryptedValue: {
      type: String,
      required: true,
      select: false,
    },
    rotationPolicy: {
      type: String,
      required: true,
      index: true,
      description: "Reference to Git tracked policy",
    },
    status: {
      type: String,
      enum: ["active", "rotating", "backup", "deprecated"],
      default: "active",
      index: true,
    },
    dependentServices: {
      type: [String],
      default: [],
    },
    lastRotatedAt: {
      type: Date,
      default: null,
    },
    nextRotationAt: {
      type: Date,
      default: null,
    },
    rotationHistory: {
      type: [
        {
          version: String,
          rotatedAt: Date,
          rotatedBy: String,
          status: String,
        },
      ],
      default: [],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

SecretVaultSchema.index({ rotationPolicy: 1, status: 1 });
SecretVaultSchema.index({ nextRotationAt: 1 });

module.exports = mongoose.model("SecretVault", SecretVaultSchema);
