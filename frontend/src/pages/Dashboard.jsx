import React, { useEffect, useState } from "react";
import AppLayout from "../components/Layout/AppLayout.jsx";
import Topbar from "../components/Layout/Topbar.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import api from "../api/axios.js";
import { Truck, CheckCircle2, Wrench, Route, Clock, Users, Gauge } from "lucide-react";

const KPI_CARDS = [
  { key: "activeVehicles", label: "Active Vehicles", icon: Truck, color: "text-sky-500 bg-sky-500/10" },
  { key: "availableVehicles", label: "Available Vehicles", icon: CheckCircle2, color: "text-mint-500 bg-mint-500/10" },
  { key: "vehiclesInMaintenance", label: "Vehicles In Maintenance", icon: Wrench, color: "text-sun-500 bg-sun-500/10" },
  { key: "activeTrips", label: "Active Trips", icon: Route, color: "text-brand-500 bg-brand-500/10" },
  { key: "pendingTrips", label: "Pending Trips", icon: Clock, color: "text-coral-500 bg-coral-500/10" },
  { key: "driversOnDuty", label: "Drivers On Duty", icon: Users, color: "text-brand-500 bg-brand-500/10" },
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [vehicleType, setVehicleType] = useState("All");
  const [status, setStatus] = useState("All");
  const [region, setRegion] = useState("All");

  const load = () => {
    api.get("/dashboard", { params: { type: vehicleType, status } }).then((res) => setData(res.data));
  };

  useEffect(load, [vehicleType, status]);

  if (!data) return <AppLayout><Topbar title="Dashboard" /><div className="p-6 text-slate-400">Loading...</div></AppLayout>;

  const breakdown = data.vehicleStatusBreakdown;
  const maxVal = Math.max(...Object.values(breakdown), 1);

  return (
    <AppLayout>
      <Topbar title="Dashboard" />
      <div className="p-6 space-y-6">
        <div className="flex flex-wrap gap-3">
          <select className="input w-44" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
            {["All", "Van", "Truck", "Mini"].map((t) => <option key={t}>{t}</option>)}
          </select>
          <select className="input w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
            {["All", "Available", "On Trip", "In Shop", "Retired"].map((t) => <option key={t}>{t}</option>)}
          </select>
          <select className="input w-44" value={region} onChange={(e) => setRegion(e.target.value)}>
            {["All", "Gandhinagar", "Ahmedabad", "Vatva", "Sanand"].map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {KPI_CARDS.map((c) => (
            <div key={c.key} className="card">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${c.color}`}>
                <c.icon size={17} />
              </div>
              <p className="text-2xl font-bold text-slate-800">
                {c.key === "fleetUtilization" ? `${data.kpis[c.key]}%` : data.kpis[c.key]}
              </p>
              <p className="text-xs text-slate-500 mt-1">{c.label}</p>
            </div>
          ))}
          <div className="card">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 text-mint-500 bg-mint-500/10">
              <Gauge size={17} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{data.kpis.fleetUtilization}%</p>
            <p className="text-xs text-slate-500 mt-1">Fleet Utilization</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card">
            <h3 className="font-bold text-slate-800 mb-4">Recent Trips</h3>
            <table className="data-table w-full">
              <thead><tr><th>Trip</th><th>Vehicle</th><th>Driver</th><th>Status</th><th>ETA</th></tr></thead>
              <tbody>
                {data.recentTrips.map((t) => (
                  <tr key={t._id}>
                    <td className="font-medium">{t.tripCode}</td>
                    <td>{t.vehicle?.name || "—"}</td>
                    <td>{t.driver?.name || "—"}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td className="text-slate-500">{t.status === "Dispatched" ? "In transit" : t.status === "Draft" ? "Awaiting vehicle" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3 className="font-bold text-slate-800 mb-4">Vehicle Status</h3>
            <div className="space-y-3">
              {Object.entries(breakdown).map(([k, v]) => (
                <div key={k}>
                  <div className="flex justify-between text-xs text-slate-500 mb-1"><span>{k}</span><span>{v}</span></div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        k === "Available" ? "bg-mint-500" : k === "On Trip" ? "bg-brand-500" : k === "In Shop" ? "bg-sun-500" : "bg-coral-500"
                      }`}
                      style={{ width: `${(v / maxVal) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
