import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Truck, Users, Route, Wrench, Fuel, BarChart3, Settings, Waypoints,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { canView } from "../../permissions.js";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, module: "dashboard" },
  { to: "/fleet", label: "Fleet", icon: Truck, module: "fleet" },
  { to: "/drivers", label: "Drivers", icon: Users, module: "drivers" },
  { to: "/trips", label: "Trips", icon: Route, module: "trips" },
  { to: "/maintenance", label: "Maintenance", icon: Wrench, module: "maintenance" },
  { to: "/fuel-expenses", label: "Fuel & Expenses", icon: Fuel, module: "fuelExp" },
  { to: "/analytics", label: "Analytics", icon: BarChart3, module: "analytics" },
  { to: "/settings", label: "Settings", icon: Settings, module: "settings" },
];

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="w-64 bg-ink-950 text-slate-300 flex flex-col shrink-0 min-h-screen">
      <div className="px-6 py-6 flex items-center gap-2 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
          <Waypoints size={18} className="text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-lg leading-none">TransitOps</p>
          <p className="text-[10px] text-slate-500 tracking-wide uppercase mt-0.5">Ops Platform</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.filter((item) => item.module === "settings" || canView(user?.role, item.module)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive
                  ? "bg-brand-600/20 text-white border border-brand-500/40"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`
            }
          >
            <item.icon size={17} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-white/5 text-[11px] text-slate-600">
        TransitOps © 2026 · RBAC Enabled
      </div>
    </aside>
  );
}
