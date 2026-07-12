import React, { useEffect, useState } from "react";
import AppLayout from "../components/Layout/AppLayout.jsx";
import Topbar from "../components/Layout/Topbar.jsx";
import api from "../api/axios.js";
import { ROLE_LABELS } from "../permissions.js";

const MODULES = ["fleet", "drivers", "trips", "fuelExp", "analytics"];
const MODULE_LABELS = { fleet: "Fleet", drivers: "Drivers", trips: "Trips", fuelExp: "Fuel/Exp.", analytics: "Analytics" };
const SYMBOL = { edit: "✓", view: "view", none: "–" };

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [rbac, setRbac] = useState(null);
  const [roles, setRoles] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get("/settings").then((res) => {
      setSettings(res.data.settings);
      setRbac(res.data.rbac);
      setRoles(res.data.roles);
    });
  }, []);

  const save = async (e) => {
    e.preventDefault();
    await api.put("/settings", settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!settings) return <AppLayout><Topbar title="Settings & RBAC" /><div className="p-6 text-slate-400">Loading...</div></AppLayout>;

  return (
    <AppLayout>
      <Topbar title="Settings & RBAC" />
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={save} className="card space-y-3">
          <h3 className="font-bold text-slate-800 mb-2">General</h3>
          <div><label className="label">Depot Name</label><input className="input" value={settings.depotName} onChange={(e) => setSettings({ ...settings, depotName: e.target.value })} /></div>
          <div><label className="label">Currency</label><input className="input" value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} /></div>
          <div><label className="label">Distance Unit</label><input className="input" value={settings.distanceUnit} onChange={(e) => setSettings({ ...settings, distanceUnit: e.target.value })} /></div>
          <button className="btn-primary mt-2">{saved ? "Saved!" : "Save changes"}</button>
        </form>

        <div className="card">
          <h3 className="font-bold text-slate-800 mb-4">Role-Based Access (RBAC)</h3>
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Role</th>
                {MODULES.map((m) => <th key={m}>{MODULE_LABELS[m]}</th>)}
              </tr>
            </thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r}>
                  <td className="font-medium">{ROLE_LABELS[r]}</td>
                  {MODULES.map((m) => (
                    <td key={m} className={rbac[r][m] === "edit" ? "text-mint-600 font-bold" : rbac[r][m] === "view" ? "text-sky-500" : "text-slate-300"}>
                      {SYMBOL[rbac[r][m]]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
