/**
 * Writes the new secret value to AWS Systems Manager Parameter Store.
 *
 * Expected target.config:
 *   { region: "us-east-1", parameterName: "/prod/db-password" }
 *
 * Scaffold — install @aws-sdk/client-ssm and uncomment to use for real.
 */
async function deliver(target, secret, newValue) {
  const { region, parameterName } = target.config;

  if (!parameterName) {
    throw new Error("aws-ssm target requires config.parameterName");
  }

  // TODO: uncomment after installing @aws-sdk/client-ssm
  //
  // const { SSMClient, PutParameterCommand } = require("@aws-sdk/client-ssm");
  // const client = new SSMClient({ region: region || "us-east-1" });
  // await client.send(new PutParameterCommand({
  //   Name: parameterName,
  //   Value: newValue,
  //   Type: "SecureString",
  //   Overwrite: true,
  // }));

  console.log(
    `[target:aws-ssm] Would write "${secret.name}" to ${parameterName} (scaffold mode)`
  );
}

module.exports = { deliver };
