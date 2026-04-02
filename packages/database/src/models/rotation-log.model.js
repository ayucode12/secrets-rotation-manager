const { Schema, model } = require("mongoose");

const rotationLogSchema = new Schema(
  {
    secretId: { type: Schema.Types.ObjectId, ref: "Secret", required: true },
    secretName: { type: String, required: true },
    status: {
      type: String,
      enum: ["success", "failure"],
      required: true,
    },
    triggeredBy: {
      type: String,
      enum: ["manual", "scheduled"],
      required: true,
    },
    message: { type: String },
  },
  { timestamps: true }
);

rotationLogSchema.index({ secretId: 1, createdAt: -1 });

const RotationLog = model("RotationLog", rotationLogSchema);

module.exports = { RotationLog, rotationLogSchema };
