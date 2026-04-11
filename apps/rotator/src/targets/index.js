const webhook = require("./webhook");
const awsSsm = require("./aws-ssm");
const envFile = require("./env-file");

const handlers = {
  webhook,
  "aws-ssm": awsSsm,
  "env-file": envFile,
};

/**
 * Delivers the new secret value to every target defined on the secret.
 * Returns an array of { label, type, ok, error? } results.
 */
async function deliverToTargets(secret, newValue) {
  if (!secret.targets || secret.targets.length === 0) return [];

  const results = [];

  for (const target of secret.targets) {
    const handler = handlers[target.type];
    const label = target.label || target.type;

    if (!handler) {
      results.push({ label, type: target.type, ok: false, error: `Unknown target type "${target.type}"` });
      continue;
    }

    try {
      await handler.deliver(target, secret, newValue);
      results.push({ label, type: target.type, ok: true });
      console.log(`[targets] Delivered to "${label}" (${target.type})`);
    } catch (err) {
      results.push({ label, type: target.type, ok: false, error: err.message });
      console.error(`[targets] Failed to deliver to "${label}":`, err.message);
    }
  }

  return results;
}

module.exports = { deliverToTargets };
