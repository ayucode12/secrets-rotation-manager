import { useState, useEffect } from "react";
import {
  fetchSecrets,
  createSecret,
  deleteSecret,
  rotateSecret,
  fetchLogs,
  fetchWebhookHits,
  seedDemo,
  clearDemo,
} from "./api";
import "./App.css";

const PROVIDER_OPTIONS = [
  { value: "generic", label: "Generic (random)" },
  { value: "database", label: "Database password" },
  { value: "custom-api", label: "Custom API" },
];

const TARGET_TYPE_OPTIONS = [
  { value: "webhook", label: "Webhook" },
  { value: "aws-ssm", label: "AWS SSM" },
  { value: "env-file", label: "Env File" },
];

const emptyTarget = { type: "webhook", label: "", config: { url: "" } };

function App() {
  const [secrets, setSecrets] = useState([]);
  const [logs, setLogs] = useState([]);
  const [webhookHits, setWebhookHits] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [expandedSecret, setExpandedSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    name: "",
    service: "",
    value: "",
    rotationIntervalDays: 30,
    provider: "generic",
    targets: [],
  });

  async function loadData() {
    try {
      const [secretsData, logsData, hitsData] = await Promise.all([
        fetchSecrets(),
        fetchLogs(),
        fetchWebhookHits(),
      ]);
      setSecrets(secretsData);
      setLogs(logsData);
      setWebhookHits(hitsData);
      setError(null);
    } catch (err) {
      setError("Failed to connect to API. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await createSecret(form);
      setForm({
        name: "",
        service: "",
        value: "",
        rotationIntervalDays: 30,
        provider: "generic",
        targets: [],
      });
      setShowForm(false);
      loadData();
    } catch {
      alert("Failed to create secret");
    }
  }

  async function handleRotate(id) {
    try {
      await rotateSecret(id);
      loadData();
    } catch {
      alert("Failed to rotate secret");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this secret?")) return;
    try {
      await deleteSecret(id);
      loadData();
    } catch {
      alert("Failed to delete secret");
    }
  }

  async function handleSeedDemo() {
    try {
      const result = await seedDemo();
      loadData();
      if (result.added.length === 0) {
        alert("Demo secrets already exist.");
      }
    } catch {
      alert("Failed to seed demo data");
    }
  }

  async function handleClearDemo() {
    if (!window.confirm("Delete ALL secrets, logs, and webhook hits?")) return;
    try {
      await clearDemo();
      loadData();
    } catch {
      alert("Failed to clear demo data");
    }
  }

  function addTarget() {
    setForm({ ...form, targets: [...form.targets, { ...emptyTarget }] });
  }

  function updateTarget(index, field, value) {
    const updated = form.targets.map((t, i) => {
      if (i !== index) return t;
      if (field === "type") {
        const defaultConfig =
          value === "webhook"
            ? { url: "" }
            : value === "aws-ssm"
              ? { region: "us-east-1", parameterName: "" }
              : { path: "", key: "" };
        return { ...t, type: value, config: defaultConfig };
      }
      if (field === "label") return { ...t, label: value };
      return { ...t, config: { ...t.config, ...value } };
    });
    setForm({ ...form, targets: updated });
  }

  function removeTarget(index) {
    setForm({ ...form, targets: form.targets.filter((_, i) => i !== index) });
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString();
  }

  function formatDateTime(dateStr) {
    return new Date(dateStr).toLocaleString();
  }

  function isDue(dateStr) {
    return new Date(dateStr) <= new Date();
  }

  const activeCount = secrets.filter((s) => s.status === "active").length;
  const dueCount = secrets.filter((s) => isDue(s.nextRotationAt)).length;

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <header>
        <div className="header-top">
          <div>
            <h1>Secrets Rotation Manager</h1>
            <p>Manage and rotate your application secrets</p>
          </div>
          <div className="demo-actions">
            <button className="btn demo-seed" onClick={handleSeedDemo}>
              Load Demo
            </button>
            <button className="btn demo-clear" onClick={handleClearDemo}>
              Clear All
            </button>
          </div>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="stats">
        <div className="stat-card">
          <span className="stat-value">{secrets.length}</span>
          <span className="stat-label">Total Secrets</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{activeCount}</span>
          <span className="stat-label">Active</span>
        </div>
        <div className="stat-card warning">
          <span className="stat-value">{dueCount}</span>
          <span className="stat-label">Due for Rotation</span>
        </div>
      </div>

      <section className="secrets-section">
        <div className="section-header">
          <h2>Secrets</h2>
          <button
            className="btn primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel" : "+ Add Secret"}
          </button>
        </div>

        {showForm && (
          <form className="add-form" onSubmit={handleCreate}>
            <input
              placeholder="Name (e.g. AWS_ACCESS_KEY)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              placeholder="Service (e.g. aws, stripe)"
              value={form.service}
              onChange={(e) => setForm({ ...form, service: e.target.value })}
              required
            />
            <input
              placeholder="Secret value"
              type="password"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              required
            />
            <input
              type="number"
              placeholder="Rotation interval (days)"
              value={form.rotationIntervalDays}
              onChange={(e) =>
                setForm({
                  ...form,
                  rotationIntervalDays: Number(e.target.value),
                })
              }
              min="1"
            />
            <select
              value={form.provider}
              onChange={(e) => setForm({ ...form, provider: e.target.value })}
            >
              {PROVIDER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <div className="targets-section-form">
              <div className="targets-header">
                <span className="targets-title">Delivery Targets</span>
                <button
                  type="button"
                  className="btn small"
                  onClick={addTarget}
                >
                  + Add Target
                </button>
              </div>
              {form.targets.map((target, i) => (
                <div key={i} className="target-row">
                  <select
                    value={target.type}
                    onChange={(e) => updateTarget(i, "type", e.target.value)}
                  >
                    {TARGET_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <input
                    placeholder="Label (e.g. Backend API)"
                    value={target.label}
                    onChange={(e) => updateTarget(i, "label", e.target.value)}
                  />
                  {target.type === "webhook" && (
                    <input
                      placeholder="Webhook URL"
                      value={target.config.url || ""}
                      onChange={(e) =>
                        updateTarget(i, "config", { url: e.target.value })
                      }
                      required
                    />
                  )}
                  {target.type === "aws-ssm" && (
                    <input
                      placeholder="Parameter name (e.g. /prod/db-pass)"
                      value={target.config.parameterName || ""}
                      onChange={(e) =>
                        updateTarget(i, "config", {
                          parameterName: e.target.value,
                        })
                      }
                      required
                    />
                  )}
                  {target.type === "env-file" && (
                    <>
                      <input
                        placeholder="File path (e.g. /app/.env)"
                        value={target.config.path || ""}
                        onChange={(e) =>
                          updateTarget(i, "config", { path: e.target.value })
                        }
                        required
                      />
                      <input
                        placeholder="Key (e.g. DB_PASSWORD)"
                        value={target.config.key || ""}
                        onChange={(e) =>
                          updateTarget(i, "config", { key: e.target.value })
                        }
                        required
                      />
                    </>
                  )}
                  <button
                    type="button"
                    className="btn small danger"
                    onClick={() => removeTarget(i)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button type="submit" className="btn primary">
              Create Secret
            </button>
          </form>
        )}

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Service</th>
                <th>Provider</th>
                <th>Value</th>
                <th>Targets</th>
                <th>Status</th>
                <th>Last Rotated</th>
                <th>Next Rotation</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {secrets.map((secret) => (
                <>
                  <tr key={secret._id}>
                    <td className="name">{secret.name}</td>
                    <td>
                      <span className="badge service">{secret.service}</span>
                    </td>
                    <td>
                      <span className="badge provider">
                        {secret.provider || "generic"}
                      </span>
                    </td>
                    <td className="mono" title={secret.value}>
                      {secret.value}
                    </td>
                    <td>
                      {secret.targets && secret.targets.length > 0 ? (
                        <button
                          className="btn small"
                          onClick={() =>
                            setExpandedSecret(
                              expandedSecret === secret._id
                                ? null
                                : secret._id
                            )
                          }
                        >
                          {secret.targets.length} target
                          {secret.targets.length !== 1 ? "s" : ""}
                        </button>
                      ) : (
                        <span className="text-muted">None</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${secret.status}`}>
                        {secret.status}
                      </span>
                    </td>
                    <td>{formatDate(secret.lastRotatedAt)}</td>
                    <td
                      className={isDue(secret.nextRotationAt) ? "overdue" : ""}
                    >
                      {formatDate(secret.nextRotationAt)}
                    </td>
                    <td className="actions">
                      <button
                        className="btn small"
                        onClick={() => handleRotate(secret._id)}
                      >
                        Rotate
                      </button>
                      <button
                        className="btn small danger"
                        onClick={() => handleDelete(secret._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  {expandedSecret === secret._id &&
                    secret.targets &&
                    secret.targets.length > 0 && (
                      <tr key={`${secret._id}-targets`} className="targets-row">
                        <td colSpan="9">
                          <div className="targets-detail">
                            <strong>Delivery Targets:</strong>
                            <ul>
                              {secret.targets.map((t, i) => (
                                <li key={i}>
                                  <span className="badge">{t.type}</span>{" "}
                                  <strong>{t.label || t.type}</strong>
                                  {t.type === "webhook" && (
                                    <span className="mono target-config">
                                      {" "}
                                      → {t.config.url}
                                    </span>
                                  )}
                                  {t.type === "aws-ssm" && (
                                    <span className="mono target-config">
                                      {" "}
                                      → {t.config.parameterName}
                                    </span>
                                  )}
                                  {t.type === "env-file" && (
                                    <span className="mono target-config">
                                      {" "}
                                      → {t.config.key} in {t.config.path}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </td>
                      </tr>
                    )}
                </>
              ))}
              {secrets.length === 0 && (
                <tr>
                  <td colSpan="9" className="empty">
                    No secrets yet. Click &quot;+ Add Secret&quot; to create
                    one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="two-col">
        <section className="logs-section">
          <h2>Rotation History</h2>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Secret</th>
                  <th>Status</th>
                  <th>Triggered By</th>
                  <th>Message</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td className="name">{log.secretName}</td>
                    <td>
                      <span className={`badge ${log.status}`}>
                        {log.status}
                      </span>
                    </td>
                    <td>
                      <span className="badge">{log.triggeredBy}</span>
                    </td>
                    <td className="log-message" title={log.message}>
                      {log.message}
                    </td>
                    <td>{formatDateTime(log.createdAt)}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan="5" className="empty">
                      No rotation history yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="webhook-section">
          <h2>Webhook Deliveries (Live)</h2>
          <p className="section-subtitle">
            POST requests received at the test webhook endpoint
          </p>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Secret</th>
                  <th>Service</th>
                  <th>Received At</th>
                </tr>
              </thead>
              <tbody>
                {webhookHits.map((hit, i) => (
                  <tr key={i}>
                    <td className="name">{hit.secretName}</td>
                    <td>
                      <span className="badge service">{hit.service}</span>
                    </td>
                    <td>{formatDateTime(hit.receivedAt)}</td>
                  </tr>
                ))}
                {webhookHits.length === 0 && (
                  <tr>
                    <td colSpan="3" className="empty">
                      No webhook deliveries yet. Rotate a secret with a webhook
                      target to see them here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
