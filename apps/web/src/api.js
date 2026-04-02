const API = "/api";

export async function fetchSecrets() {
  const res = await fetch(`${API}/secrets`);
  if (!res.ok) throw new Error("Failed to fetch secrets");
  return res.json();
}

export async function createSecret(data) {
  const res = await fetch(`${API}/secrets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create secret");
  return res.json();
}

export async function deleteSecret(id) {
  const res = await fetch(`${API}/secrets/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete secret");
  return res.json();
}

export async function rotateSecret(id) {
  const res = await fetch(`${API}/secrets/${id}/rotate`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to rotate secret");
  return res.json();
}

export async function fetchLogs() {
  const res = await fetch(`${API}/logs`);
  if (!res.ok) throw new Error("Failed to fetch logs");
  return res.json();
}
