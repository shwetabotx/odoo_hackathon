import React, { useEffect, useState } from "react";
import AppLayout from "../components/Layout/AppLayout.jsx";
import Topbar from "../components/Layout/Topbar.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { canEdit } from "../permissions.js";
import { CheckCircle2, XCircle } from "lucide-react";

const STAGES = ["Draft", "Dispatched", "Completed", "Cancelled"];
const EMPTY = { source: "", destination: "", vehicle: "", driver: "", cargoWeight: "", plannedDistance: "" };

export default function Trips() {
  const { user } = useAuth();
  const editable = canEdit(user?.role, "trips");
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [completing, setCompleting] = useState(null);
  const [completeForm, setCompleteForm] = useState({ actualDistance: "", fuelConsumed: "", fuelCost: "", tollExpense: "", otherExpense: "", revenue: "" });

  const load = () => {
    api.get("/trips").then((res) => setTrips(res.data));
    api.get("/vehicles/available").then((res) => setVehicles(res.data));
    api.get("/drivers/available").then((res) => setDrivers(res.data));
  };
  useEffect(load, []);

  const selectedVehicle = vehicles.find((v) => v._id === form.vehicle);
  const capacityKg = selectedVehicle ? (selectedVehicle.capacityUnit === "Ton" ? selectedVehicle.capacity * 1000 : selectedVehicle.capacity) : null;
  const exceedsCapacity = capacityKg && Number(form.cargoWeight) > capacityKg;

  const createTrip = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/trips", form);
      // immediately try dispatch if vehicle+driver chosen
      if (form.vehicle && form.driver) {
        await api.post(`/trips/${res.data._id}/dispatch`, { vehicle: form.vehicle, driver: form.driver });
      }
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create/dispatch trip.");
    }
  };

  const cancelTrip = async (id) => {
    try {
      await api.post(`/trips/${id}/cancel`, { note: "Cancelled by dispatcher" });
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Could not cancel trip.");
    }
  };

  const openComplete = (trip) => {
    setCompleting(trip);
    setCompleteForm({ actualDistance: trip.plannedDistance, fuelConsumed: "", fuelCost: "", tollExpense: "", otherExpense: "", revenue: "" });
  };

  const submitComplete = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/trips/${completing._id}/complete`, completeForm);
      setCompleting(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Could not complete trip.");
    }
  };

  const filtered = trips.filter((t) => t.tripCode.toLowerCase().includes(search.toLowerCase()) || t.source.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppLayout>
      <Topbar title="Trip Dispatcher" search={search} onSearch={setSearch} />
      <div className="p-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-6">
              {STAGES.map((s, i) => (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-3 h-3 rounded-full ${i === 0 ? "bg-mint-500" : i === 1 ? "bg-brand-500" : "bg-slate-300"}`} />
                    <span className="text-[10px] text-slate-500">{s}</span>
                  </div>
                  {i < STAGES.length - 1 && <div className="flex-1 h-px bg-slate-200" />}
                </React.Fragment>
              ))}
            </div>

            {editable ? (
              <form onSubmit={createTrip} className="space-y-3">
                <h3 className="font-bold text-slate-800">Create Trip</h3>
                {error && <div className="bg-coral-500/10 text-coral-600 text-sm rounded-lg px-3 py-2">{error}</div>}
                <div><label className="label">Source</label><input className="input" required value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} /></div>
                <div><label className="label">Destination</label><input className="input" required value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></div>
                <div>
                  <label className="label">Vehicle (Available only)</label>
                  <select className="input" value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })}>
                    <option value="">Select vehicle...</option>
                    {vehicles.map((v) => <option key={v._id} value={v._id}>{v.name} - {v.capacity} {v.capacityUnit} capacity</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Driver (Available only)</label>
                  <select className="input" value={form.driver} onChange={(e) => setForm({ ...form, driver: e.target.value })}>
                    <option value="">Select driver...</option>
                    {drivers.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>
                <div><label className="label">Cargo Weight (kg)</label><input type="number" className="input" required value={form.cargoWeight} onChange={(e) => setForm({ ...form, cargoWeight: e.target.value })} /></div>
                <div><label className="label">Planned Distance (km)</label><input type="number" className="input" required value={form.plannedDistance} onChange={(e) => setForm({ ...form, plannedDistance: e.target.value })} /></div>

                {exceedsCapacity && (
                  <div className="bg-coral-500/10 border border-coral-500/30 rounded-lg px-3 py-2 text-sm text-coral-600">
                    Vehicle Capacity: {capacityKg} kg<br />
                    Cargo Weight: {form.cargoWeight} kg<br />
                    <strong>✕ Capacity exceeded by {form.cargoWeight - capacityKg} kg — dispatch blocked</strong>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button className="btn-primary flex-1" disabled={exceedsCapacity}>
                    {form.vehicle && form.driver ? "Create & Dispatch" : "Save as Draft"}
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setForm(EMPTY)}>Cancel</button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-slate-400">Your role has read-only access to Trips.</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-3">
          <h3 className="font-bold text-slate-800">Live Board</h3>
          {filtered.map((t) => (
            <div key={t._id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-sm">{t.tripCode}</p>
                  <p className="text-xs text-slate-500">{t.source} → {t.destination}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">{t.vehicle?.name || "Unassigned"} {t.driver ? `/ ${t.driver.name}` : ""}</p>
                </div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <StatusBadge status={t.status} />
                {editable && t.status === "Dispatched" && (
                  <div className="flex gap-2">
                    <button onClick={() => openComplete(t)} className="text-xs text-mint-600 font-semibold flex items-center gap-1"><CheckCircle2 size={14} /> Complete</button>
                    <button onClick={() => cancelTrip(t._id)} className="text-xs text-coral-600 font-semibold flex items-center gap-1"><XCircle size={14} /> Cancel</button>
                  </div>
                )}
                {editable && t.status === "Draft" && (
                  <button onClick={() => cancelTrip(t._id)} className="text-xs text-coral-600 font-semibold">Cancel</button>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-sm text-slate-400">No trips yet.</p>}
        </div>
      </div>

      {completing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-20 p-4">
          <form onSubmit={submitComplete} className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-bold text-lg mb-1">Complete {completing.tripCode}</h3>
            <p className="text-xs text-slate-500 mb-4">Enter final odometer reading and fuel consumed</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Actual Distance (km)</label><input type="number" className="input" value={completeForm.actualDistance} onChange={(e) => setCompleteForm({ ...completeForm, actualDistance: e.target.value })} /></div>
              <div><label className="label">Fuel Consumed (L)</label><input type="number" className="input" value={completeForm.fuelConsumed} onChange={(e) => setCompleteForm({ ...completeForm, fuelConsumed: e.target.value })} /></div>
              <div><label className="label">Fuel Cost (₹)</label><input type="number" className="input" value={completeForm.fuelCost} onChange={(e) => setCompleteForm({ ...completeForm, fuelCost: e.target.value })} /></div>
              <div><label className="label">Toll (₹)</label><input type="number" className="input" value={completeForm.tollExpense} onChange={(e) => setCompleteForm({ ...completeForm, tollExpense: e.target.value })} /></div>
              <div><label className="label">Other Expense (₹)</label><input type="number" className="input" value={completeForm.otherExpense} onChange={(e) => setCompleteForm({ ...completeForm, otherExpense: e.target.value })} /></div>
              <div><label className="label">Revenue (₹)</label><input type="number" className="input" value={completeForm.revenue} onChange={(e) => setCompleteForm({ ...completeForm, revenue: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" className="btn-secondary" onClick={() => setCompleting(null)}>Cancel</button>
              <button className="btn-primary">Mark Completed</button>
            </div>
          </form>
        </div>
      )}
    </AppLayout>
  );
}
