/**
 * Rotates a secret by calling an external API that returns a new value.
 *
 * Expected providerConfig:
 *   { url: "https://provider.example.com/rotate", method: "POST",
 *     headers: { "Authorization": "Bearer ..." },
 *     body: { "keyId": "..." },
 *     valuePath: "newApiKey" }
 *
 * `valuePath` is the JSON key in the response that contains the new secret.
 */
async function rotate(secret) {
  const {
    url,
    method = "POST",
    headers = {},
    body = {},
    valuePath = "value",
  } = secret.providerConfig || {};

  if (!url) {
    throw new Error("custom-api provider requires providerConfig.url");
  }

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: method !== "GET" ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Provider API returned ${res.status}: ${text}`);
  }

  const json = await res.json();
  const newValue = json[valuePath];

  if (!newValue) {
    throw new Error(
      `Provider API response missing "${valuePath}" field`
    );
  }

  return newValue;
}

module.exports = { rotate };
