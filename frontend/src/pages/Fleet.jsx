import React, { useEffect, useState } from "react";
import AppLayout from "../components/Layout/AppLayout.jsx";
import Topbar from "../components/Layout/Topbar.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { canEdit } from "../permissions.js";
import { Plus, X } from "lucide-react";

const EMPTY = { regNo: "", name: "", type: "Van", capacity: "", capacityUnit: "kg", odometer: 0, acquisitionCost: "", status: "Available" };

export default function Fleet() {
  const { user } = useAuth();
  const editable = canEdit(user?.role, "fleet");
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  const load = () => {
    api.get("/vehicles", { params: { search, type, status } }).then((res) => setVehicles(res.data));
  };
  useEffect(load, [search, type, status]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/vehicles", form);
      setShowForm(false);
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save vehicle.");
    }
  };

  return (
    <AppLayout>
      <Topbar title="Vehicle Registry" search={search} onSearch={setSearch} />
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex gap-3">
            <select className="input w-36" value={type} onChange={(e) => setType(e.target.value)}>
              {["All", "Van", "Truck", "Mini"].map((t) => <option key={t}>{t}</option>)}
            </select>
            <select className="input w-36" value={status} onChange={(e) => setStatus(e.target.value)}>
              {["All", "Available", "On Trip", "In Shop", "Retired"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          {editable && (
            <button className="btn-primary flex items-center gap-1" onClick={() => setShowForm(true)}>
              <Plus size={16} /> Add Vehicle
            </button>
          )}
        </div>

        <div className="card overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Reg. No. (Unique)</th><th>Name/Model</th><th>Type</th><th>Capacity</th>
                <th>Odometer</th><th>Acq. Cost</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v._id}>
                  <td className="font-mono text-xs">{v.regNo}</td>
                  <td className="font-medium">{v.name}</td>
                  <td>{v.type}</td>
                  <td>{v.capacity} {v.capacityUnit}</td>
                  <td>{v.odometer.toLocaleString()}</td>
                  <td>₹{v.acquisitionCost.toLocaleString()}</td>
                  <td><StatusBadge status={v.status} /></td>
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr><td colSpan={7} className="text-center text-slate-400 py-8">No vehicles found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-coral-600">
          Rule: Registration No. must be unique · Retired/In Shop vehicles are hidden from Trip Dispatcher
        </p>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-20 p-4">
          <form onSubmit={submit} className="bg-white rounded-2xl p-6 w-full max-w-lg relative">
            <button type="button" className="absolute top-4 right-4 text-slate-400" onClick={() => setShowForm(false)}><X size={18} /></button>
            <h3 className="font-bold text-lg mb-4">Add Vehicle</h3>
            {error && <div className="bg-coral-500/10 text-coral-600 text-sm rounded-lg px-3 py-2 mb-3">{error}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Registration No.</label><input className="input" required value={form.regNo} onChange={(e) => setForm({ ...form, regNo: e.target.value })} /></div>
              <div><label className="label">Name / Model</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="label">Type</label>
                <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {["Van", "Truck", "Mini"].map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <div className="flex-1"><label className="label">Capacity</label><input type="number" className="input" required value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div>
                <div className="w-24"><label className="label">Unit</label>
                  <select className="input" value={form.capacityUnit} onChange={(e) => setForm({ ...form, capacityUnit: e.target.value })}>
                    <option>kg</option><option>Ton</option>
                  </select>
                </div>
              </div>
              <div><label className="label">Odometer</label><input type="number" className="input" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} /></div>
              <div><label className="label">Acquisition Cost</label><input type="number" className="input" required value={form.acquisitionCost} onChange={(e) => setForm({ ...form, acquisitionCost: e.target.value })} /></div>
              <div><label className="label">Status</label>
                <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {["Available", "On Trip", "In Shop", "Retired"].map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn-primary">Save Vehicle</button>
            </div>
          </form>
        </div>
      )}
    </AppLayout>
  );
}
