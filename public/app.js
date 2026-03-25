const apiRoot = "/api/rotations";

const loadSecretsBtn = document.getElementById("loadSecrets");
const secretsList = document.getElementById("secretsList");
const manualRotateBtn = document.getElementById("manualRotate");
const manualSecretNameInput = document.getElementById("manualSecretName");
const manualRotationMessage = document.getElementById("manualRotationMessage");
const checkHealthBtn = document.getElementById("checkHealth");
const healthOutput = document.getElementById("healthOutput");

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText || "Request failed");
  }
  return res.json();
}

async function loadSecrets() {
  secretsList.innerHTML = "<li>Loading…</li>";
  try {
    const data = await fetchJson(`${apiRoot}/secrets`);
    secretsList.innerHTML = "";
    if (!data.secrets || !data.secrets.length) {
      secretsList.innerHTML = "<li>No secrets registered.</li>";
      return;
    }
    data.secrets.forEach((secret) => {
      const li = document.createElement("li");
      li.textContent = `${secret.secretName} (${secret.rotationPolicy})`;      
      secretsList.appendChild(li);
    });
  } catch (err) {
    secretsList.innerHTML = `<li>Error: ${err.message}</li>`;
  }
}

async function triggerManualRotation() {
  const secretName = manualSecretNameInput.value.trim();
  manualRotationMessage.textContent = "";
  if (!secretName) {
    manualRotationMessage.textContent = "Secret name is required";
    return;
  }

  try {
    const res = await fetchJson(`${apiRoot}/manual`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secretName }),
    });
    manualRotationMessage.textContent = "Rotation started: " + (res.rotation?.rotationId || "(no id)");
  } catch (err) {
    manualRotationMessage.textContent = `Error: ${err.message}`;
  }
}

async function checkHealth() {
  try {
    const status = await fetchJson("/health");
    healthOutput.textContent = JSON.stringify(status, null, 2);
  } catch (err) {
    healthOutput.textContent = `Error: ${err.message}`;
  }
}

loadSecretsBtn.addEventListener("click", loadSecrets);
manualRotateBtn.addEventListener("click", triggerManualRotation);
checkHealthBtn.addEventListener("click", checkHealth);

// initial state
healthOutput.textContent = "Press \"Check API status\" to start.\n";
