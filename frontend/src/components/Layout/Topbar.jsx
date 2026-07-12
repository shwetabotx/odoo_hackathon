import React from "react";
import { Search, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { ROLE_LABELS } from "../../permissions.js";

export default function Topbar({ search, onSearch, title }) {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        {title && <h1 className="text-lg font-bold text-slate-800 shrink-0">{title}</h1>}
        {onSearch && (
          <div className="relative max-w-xs w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search..."
              className="input pl-8 py-1.5"
            />
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-600 font-medium">{user?.name}</span>
        <span className="badge bg-sky-500">{ROLE_LABELS[user?.role] || user?.role}</span>
        <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">
          {user?.initials}
        </div>
        <button onClick={logout} title="Log out" className="btn-ghost">
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}
