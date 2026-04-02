import { useState, useEffect } from "react";
import { fetchSecrets, createSecret, deleteSecret, rotateSecret, fetchLogs } from "./api";
import "./App.css";

function App() {
  const [secrets, setSecrets] = useState([]);
  const [logs, setLogs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    name: "",
    service: "",
    value: "",
    rotationIntervalDays: 30,
  });

  async function loadData() {
    try {
      const [secretsData, logsData] = await Promise.all([
        fetchSecrets(),
        fetchLogs(),
      ]);
      setSecrets(secretsData);
      setLogs(logsData);
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
      setForm({ name: "", service: "", value: "", rotationIntervalDays: 30 });
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
        <h1>Secrets Rotation Manager</h1>
        <p>Manage and rotate your application secrets</p>
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
                <th>Value</th>
                <th>Status</th>
                <th>Last Rotated</th>
                <th>Next Rotation</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {secrets.map((secret) => (
                <tr key={secret._id}>
                  <td className="name">{secret.name}</td>
                  <td>
                    <span className="badge service">{secret.service}</span>
                  </td>
                  <td className="mono">{secret.value}</td>
                  <td>
                    <span className={`badge ${secret.status}`}>
                      {secret.status}
                    </span>
                  </td>
                  <td>{formatDate(secret.lastRotatedAt)}</td>
                  <td className={isDue(secret.nextRotationAt) ? "overdue" : ""}>
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
              ))}
              {secrets.length === 0 && (
                <tr>
                  <td colSpan="7" className="empty">
                    No secrets yet. Click &quot;+ Add Secret&quot; to create
                    one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

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
                    <span className={`badge ${log.status}`}>{log.status}</span>
                  </td>
                  <td>
                    <span className="badge">{log.triggeredBy}</span>
                  </td>
                  <td>{log.message}</td>
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
    </div>
  );
}

export default App;
