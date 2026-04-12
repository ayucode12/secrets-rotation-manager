const generic = require("./generic");
const customApi = require("./custom-api");

const strategies = {
  generic,
  "custom-api": customApi,
};

async function generateNewValue(secret) {
  const strategy = strategies[secret.provider || "generic"];
  if (!strategy) {
    throw new Error(`Unknown provider "${secret.provider}"`);
  }
  return strategy.rotate(secret);
}

module.exports = { generateNewValue };
