import React, { useEffect, useState } from "react";
import AppLayout from "../components/Layout/AppLayout.jsx";
import Topbar from "../components/Layout/Topbar.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { canEdit } from "../permissions.js";
import { Plus, X } from "lucide-react";

const EMPTY = { name: "", licenseNo: "", licenseCategory: "LMV", licenseExpiry: "", contact: "", safetyScore: 100, status: "Available" };
const STATUSES = ["Available", "On Trip", "Off Duty", "Suspended"];

export default function Drivers() {
  const { user } = useAuth();
  const editable = canEdit(user?.role, "drivers");
  const [drivers, setDrivers] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  const load = () =>
    api
      .get("/drivers", { params: { search } })
      .then((res) => setDrivers(res.data))
      .catch((err) => setError(err.response?.data?.message || "Could not load drivers."));

  useEffect(() => {
    load();
  }, [search]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/drivers", form);
      setShowForm(false);
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save driver.");
    }
  };

  const toggleStatus = async (driver, status) => {
    try {
      await api.patch(`/drivers/${driver._id}/status`, { status });
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Could not update status.");
    }
  };

  const fmtExpiry = (d) => {
    const date = new Date(d);
    const expired = date < new Date();
    const label = date.toLocaleDateString("en-GB", { month: "2-digit", year: "numeric" }).replace("/", "/");
    return <span className={expired ? "text-coral-600 font-semibold" : ""}>{label}{expired ? " EXPIRED" : ""}</span>;
  };

  return (
    <AppLayout>
      <Topbar title="Drivers & Safety Profiles" search={search} onSearch={setSearch} />
      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          {editable && (
            <button className="btn-primary flex items-center gap-1" onClick={() => setShowForm(true)}>
              <Plus size={16} /> Add Driver
            </button>
          )}
        </div>

        <div className="card overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr><th>Driver</th><th>License No.</th><th>Category</th><th>Expiry</th><th>Contact</th><th>Trip Compl.</th><th>Safety</th><th>Status</th></tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d._id}>
                  <td className="font-medium">{d.name}</td>
                  <td className="font-mono text-xs">{d.licenseNo}</td>
                  <td>{d.licenseCategory}</td>
                  <td>{fmtExpiry(d.licenseExpiry)}</td>
                  <td className="text-slate-500">{d.contact}</td>
                  <td>{d.tripsAssigned ? Math.round((d.tripsCompleted / d.tripsAssigned) * 100) : d.tripsCompleted ? 100 : 0}%</td>
                  <td><span className={`badge ${d.status === "Suspended" ? "bg-coral-500" : "bg-mint-500"}`}>{d.status === "Suspended" ? "Suspended" : "Available"}</span></td>
                  <td><StatusBadge status={d.status} /></td>
                </tr>
              ))}
              {drivers.length === 0 && <tr><td colSpan={8} className="text-center text-slate-400 py-8">No drivers found.</td></tr>}
            </tbody>
          </table>
        </div>

        {editable && (
          <div className="card">
            <p className="text-xs font-semibold uppercase text-slate-400 mb-2">Toggle status (select a driver row action)</p>
            <div className="flex gap-2 flex-wrap">
              {STATUSES.map((s) => <span key={s} className="badge bg-slate-300 text-slate-700">{s}</span>)}
            </div>
            <p className="text-xs text-slate-400 mt-2">Click a driver's status badge is illustrative — use the row actions below to change status.</p>
            <div className="mt-3 space-y-2">
              {drivers.map((d) => (
                <div key={d._id} className="flex items-center justify-between text-sm border-t pt-2">
                  <span className="font-medium">{d.name}</span>
                  <div className="flex gap-1">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => toggleStatus(d, s)}
                        disabled={d.status === "On Trip"}
                        className={`text-xs px-2 py-1 rounded-full border ${d.status === s ? "bg-brand-600 text-white border-brand-600" : "border-slate-300 text-slate-500 hover:bg-slate-100"} disabled:opacity-40`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-coral-600">Rule: Expired license or Suspended status → blocked from trip assignment</p>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-20 p-4">
          <form onSubmit={submit} className="bg-white rounded-2xl p-6 w-full max-w-lg relative">
            <button type="button" className="absolute top-4 right-4 text-slate-400" onClick={() => setShowForm(false)}><X size={18} /></button>
            <h3 className="font-bold text-lg mb-4">Add Driver</h3>
            {error && <div className="bg-coral-500/10 text-coral-600 text-sm rounded-lg px-3 py-2 mb-3">{error}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Name</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="label">License No.</label><input className="input" required value={form.licenseNo} onChange={(e) => setForm({ ...form, licenseNo: e.target.value })} /></div>
              <div><label className="label">Category</label>
                <select className="input" value={form.licenseCategory} onChange={(e) => setForm({ ...form, licenseCategory: e.target.value })}>
                  <option>LMV</option><option>HMV</option>
                </select>
              </div>
              <div><label className="label">Expiry Date</label><input type="date" className="input" required value={form.licenseExpiry} onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })} /></div>
              <div><label className="label">Contact</label><input className="input" required value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></div>
              <div><label className="label">Safety Score</label><input type="number" min="0" max="100" className="input" value={form.safetyScore} onChange={(e) => setForm({ ...form, safetyScore: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn-primary">Save Driver</button>
            </div>
          </form>
        </div>
      )}
    </AppLayout>
  );
}