const { RotationLog } = require("../models");

const rotationLogQueries = {
  findBySecretId(secretId) {
    return RotationLog.find({ secretId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
  },

  findAll(limit = 50) {
    return RotationLog.find().sort({ createdAt: -1 }).limit(limit).lean();
  },

  create({ secretId, secretName, status, triggeredBy, message }) {
    return RotationLog.create({
      secretId,
      secretName,
      status,
      triggeredBy,
      message,
    });
  },
};

module.exports = { rotationLogQueries };
