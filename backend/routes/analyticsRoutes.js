const express = require("express");
const router = express.Router();
const Vehicle = require("../models/Vehicle");
const Trip = require("../models/Trip");
const Maintenance = require("../models/Maintenance");
const FuelLog = require("../models/FuelLog");
const { protect, requireView } = require("../middleware/auth");

router.use(protect, requireView("analytics"));

router.get("/", async (req, res) => {
  const completedTrips = await Trip.find({ status: "Completed" }).populate("vehicle");

  const totalDistance = completedTrips.reduce((s, t) => s + (t.actualDistance || 0), 0);
  const totalFuel = completedTrips.reduce((s, t) => s + (t.fuelConsumed || 0), 0);
  const fuelEfficiency = totalFuel > 0 ? +(totalDistance / totalFuel).toFixed(1) : 0;

  const totalVehicles = await Vehicle.countDocuments({ status: { $ne: "Retired" } });
  const onTrip = await Vehicle.countDocuments({ status: "On Trip" });
  const fleetUtilization = totalVehicles > 0 ? Math.round((onTrip / totalVehicles) * 100) : 0;

  const fuelAgg = await FuelLog.aggregate([{ $group: { _id: null, total: { $sum: "$cost" } } }]);
  const maintAgg = await Maintenance.aggregate([{ $group: { _id: null, total: { $sum: "$cost" } } }]);
  const totalFuelCost = fuelAgg[0]?.total || 0;
  const totalMaintCost = maintAgg[0]?.total || 0;
  const operationalCost = totalFuelCost + totalMaintCost;

  const totalRevenue = completedTrips.reduce((s, t) => s + (t.revenue || 0), 0);
  const totalAcquisitionCost = (await Vehicle.aggregate([
    { $group: { _id: null, total: { $sum: "$acquisitionCost" } } },
  ]))[0]?.total || 1;
  const vehicleROI = +(((totalRevenue - operationalCost) / totalAcquisitionCost) * 100).toFixed(1);

  // Monthly revenue (last 7 months) from completed trips
  const now = new Date();
  const months = [...Array(7)].map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (6 - i), 1);
    return { label: d.toLocaleString("default", { month: "short" }), year: d.getFullYear(), month: d.getMonth() };
  });
  const monthlyRevenue = months.map(({ label, year, month }) => {
    const total = completedTrips
      .filter((t) => t.completedAt && t.completedAt.getFullYear() === year && t.completedAt.getMonth() === month)
      .reduce((s, t) => s + (t.revenue || 0), 0);
    return { month: label, revenue: total };
  });

  // Top costliest vehicles (fuel + maintenance)
  const vehicles = await Vehicle.find();
  const costRows = await Promise.all(
    vehicles.map(async (v) => {
      const fuel = (await FuelLog.aggregate([
        { $match: { vehicle: v._id } },
        { $group: { _id: null, total: { $sum: "$cost" } } },
      ]))[0]?.total || 0;
      const maint = (await Maintenance.aggregate([
        { $match: { vehicle: v._id } },
        { $group: { _id: null, total: { $sum: "$cost" } } },
      ]))[0]?.total || 0;
      return { name: v.name, regNo: v.regNo, total: fuel + maint };
    })
  );
  const topCostliest = costRows.sort((a, b) => b.total - a.total).slice(0, 5);

  res.json({
    fuelEfficiency, fleetUtilization, operationalCost, vehicleROI,
    monthlyRevenue, topCostliest,
  });
});

// GET /api/analytics/export.csv
router.get("/export.csv", async (req, res) => {
  const trips = await Trip.find().populate("vehicle", "name regNo").populate("driver", "name");
  const header = "TripCode,Source,Destination,Vehicle,Driver,CargoWeight,PlannedDistance,ActualDistance,FuelConsumed,FuelCost,Toll,Other,Revenue,Status\n";
  const rows = trips.map((t) =>
    [
      t.tripCode, t.source, t.destination, t.vehicle?.regNo || "", t.driver?.name || "",
      t.cargoWeight, t.plannedDistance, t.actualDistance || "", t.fuelConsumed || "",
      t.fuelCost || "", t.tollExpense || 0, t.otherExpense || 0, t.revenue || 0, t.status,
    ].join(",")
  );
  const csv = header + rows.join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=transitops_export.csv");
  res.send(csv);
});

module.exports = router;
