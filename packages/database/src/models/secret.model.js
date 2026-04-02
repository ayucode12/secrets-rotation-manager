const { Schema, model } = require("mongoose");

const secretSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    service: { type: String, required: true, trim: true },
    value: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "expired", "rotating"],
      default: "active",
    },
    rotationIntervalDays: { type: Number, default: 30, min: 1 },
    lastRotatedAt: { type: Date, default: Date.now },
    nextRotationAt: { type: Date },
  },
  { timestamps: true }
);

secretSchema.index({ status: 1, nextRotationAt: 1 });

const Secret = model("Secret", secretSchema);

module.exports = { Secret, secretSchema };
