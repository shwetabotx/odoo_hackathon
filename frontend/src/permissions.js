export const ROLES = ["FleetManager", "Dispatcher", "SafetyOfficer", "FinancialAnalyst"];

export const ROLE_LABELS = {
  FleetManager: "Fleet Manager",
  Dispatcher: "Dispatcher",
  SafetyOfficer: "Safety Officer",
  FinancialAnalyst: "Financial Analyst",
};

export const MATRIX = {
  FleetManager:     { fleet: "edit", drivers: "edit", trips: "none", fuelExp: "none", analytics: "view" },
  Dispatcher:       { fleet: "view", drivers: "none", trips: "edit", fuelExp: "none", analytics: "none" },
  SafetyOfficer:    { fleet: "none", drivers: "edit", trips: "view", fuelExp: "none", analytics: "none" },
  FinancialAnalyst: { fleet: "view", drivers: "none", trips: "none", fuelExp: "edit", analytics: "edit" },
};

export function permissionFor(role, module) {
  if (module === "maintenance") return MATRIX[role]?.fleet || "none";
  if (module === "dashboard") return "view";
  return MATRIX[role]?.[module] || "none";
}

export const canView = (role, module) => ["view", "edit"].includes(permissionFor(role, module));
export const canEdit = (role, module) => permissionFor(role, module) === "edit";
