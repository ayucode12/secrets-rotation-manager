const bcrypt = require("bcryptjs");
const { userQueries } = require("@repo/database");
const { signToken } = require("../middleware/auth");

async function register(req, res) {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "name, email, and password are required" });
  }

  try {
    const existing = await userQueries.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await userQueries.create({
      name,
      email,
      password: hashed,
      role: role || "user",
    });

    const token = signToken({ id: user._id, email: user.email, role: user.role });

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  try {
    const user = await userQueries.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account is deactivated" });
    }

    const token = signToken({ id: user._id, email: user.email, role: user.role });

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function me(req, res) {
  try {
    const user = await userQueries.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { register, login, me };
