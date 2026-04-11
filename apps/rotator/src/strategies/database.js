const crypto = require("crypto");

/**
 * Rotates a database user's password.
 *
 * Expected providerConfig:
 *   { connectionUri: "postgresql://admin:pass@host/db", dbUser: "app_user" }
 *
 * This is a scaffold — replace the body with real DB driver calls
 * (e.g. pg for Postgres, mysql2 for MySQL) for your use case.
 */
async function rotate(secret) {
  const { connectionUri, dbUser } = secret.providerConfig || {};

  if (!connectionUri || !dbUser) {
    throw new Error(
      'database provider requires providerConfig.connectionUri and providerConfig.dbUser'
    );
  }

  const newPassword = crypto.randomBytes(24).toString("base64url");

  // TODO: connect to the database and run the ALTER USER query
  // Example for Postgres (uncomment and install "pg"):
  //
  // const { Client } = require("pg");
  // const client = new Client({ connectionString: connectionUri });
  // await client.connect();
  // await client.query(`ALTER USER ${dbUser} PASSWORD '${newPassword}'`);
  // await client.end();

  console.log(
    `[strategy:database] Would rotate password for "${dbUser}" — using generated value (scaffold mode)`
  );

  return newPassword;
}

module.exports = { rotate };
