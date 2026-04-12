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
    providerConfig: {},
    targets: [],
  });

  async function loadData() {
    try {
      const [s, l, h] = await Promise.all([
        fetchSecrets(),
        fetchLogs(),
        fetchWebhookHits(),
      ]);
      setSecrets(s);
      setLogs(l);
      setWebhookHits(h);
      setError(null);
    } catch {
      setError("Failed to connect to API. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const id = setInterval(loadData, 5000);
    return () => clearInterval(id);
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await createSecret(form);
      setForm({ name: "", service: "", value: "", rotationIntervalDays: 30, provider: "generic", providerConfig: {}, targets: [] });
      setShowForm(false);
      loadData();
    } catch { alert("Failed to create secret"); }
  }

  async function handleRotate(id) {
    try { await rotateSecret(id); loadData(); }
    catch { alert("Failed to rotate"); }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this secret?")) return;
    try { await deleteSecret(id); loadData(); }
    catch { alert("Failed to delete"); }
  }

  async function handleSeedDemo() {
    try {
      const r = await seedDemo();
      loadData();
      if (r.added.length === 0) alert("Demo secrets already exist.");
    } catch { alert("Failed to seed demo"); }
  }

  async function handleClearDemo() {
    if (!confirm("Delete ALL secrets, logs, and webhook hits?")) return;
    try { await clearDemo(); loadData(); }
    catch { alert("Failed to clear"); }
  }

  function addTarget() {
    setForm({ ...form, targets: [...form.targets, { ...emptyTarget }] });
  }

  function updateTarget(i, field, val) {
    const updated = form.targets.map((t, idx) => {
      if (idx !== i) return t;
      if (field === "type") {
        const cfg = val === "webhook" ? { url: "" }
          : val === "aws-ssm" ? { region: "us-east-1", parameterName: "" }
          : { path: "", key: "" };
        return { ...t, type: val, config: cfg };
      }
      if (field === "label") return { ...t, label: val };
      return { ...t, config: { ...t.config, ...val } };
    });
    setForm({ ...form, targets: updated });
  }

  function removeTarget(i) {
    setForm({ ...form, targets: form.targets.filter((_, idx) => idx !== i) });
  }

  function fmtDate(d) { return new Date(d).toLocaleDateString(); }
  function fmtTime(d) { return new Date(d).toLocaleString(); }
  function isDue(d) { return new Date(d) <= new Date(); }

  const dueCount = secrets.filter((s) => isDue(s.nextRotationAt)).length;

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <header>
        <div className="header-top">
          <div>
            <h1>Secrets Rotation Manager</h1>
            <p>Manage and rotate your application secrets</p>
          </div>
          <div className="demo-actions">
            <button className="btn" onClick={handleSeedDemo}>Load Demo</button>
            <button className="btn btn-danger" onClick={handleClearDemo}>Clear All</button>
          </div>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="stats">
        <div className="stat">
          <span className="stat-value">{secrets.length}</span>
          <span className="stat-label">Secrets</span>
        </div>
        <div className="stat">
          <span className={`stat-value${dueCount > 0 ? " has-due" : ""}`}>{dueCount}</span>
          <span className="stat-label">Due</span>
        </div>
        <div className="stat">
          <span className="stat-value">{logs.length}</span>
          <span className="stat-label">Rotations</span>
        </div>
      </div>

      <div className="panel">
        <div className="section-head">
          <h2>Secrets</h2>
          <button className={`btn${showForm ? " btn-danger" : ""}`} onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "Add Secret"}
          </button>
        </div>

        {showForm && (
          <form className="add-form" onSubmit={handleCreate}>
            <input placeholder="Name (e.g. AWS_ACCESS_KEY)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input placeholder="Service (e.g. aws, stripe)" value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} required />
            <input placeholder="Secret value" type="password" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required />
            <div className="form-field">
              <label className="form-label">Rotate every (days)</label>
              <input type="number" value={form.rotationIntervalDays} onChange={(e) => setForm({ ...form, rotationIntervalDays: Number(e.target.value) })} min="1" />
            </div>
            <div className="form-field">
              <label className="form-label">Provider</label>
              <select value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value, providerConfig: {} })}>
                {PROVIDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {form.provider === "custom-api" && (
              <div className="provider-config-group">
                <span className="form-label">Provider Config</span>
                <input placeholder="API URL to call for new secret" value={form.providerConfig.url || ""} onChange={(e) => setForm({ ...form, providerConfig: { ...form.providerConfig, url: e.target.value } })} required />
                <div className="provider-config-row">
                  <select value={form.providerConfig.method || "POST"} onChange={(e) => setForm({ ...form, providerConfig: { ...form.providerConfig, method: e.target.value } })}>
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                    <option value="PUT">PUT</option>
                  </select>
                  <input placeholder="Response key (default: value)" value={form.providerConfig.valuePath || ""} onChange={(e) => setForm({ ...form, providerConfig: { ...form.providerConfig, valuePath: e.target.value } })} />
                </div>
              </div>
            )}

            <div className="targets-form-group">
              <div className="targets-form-head">
                <span>Delivery Targets</span>
                <button type="button" className="btn btn-sm" onClick={addTarget}>+ Add</button>
              </div>
              {form.targets.map((target, i) => (
                <div key={i} className="target-row">
                  <select value={target.type} onChange={(e) => updateTarget(i, "type", e.target.value)}>
                    {TARGET_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <input placeholder="Label" value={target.label} onChange={(e) => updateTarget(i, "label", e.target.value)} />
                  {target.type === "webhook" && (
                    <input placeholder="URL" value={target.config.url || ""} onChange={(e) => updateTarget(i, "config", { url: e.target.value })} required />
                  )}
                  {target.type === "aws-ssm" && (
                    <input placeholder="Parameter name" value={target.config.parameterName || ""} onChange={(e) => updateTarget(i, "config", { parameterName: e.target.value })} required />
                  )}
                  {target.type === "env-file" && (
                    <>
                      <input placeholder="File path" value={target.config.path || ""} onChange={(e) => updateTarget(i, "config", { path: e.target.value })} required />
                      <input placeholder="Key" value={target.config.key || ""} onChange={(e) => updateTarget(i, "config", { key: e.target.value })} required />
                    </>
                  )}
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => removeTarget(i)}>Remove</button>
                </div>
              ))}
            </div>

            <button type="submit" className="btn btn-primary">Create</button>
          </form>
        )}

        <div className="table-wrap secrets-table">
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
                <th>Next</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {secrets.map((s) => (
                <>{/* eslint-disable-next-line react/jsx-key */}
                  <tr key={s._id}>
                    <td className="col-name">{s.name}</td>
                    <td className="col-secondary">{s.service}</td>
                    <td className="col-secondary">{s.provider || "generic"}</td>
                    <td className="col-mono" title={s.value}>{s.value}</td>
                    <td>
                      {s.targets?.length > 0 ? (
                        <button className="btn btn-sm" onClick={() => setExpandedSecret(expandedSecret === s._id ? null : s._id)}>
                          {s.targets.length}
                        </button>
                      ) : (
                        <span className="text-muted">&mdash;</span>
                      )}
                    </td>
                    <td>
                      <span className="status">
                        <span className={`status-dot ${s.status}`} />
                        {s.status}
                      </span>
                    </td>
                    <td className="col-secondary">{fmtDate(s.lastRotatedAt)}</td>
                    <td className={isDue(s.nextRotationAt) ? "overdue" : "col-secondary"}>
                      {fmtDate(s.nextRotationAt)}
                    </td>
                    <td className="col-actions">
                      <button className="btn btn-sm" onClick={() => handleRotate(s._id)}>Rotate</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s._id)}>Delete</button>
                    </td>
                  </tr>
                  {expandedSecret === s._id && s.targets?.length > 0 && (
                    <tr key={`${s._id}-t`} className="targets-expand-row">
                      <td colSpan="9">
                        <div className="targets-list">
                          <ul>
                            {s.targets.map((t, i) => (
                              <li key={i}>
                                <span className="t-type">{t.type}</span>
                                <span className="t-label">{t.label || t.type}</span>
                                {t.type === "webhook" && <span className="t-config">{t.config.url}</span>}
                                {t.type === "aws-ssm" && <span className="t-config">{t.config.parameterName}</span>}
                                {t.type === "env-file" && <span className="t-config">{t.config.key} in {t.config.path}</span>}
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
                <tr><td colSpan="9" className="empty-row">No secrets yet. Add one or load the demo.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="section-head">
            <h2>Rotation Log</h2>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Secret</th>
                  <th>Result</th>
                  <th>Trigger</th>
                  <th>Message</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l._id}>
                    <td className="col-name">{l.secretName}</td>
                    <td>
                      <span className="status">
                        <span className={`status-dot ${l.status}`} />
                        {l.status}
                      </span>
                    </td>
                    <td className="col-secondary">{l.triggeredBy}</td>
                    <td className="col-message" title={l.message}>{l.message}</td>
                    <td className="col-secondary">{fmtTime(l.createdAt)}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan="5" className="empty-row">No rotations yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="section-head">
            <h2>Webhook Hits</h2>
          </div>
          <p className="section-subtitle">POST requests received at the test endpoint</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Secret</th>
                  <th>Service</th>
                  <th>Received</th>
                </tr>
              </thead>
              <tbody>
                {webhookHits.map((h, i) => (
                  <tr key={i}>
                    <td className="col-name">{h.secretName}</td>
                    <td className="col-secondary">{h.service}</td>
                    <td className="col-secondary">{fmtTime(h.receivedAt)}</td>
                  </tr>
                ))}
                {webhookHits.length === 0 && (
                  <tr><td colSpan="3" className="empty-row">No hits yet. Rotate a secret with a webhook target.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
