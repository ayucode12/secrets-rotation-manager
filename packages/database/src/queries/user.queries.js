const { User } = require("../models");

const userQueries = {
  findById(id) {
    return User.findById(id).lean();
  },

  findByEmail(email) {
    return User.findOne({ email }).lean();
  },

  findAll({ page = 1, limit = 20, role, isActive } = {}) {
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive;

    const skip = (page - 1) * limit;

    return Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]).then(([data, total]) => ({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }));
  },

  create({ name, email, password, role }) {
    return User.create({ name, email, password, role });
  },

  updateById(id, updates) {
    return User.findByIdAndUpdate(id, updates, { new: true }).lean();
  },

  deleteById(id) {
    return User.findByIdAndDelete(id).lean();
  },
};

module.exports = { userQueries };
