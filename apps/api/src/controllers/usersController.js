const bcrypt = require("bcryptjs");
const { userQueries } = require("@repo/database");

async function getAll(req, res) {
  try {
    const { page, limit, role, isActive } = req.query;
    const result = await userQueries.findAll({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      role,
      isActive: isActive !== undefined ? isActive === "true" : undefined,
    });

    const sanitized = {
      ...result,
      data: result.data.map(({ password, ...u }) => u),
    };
    res.json(sanitized);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getById(req, res) {
  try {
    const user = await userQueries.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const { password, ...safe } = user;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function update(req, res) {
  try {
    const { name, role, isActive } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (role) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;

    const user = await userQueries.updateById(req.params.id, updates);
    if (!user) return res.status(404).json({ error: "User not found" });

    const { password, ...safe } = user;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    const user = await userQueries.deleteById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAll, getById, update, remove };
