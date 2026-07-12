import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { canView } from "../../permissions.js";

export default function ProtectedRoute({ children, module }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (module && module !== "settings" && module !== "dashboard" && !canView(user.role, module)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card max-w-sm text-center">
          <p className="font-bold text-slate-800 mb-1">Access restricted</p>
          <p className="text-sm text-slate-500">Your role ({user.role}) does not have access to this module.</p>
        </div>
      </div>
    );
  }
  return children;
}
