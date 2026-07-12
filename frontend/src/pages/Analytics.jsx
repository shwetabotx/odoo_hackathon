import React, { useEffect, useState } from "react";
import AppLayout from "../components/Layout/AppLayout.jsx";
import Topbar from "../components/Layout/Topbar.jsx";
import api from "../api/axios.js";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Fuel, Gauge, Wallet, TrendingUp, Download } from "lucide-react";

export default function Analytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/analytics").then((res) => setData(res.data));
  }, []);

  const exportCSV = async () => {
    const res = await api.get("/analytics/export.csv", { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "transitops_export.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (!data) return <AppLayout><Topbar title="Reports & Analytics" /><div className="p-6 text-slate-400">Loading...</div></AppLayout>;

  const maxCost = Math.max(...data.topCostliest.map((v) => v.total), 1);

  return (
    <AppLayout>
      <Topbar title="Reports & Analytics" />
      <div className="p-6 space-y-6">
        <div className="flex justify-end">
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm">
            <Download size={15} /> Export CSV
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 text-sky-500 bg-sky-500/10"><Fuel size={17} /></div>
            <p className="text-2xl font-bold">{data.fuelEfficiency} km/L</p>
            <p className="text-xs text-slate-500 mt-1">Fuel Efficiency</p>
          </div>
          <div className="card">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 text-mint-500 bg-mint-500/10"><Gauge size={17} /></div>
            <p className="text-2xl font-bold">{data.fleetUtilization}%</p>
            <p className="text-xs text-slate-500 mt-1">Fleet Utilization</p>
          </div>
          <div className="card">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 text-sun-500 bg-sun-500/10"><Wallet size={17} /></div>
            <p className="text-2xl font-bold">₹{data.operationalCost.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">Operational Cost</p>
          </div>
          <div className="card">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 text-brand-500 bg-brand-500/10"><TrendingUp size={17} /></div>
            <p className="text-2xl font-bold">{data.vehicleROI}%</p>
            <p className="text-xs text-slate-500 mt-1">Vehicle ROI</p>
          </div>
        </div>
        <p className="text-xs text-slate-400">ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-bold text-slate-800 mb-4">Monthly Revenue</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#6c3df5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="font-bold text-slate-800 mb-4">Top Costliest Vehicles</h3>
            <div className="space-y-4">
              {data.topCostliest.map((v, i) => (
                <div key={v.regNo}>
                  <div className="flex justify-between text-sm mb-1"><span className="font-medium">{v.name}</span><span className="text-slate-500">₹{v.total.toLocaleString()}</span></div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${i === 0 ? "bg-coral-500" : i === 1 ? "bg-sun-500" : "bg-brand-500"}`}
                      style={{ width: `${(v.total / maxCost) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {data.topCostliest.length === 0 && <p className="text-sm text-slate-400">No cost data yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
