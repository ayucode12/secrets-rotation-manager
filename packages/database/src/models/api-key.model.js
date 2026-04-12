const { Schema, model } = require("mongoose");
const crypto = require("crypto");

const apiKeySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, unique: true },
    service: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    lastUsedAt: { type: Date },
  },
  { timestamps: true }
);

apiKeySchema.statics.generateKey = function () {
  return "srm_" + crypto.randomBytes(24).toString("hex");
};

const ApiKey = model("ApiKey", apiKeySchema);

module.exports = { ApiKey, apiKeySchema };
