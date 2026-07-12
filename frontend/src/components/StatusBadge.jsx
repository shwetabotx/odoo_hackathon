import React from "react";

// Distinct palette from the mockup: emerald / violet / amber / rose
const COLORS = {
  Available: "bg-mint-500",
  "On Trip": "bg-brand-500",
  Dispatched: "bg-brand-500",
  "In Shop": "bg-sun-500",
  Draft: "bg-slate-400",
  "Off Duty": "bg-slate-400",
  Retired: "bg-coral-500",
  Suspended: "bg-coral-500",
  Cancelled: "bg-coral-500",
  Completed: "bg-mint-500",
};

export default function StatusBadge({ status }) {
  return <span className={`badge ${COLORS[status] || "bg-slate-400"}`}>{status}</span>;
}
