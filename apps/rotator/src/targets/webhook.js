/**
 * Delivers the new secret value to a webhook URL.
 *
 * Expected target.config:
 *   { url: "http://service-a:8080/config/reload",
 *     headers: { "Authorization": "Bearer ..." } }
 */
async function deliver(target, secret, newValue) {
  const { url, headers = {} } = target.config;

  if (!url) {
    throw new Error("webhook target requires config.url");
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({
      secretName: secret.name,
      service: secret.service,
      newValue,
      rotatedAt: new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Webhook ${url} returned ${res.status}: ${text}`);
  }
}

module.exports = { deliver };
