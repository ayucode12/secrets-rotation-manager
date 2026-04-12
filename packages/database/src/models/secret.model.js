const { Schema, model } = require("mongoose");

const targetSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["webhook"],
      required: true,
    },
    label: { type: String, trim: true },
    config: { type: Schema.Types.Mixed, required: true },
  },
  { _id: true }
);

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
    provider: {
      type: String,
      enum: ["generic", "custom-api"],
      default: "generic",
    },
    providerConfig: { type: Schema.Types.Mixed, default: {} },
    targets: { type: [targetSchema], default: [] },
    rotationIntervalDays: { type: Number, default: 30, min: 1 },
    lastRotatedAt: { type: Date, default: Date.now },
    nextRotationAt: { type: Date },
  },
  { timestamps: true }
);

secretSchema.index({ status: 1, nextRotationAt: 1 });

const Secret = model("Secret", secretSchema);

module.exports = { Secret, secretSchema };
