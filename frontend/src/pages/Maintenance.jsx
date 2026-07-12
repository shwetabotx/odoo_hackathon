import React, { useEffect, useState } from "react";
import AppLayout from "../components/Layout/AppLayout.jsx";
import Topbar from "../components/Layout/Topbar.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { canEdit } from "../permissions.js";

const EMPTY = { vehicle: "", serviceType: "", cost: "", date: new Date().toISOString().slice(0, 10), notes: "" };

export default function Maintenance() {
  const { user } = useAuth();
  const editable = canEdit(user?.role, "maintenance");
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  const load = () => {
    api.get("/maintenance").then((res) => setLogs(res.data));
    api.get("/vehicles").then((res) => setVehicles(res.data.filter((v) => v.status !== "Retired")));
  };
  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/maintenance", form);
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save record.");
    }
  };

  const closeRecord = async (id) => {
    try {
      await api.put(`/maintenance/${id}/close`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Could not close record.");
    }
  };

  return (
    <AppLayout>
      <Topbar title="Maintenance" />
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-bold text-slate-800 mb-4">Log Service Record</h3>
          {editable ? (
            <form onSubmit={submit} className="space-y-3">
              {error && <div className="bg-coral-500/10 text-coral-600 text-sm rounded-lg px-3 py-2">{error}</div>}
              <div>
                <label className="label">Vehicle</label>
                <select className="input" required value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })}>
                  <option value="">Select vehicle...</option>
                  {vehicles.map((v) => <option key={v._id} value={v._id}>{v.name} ({v.status})</option>)}
                </select>
              </div>
              <div><label className="label">Service Type</label><input className="input" required placeholder="Oil Change" value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })} /></div>
              <div><label className="label">Cost (₹)</label><input type="number" className="input" required value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></div>
              <div><label className="label">Date</label><input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <button className="btn-primary w-full">Save</button>
            </form>
          ) : (
            <p className="text-sm text-slate-400">Your role has read-only access to Maintenance.</p>
          )}
          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1">
            <p><span className="text-mint-600 font-semibold">Available</span> → creating active record → <span className="text-sun-600 font-semibold">In Shop</span></p>
            <p><span className="text-sun-600 font-semibold">In Shop</span> → closing record → <span className="text-mint-600 font-semibold">Available</span> (unless Retired)</p>
            <p className="text-coral-600">Note: In Shop vehicles are removed from the dispatch pool.</p>
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold text-slate-800 mb-4">Service Log</h3>
          <table className="data-table w-full">
            <thead><tr><th>Vehicle</th><th>Service</th><th>Cost</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l._id}>
                  <td className="font-medium">{l.vehicle?.name}</td>
                  <td>{l.serviceType}</td>
                  <td>₹{l.cost.toLocaleString()}</td>
                  <td><StatusBadge status={l.status} /></td>
                  <td>
                    {editable && l.status === "In Shop" && (
                      <button onClick={() => closeRecord(l._id)} className="text-xs text-brand-600 font-semibold">Close</button>
                    )}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={5} className="text-center text-slate-400 py-8">No service records yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
