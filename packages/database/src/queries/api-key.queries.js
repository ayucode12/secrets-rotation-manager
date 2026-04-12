const { ApiKey } = require("../models/api-key.model");

const apiKeyQueries = {
  findByKey(key) {
    return ApiKey.findOne({ key, isActive: true }).lean();
  },

  findAll() {
    return ApiKey.find().sort({ createdAt: -1 }).lean();
  },

  create({ name, service }) {
    const key = ApiKey.generateKey();
    return ApiKey.create({ name, key, service });
  },

  revoke(id) {
    return ApiKey.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();
  },

  deleteById(id) {
    return ApiKey.findByIdAndDelete(id).lean();
  },

  touchLastUsed(id) {
    return ApiKey.findByIdAndUpdate(id, { lastUsedAt: new Date() });
  },
};

module.exports = { apiKeyQueries };
