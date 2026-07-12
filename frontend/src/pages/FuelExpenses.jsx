import React, { useEffect, useState } from "react";
import AppLayout from "../components/Layout/AppLayout.jsx";
import Topbar from "../components/Layout/Topbar.jsx";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { canEdit } from "../permissions.js";
import { Plus, X } from "lucide-react";

export default function FuelExpenses() {
  const { user } = useAuth();
  const editable = canEdit(user?.role, "fuelExp");
  const [logs, setLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [total, setTotal] = useState({ fuel: 0, maintenance: 0, total: 0 });
  const [showFuel, setShowFuel] = useState(false);
  const [fuelForm, setFuelForm] = useState({ vehicle: "", date: new Date().toISOString().slice(0, 10), liters: "", cost: "" });

  const load = () => {
    api.get("/fuel/logs").then((res) => setLogs(res.data));
    api.get("/fuel/expenses").then((res) => setExpenses(res.data));
    api.get("/fuel/total-operational-cost").then((res) => setTotal(res.data));
    api.get("/vehicles").then((res) => setVehicles(res.data));
  };
  useEffect(load, []);

  const submitFuel = async (e) => {
    e.preventDefault();
    try {
      await api.post("/fuel/logs", fuelForm);
      setShowFuel(false);
      setFuelForm({ vehicle: "", date: new Date().toISOString().slice(0, 10), liters: "", cost: "" });
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Could not save fuel log.");
    }
  };

  return (
    <AppLayout>
      <Topbar title="Fuel & Expense Management" />
      <div className="p-6 space-y-6">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800">Fuel Logs</h3>
            {editable && (
              <button className="btn-primary flex items-center gap-1 text-sm" onClick={() => setShowFuel(true)}>
                <Plus size={15} /> Log Fuel
              </button>
            )}
          </div>
          <table className="data-table w-full">
            <thead><tr><th>Vehicle</th><th>Date</th><th>Liters</th><th>Fuel Cost</th></tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l._id}>
                  <td className="font-medium">{l.vehicle?.name}</td>
                  <td className="text-slate-500">{new Date(l.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                  <td>{l.liters} L</td>
                  <td>₹{l.cost.toLocaleString()}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={4} className="text-center text-slate-400 py-6">No fuel logs yet.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 className="font-bold text-slate-800 mb-4">Other Expenses (Toll / Misc, linked to trips)</h3>
          <table className="data-table w-full">
            <thead><tr><th>Trip</th><th>Vehicle</th><th>Toll</th><th>Other</th><th>Maint. (Linked)</th><th>Total</th></tr></thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.tripCode}>
                  <td className="font-medium">{e.tripCode}</td>
                  <td>{e.vehicle?.name}</td>
                  <td>₹{e.toll}</td>
                  <td>₹{e.other}</td>
                  <td>₹{e.maintenanceLinked.toLocaleString()}</td>
                  <td className="font-semibold">₹{e.total.toLocaleString()}</td>
                </tr>
              ))}
              {expenses.length === 0 && <tr><td colSpan={6} className="text-center text-slate-400 py-6">No trip expenses yet.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="card flex items-center justify-between">
          <span className="font-semibold text-slate-700">Total Operational Cost (Auto) = Fuel + Maint.</span>
          <span className="text-xl font-bold text-sun-500">₹{total.total.toLocaleString()}</span>
        </div>
      </div>

      {showFuel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-20 p-4">
          <form onSubmit={submitFuel} className="bg-white rounded-2xl p-6 w-full max-w-sm relative">
            <button type="button" className="absolute top-4 right-4 text-slate-400" onClick={() => setShowFuel(false)}><X size={18} /></button>
            <h3 className="font-bold text-lg mb-4">Log Fuel</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Vehicle</label>
                <select className="input" required value={fuelForm.vehicle} onChange={(e) => setFuelForm({ ...fuelForm, vehicle: e.target.value })}>
                  <option value="">Select vehicle...</option>
                  {vehicles.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
                </select>
              </div>
              <div><label className="label">Date</label><input type="date" className="input" value={fuelForm.date} onChange={(e) => setFuelForm({ ...fuelForm, date: e.target.value })} /></div>
              <div><label className="label">Liters</label><input type="number" className="input" required value={fuelForm.liters} onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })} /></div>
              <div><label className="label">Fuel Cost (₹)</label><input type="number" className="input" required value={fuelForm.cost} onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" className="btn-secondary" onClick={() => setShowFuel(false)}>Cancel</button>
              <button className="btn-primary">Save</button>
            </div>
          </form>
        </div>
      )}
    </AppLayout>
  );
}
