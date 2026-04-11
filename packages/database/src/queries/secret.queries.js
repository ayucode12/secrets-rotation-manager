const { Secret } = require("../models");

const secretQueries = {
  findAll() {
    return Secret.find().sort({ createdAt: -1 }).lean();
  },

  findById(id) {
    return Secret.findById(id).lean();
  },

  create({
    name,
    service,
    value,
    rotationIntervalDays = 30,
    provider = "generic",
    providerConfig = {},
    targets = [],
  }) {
    const lastRotatedAt = new Date();
    const nextRotationAt = new Date(
      lastRotatedAt.getTime() + rotationIntervalDays * 24 * 60 * 60 * 1000
    );
    return Secret.create({
      name,
      service,
      value,
      rotationIntervalDays,
      provider,
      providerConfig,
      targets,
      lastRotatedAt,
      nextRotationAt,
    });
  },

  updateById(id, updates) {
    return Secret.findByIdAndUpdate(id, updates, { new: true }).lean();
  },

  deleteById(id) {
    return Secret.findByIdAndDelete(id).lean();
  },

  findDueForRotation() {
    return Secret.find({
      status: "active",
      nextRotationAt: { $lte: new Date() },
    }).lean();
  },
};

module.exports = { secretQueries };
