const express = require("express");
const router = express.Router();
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");
const Trip = require("../models/Trip");
const { protect } = require("../middleware/auth");

router.use(protect); // dashboard visible to every authenticated role

router.get("/", async (req, res) => {
  const { type, status, search } = req.query;
  const vehicleFilter = {};
  if (type && type !== "All") vehicleFilter.type = type;
  if (status && status !== "All") vehicleFilter.status = status;

  const [activeVehicles, availableVehicles, inShopVehicles, retiredVehicles] = await Promise.all([
    Vehicle.countDocuments({ ...vehicleFilter, status: { $ne: "Retired" } }),
    Vehicle.countDocuments({ ...vehicleFilter, status: "Available" }),
    Vehicle.countDocuments({ ...vehicleFilter, status: "In Shop" }),
    Vehicle.countDocuments({ ...vehicleFilter, status: "Retired" }),
  ]);
  const onTripVehicles = await Vehicle.countDocuments({ ...vehicleFilter, status: "On Trip" });

  const [activeTrips, pendingTrips] = await Promise.all([
    Trip.countDocuments({ status: "Dispatched" }),
    Trip.countDocuments({ status: "Draft" }),
  ]);
  const driversOnDuty = await Driver.countDocuments({ status: { $in: ["Available", "On Trip"] } });

  const totalNonRetired = activeVehicles || 1;
  const fleetUtilization = Math.round((onTripVehicles / totalNonRetired) * 100);

  const recentTrips = await Trip.find()
    .populate("vehicle", "name")
    .populate("driver", "name")
    .sort({ createdAt: -1 })
    .limit(6);

  res.json({
    kpis: {
      activeVehicles, availableVehicles, vehiclesInMaintenance: inShopVehicles,
      activeTrips, pendingTrips, driversOnDuty, fleetUtilization,
    },
    vehicleStatusBreakdown: {
      Available: availableVehicles, "On Trip": onTripVehicles, "In Shop": inShopVehicles, Retired: retiredVehicles,
    },
    recentTrips,
  });
});

module.exports = router;
