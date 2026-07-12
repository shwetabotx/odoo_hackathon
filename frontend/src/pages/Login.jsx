import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Waypoints, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { ROLES, ROLE_LABELS } from "../permissions.js";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Dispatcher");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password, role);
      navigate(location.state?.from || "/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-[420px] bg-ink-950 text-slate-300 flex-col justify-between p-10">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
              <Waypoints size={22} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-xl leading-none">TransitOps</p>
              <p className="text-xs text-slate-500 mt-1">Smart Transport Operations Platform</p>
            </div>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed mb-8">
            One login, four roles — each scoped to exactly what they need.
          </p>
          <ul className="space-y-3 text-sm">
            {ROLES.map((r) => (
              <li key={r} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                {ROLE_LABELS[r]}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-[11px] text-slate-600">TransitOps By Shweta Jadeja © 2026 · RBAC Enabled</p>
      </div>

      <div className="flex-1 flex items-center justify-center bg-slate-50 p-6">
        <form onSubmit={submit} className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Sign in to your account</h1>
          <p className="text-sm text-slate-500 mb-6">Enter your credentials to continue</p>

          {error && (
            <div className="mb-4 flex items-start gap-2 bg-coral-500/10 border border-coral-500/30 text-coral-600 text-sm rounded-lg px-3 py-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mb-4">
            <label className="label">Email</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@transitops.in" />
          </div>
          <div className="mb-4">
            <label className="label">Password</label>
            <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="mb-4">
            <label className="label">Role (RBAC)</label>
            <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between mb-6">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-brand-600" />
              Remember me
            </label>
          </div>
          <button className="btn-primary w-full" disabled={busy}>{busy ? "Signing in..." : "Sign In"}</button>

          <p className="text-xs text-slate-400 mt-6 leading-relaxed">
           
          <a className="text-brand-600 font-medium" href="/register">register a new user</a>.
          </p>
        </form>
      </div>
    </div>
  );
}
