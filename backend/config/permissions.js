// Role-Based Access Control matrix
// none  -> no access at all
// view  -> can GET / read only
// edit  -> full read + write access
const ROLES = ["FleetManager", "Dispatcher", "SafetyOfficer", "FinancialAnalyst"];

const MATRIX = {
  FleetManager:     { fleet: "edit", drivers: "edit", trips: "none", fuelExp: "none", analytics: "view" },
  Dispatcher:       { fleet: "view", drivers: "none", trips: "edit", fuelExp: "none", analytics: "none" },
  SafetyOfficer:    { fleet: "none", drivers: "edit", trips: "view", fuelExp: "none", analytics: "none" },
  FinancialAnalyst: { fleet: "view", drivers: "none", trips: "none", fuelExp: "edit", analytics: "edit" },
};

// Dashboard and Maintenance are treated as read-access-for-all-authenticated,
// write access follows the "fleet" bucket (Maintenance) since maintenance is
// part of fleet lifecycle management.
function permissionFor(role, module) {
  if (module === "maintenance") return MATRIX[role]?.fleet || "none";
  return MATRIX[role]?.[module] || "none";
}

function canView(role, module) {
  const p = permissionFor(role, module);
  return p === "view" || p === "edit";
}

function canEdit(role, module) {
  return permissionFor(role, module) === "edit";
}

module.exports = { ROLES, MATRIX, permissionFor, canView, canEdit };
