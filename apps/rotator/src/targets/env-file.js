const fs = require("fs/promises");
const path = require("path");

/**
 * Updates a key in a .env-style file with the new secret value.
 *
 * Expected target.config:
 *   { path: "/app/.env", key: "DB_PASSWORD" }
 */
async function deliver(target, secret, newValue) {
  const { path: filePath, key } = target.config;

  if (!filePath || !key) {
    throw new Error("env-file target requires config.path and config.key");
  }

  const resolved = path.resolve(filePath);
  let contents;

  try {
    contents = await fs.readFile(resolved, "utf-8");
  } catch {
    contents = "";
  }

  const regex = new RegExp(`^${key}=.*$`, "m");

  if (regex.test(contents)) {
    contents = contents.replace(regex, `${key}=${newValue}`);
  } else {
    contents += `${contents.endsWith("\n") ? "" : "\n"}${key}=${newValue}\n`;
  }

  await fs.writeFile(resolved, contents, "utf-8");
  console.log(`[target:env-file] Updated ${key} in ${resolved}`);
}

module.exports = { deliver };
