const crypto = require("crypto");

async function rotate(_secret) {
  return crypto.randomBytes(32).toString("hex");
}

module.exports = { rotate };
