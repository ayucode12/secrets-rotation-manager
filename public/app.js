const apiRoot = "/api/rotations";

const panelButtons = Array.from(document.querySelectorAll(".panelButton"));
const refreshDashboardBtn = document.getElementById("refreshDashboard");
const quickSetupBtn = document.getElementById("quickSetup");
const quickSetupMessage = document.getElementById("quickSetupMessage");
const loadSecretsBtn = document.getElementById("loadSecrets");
const loadSchedulesBtn = document.getElementById("loadSchedules");
const loadLogsBtn = document.getElementById("loadLogs");
const manualRotateBtn = document.getElementById("manualRotate");
const manualSecretNameInput = document.getElementById("manualSecretName");
const manualRotationMessage = document.getElementById("manualRotationMessage");
const checkHealthBtn = document.getElementById("checkHealth");

const registerSecretBtn = document.getElementById("registerSecret");
const registerSecretNameInput = document.getElementById("registerSecretName");
const registerSecretTypeSelect = document.getElementById("registerSecretType");
const registerRotationPolicyInput = document.getElementById("registerRotationPolicy");
const registerSecretMessage = document.getElementById("registerSecretMessage");

const createScheduleBtn = document.getElementById("createSchedule");
const scheduleSecretNameInput = document.getElementById("scheduleSecretName");
const scheduleCronInput = document.getElementById("scheduleCron");
const scheduleServicesInput = document.getElementById("scheduleServices");
const createScheduleMessage = document.getElementById("createScheduleMessage");

const dashRotations = document.getElementById("dashRotations");
const dashSecrets = document.getElementById("dashSecrets");
const dashSchedules = document.getElementById("dashSchedules");
const dashHealth = document.getElementById("dashHealth");

const secretsTableBody = document.getElementById("secretsTableBody");
const schedulesTableBody = document.getElementById("schedulesTableBody");
const logsOutput = document.getElementById("logsOutput");
const healthOutput = document.getElementById("healthOutput");

function navigateTo(panelId) {
  document.querySelectorAll(".tabPanel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === panelId);
  });
  panelButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.panel === panelId));
}

panelButtons.forEach((btn) => {
  btn.addEventListener("click", () => navigateTo(btn.dataset.panel));
});

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText || "Request failed");
  }
  return res.json();
}

function renderTable(tableBody, rows = []) {
  tableBody.innerHTML = rows.map((row) => `<tr>${row}</tr>`).join("");
}

async function loadSecrets() {
  try {
    const data = await fetchJson(`${apiRoot}/secrets`);
    const secrets = data.secrets || [];
    dashSecrets.textContent = String(secrets.length);
    renderTable(
      secretsTableBody,
      secrets.map((secret) => {
        const services = Array.isArray(secret.dependentServices)
          ? secret.dependentServices.join(", ")
          : "-";
        return `<td>${secret.secretName}</td><td>${secret.secretType || "custom"}</td><td>${secret.currentVersion || "-"}</td><td>${secret.rotationPolicy}</td><td>${services}</td>`;
      })
    );
  } catch (err) {
    secretsTableBody.innerHTML = `<tr><td colspan="5">Load error: ${err.message}</td></tr>`;
  }
}

async function loadSchedules() {
  try {
    const data = await fetchJson(`${apiRoot}/schedules`);
    const schedules = data.schedules || [];
    dashSchedules.textContent = String(schedules.length);
    renderTable(
      schedulesTableBody,
      schedules.map((schedule) => {
        const services = Array.isArray(schedule.affectedServices) ? schedule.affectedServices.join(", ") : "-";
        return `<td>${schedule.secretName}</td><td>${schedule.cronExpression}</td><td>${schedule.isActive}</td><td>${services}</td><td>${new Date(schedule.createdAt).toLocaleString() || "-"}</td>`;
      })
    );
  } catch (err) {
    schedulesTableBody.innerHTML = `<tr><td colspan="5">Load error: ${err.message}</td></tr>`;
  }
}

async function loadLogs() {
  try {
    const data = await fetchJson(`${apiRoot}/logs?limit=50`);
    const logs = data.logs || [];
    logsOutput.textContent = logs
      .map((entry) =>
        `[${new Date(entry.createdAt).toLocaleString()}] ${entry.secretName} - ${entry.status} - ${entry.message || "no message"}`
      )
      .join("\n");
  } catch (err) {
    logsOutput.textContent = `Error loading logs: ${err.message}`;
  }
}

async function findRotationsAndUpdate() {
  try {
    const healthData = await fetchJson("/health");
    dashHealth.textContent = healthData.status || "unknown";
    dashRotations.textContent = String(healthData.activeRotations || 0);
  } catch (err) {
    dashHealth.textContent = `fail: ${err.message}`;
  }
}

async function quickSetup() {
  quickSetupMessage.className = "notification";
  quickSetupMessage.textContent = "Setting up sample data...";

  const sampleSecrets = [
    { secretName: "db-password", secretType: "db-credentials", rotationPolicy: "time-based" },
    { secretName: "api-key", secretType: "api-key", rotationPolicy: "time-based" },
    { secretName: "ssl-cert", secretType: "certificate", rotationPolicy: "expiration-based" }
  ];

  const sampleSchedules = [
    { secretName: "db-password", cronExpression: "0 2 * * 1", affectedServices: ["web-app", "api-server"] },
    { secretName: "api-key", cronExpression: "0 0 1 * *", affectedServices: ["external-api"] }
  ];

  try {
    // Register sample secrets
    for (const secret of sampleSecrets) {
      await fetchJson(`${apiRoot}/secrets/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(secret),
      });
    }

    // Create sample schedules
    for (const schedule of sampleSchedules) {
      await fetchJson(`${apiRoot}/schedules/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedule),
      });
    }

    quickSetupMessage.classList.add("success");
    quickSetupMessage.textContent = "Sample data created! Refreshing dashboard...";
    setTimeout(() => {
      refreshDashboardBtn.click();
      quickSetupMessage.textContent = "";
    }, 2000);
  } catch (err) {
    quickSetupMessage.classList.add("error");
    quickSetupMessage.textContent = `Setup failed: ${err.message}`;
  }
}

async function triggerManualRotation() {
  const secretName = manualSecretNameInput.value.trim();
  manualRotationMessage.className = "notification";

  if (!secretName) {
    manualRotationMessage.classList.add("error");
    manualRotationMessage.textContent = "Please enter a secret name to rotate.";
    return;
  }

  try {
    const result = await fetchJson(`${apiRoot}/manual`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secretName }),
    });
    manualRotationMessage.classList.add("success");
    manualRotationMessage.textContent = `Rotation started: ${result.rotation?.rotationId || "unknown"}`;
    findRotationsAndUpdate();
  } catch (err) {
    manualRotationMessage.classList.add("error");
    manualRotationMessage.textContent = `Rotation failed: ${err.message}`;
  }
}

async function registerSecret() {
  const secretName = registerSecretNameInput.value.trim();
  const secretType = registerSecretTypeSelect.value;
  const rotationPolicy = registerRotationPolicyInput.value.trim();

  registerSecretMessage.className = "notification";

  if (!secretName || !rotationPolicy) {
    registerSecretMessage.classList.add("error");
    registerSecretMessage.textContent = "Secret name and rotation policy are required.";
    return;
  }

  try {
    const result = await fetchJson(`${apiRoot}/secrets/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secretName,
        secretType,
        rotationPolicy,
        dependentServices: [],
        metadata: {}
      }),
    });
    registerSecretMessage.classList.add("success");
    registerSecretMessage.textContent = `Secret '${secretName}' registered successfully!`;
    registerSecretNameInput.value = "";
    registerRotationPolicyInput.value = "";
    loadSecrets(); // Refresh the secrets list
    findRotationsAndUpdate(); // Update dashboard stats
  } catch (err) {
    registerSecretMessage.classList.add("error");
    registerSecretMessage.textContent = `Registration failed: ${err.message}`;
  }
}

async function createSchedule() {
  const secretName = scheduleSecretNameInput.value.trim();
  const cronExpression = scheduleCronInput.value.trim();
  const servicesText = scheduleServicesInput.value.trim();

  createScheduleMessage.className = "notification";

  if (!secretName || !cronExpression) {
    createScheduleMessage.classList.add("error");
    createScheduleMessage.textContent = "Secret name and cron expression are required.";
    return;
  }

  const affectedServices = servicesText ? servicesText.split(",").map(s => s.trim()) : [];

  try {
    const result = await fetchJson(`${apiRoot}/schedules/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secretName,
        cronExpression,
        affectedServices,
        description: `Scheduled rotation for ${secretName}`
      }),
    });
    createScheduleMessage.classList.add("success");
    createScheduleMessage.textContent = `Schedule created for '${secretName}'!`;
    scheduleSecretNameInput.value = "";
    scheduleCronInput.value = "";
    scheduleServicesInput.value = "";
    loadSchedules(); // Refresh the schedules list
    findRotationsAndUpdate(); // Update dashboard stats
  } catch (err) {
    createScheduleMessage.classList.add("error");
    createScheduleMessage.textContent = `Schedule creation failed: ${err.message}`;
  }
}

async function checkHealth() {
  try {
    const status = await fetchJson("/health");
    healthOutput.textContent = JSON.stringify(status, null, 2);
    dashHealth.textContent = status.status || "unknown";
    dashRotations.textContent = status.activeRotations || "0";
  } catch (err) {
    healthOutput.textContent = `Error: ${err.message}`;
    dashHealth.textContent = "error";
  }
}

refreshDashboardBtn?.addEventListener("click", () => {
  loadSecrets();
  loadSchedules();
  findRotationsAndUpdate();
});
quickSetupBtn?.addEventListener("click", quickSetup);
loadSecretsBtn?.addEventListener("click", loadSecrets);
loadSchedulesBtn?.addEventListener("click", loadSchedules);
loadLogsBtn?.addEventListener("click", loadLogs);
manualRotateBtn?.addEventListener("click", triggerManualRotation);
registerSecretBtn?.addEventListener("click", registerSecret);
createScheduleBtn?.addEventListener("click", createSchedule);
checkHealthBtn?.addEventListener("click", checkHealth);

// Startup
navigateTo("dashboard");
refreshDashboardBtn?.click();
