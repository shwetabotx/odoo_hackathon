const express = require("express");
const router = express.Router();
const FuelLog = require("../models/FuelLog");
const Trip = require("../models/Trip");
const Maintenance = require("../models/Maintenance");
const Vehicle = require("../models/Vehicle");
const { protect, requireView, requireEdit } = require("../middleware/auth");

router.use(protect, requireView("fuelExp"));

// GET /api/fuel/logs
router.get("/logs", async (req, res) => {
  const logs = await FuelLog.find().populate("vehicle", "name regNo").sort({ date: -1 });
  res.json(logs);
});

// POST /api/fuel/logs - manual fuel log entry (not tied to a trip)
router.post("/logs", requireEdit("fuelExp"), async (req, res) => {
  try {
    const { vehicle, date, liters, cost } = req.body;
    if (!vehicle || !liters || !cost) return res.status(400).json({ message: "Vehicle, liters and cost are required." });
    const log = await FuelLog.create({ vehicle, date: date || new Date(), liters, cost });
    const populated = await log.populate("vehicle", "name regNo");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Could not add fuel log.", error: err.message });
  }
});

// GET /api/fuel/expenses - trip-linked toll/other/maintenance summary
router.get("/expenses", async (req, res) => {
  const trips = await Trip.find({ status: { $in: ["Completed", "Dispatched"] } })
    .populate("vehicle", "name regNo")
    .sort({ createdAt: -1 });

  const rows = await Promise.all(
    trips.map(async (t) => {
      const maint = await Maintenance.aggregate([
        { $match: { vehicle: t.vehicle?._id } },
        { $group: { _id: null, total: { $sum: "$cost" } } },
      ]);
      const maintTotal = maint[0]?.total || 0;
      return {
        tripCode: t.tripCode,
        vehicle: t.vehicle,
        toll: t.tollExpense || 0,
        other: t.otherExpense || 0,
        maintenanceLinked: maintTotal,
        total: (t.tollExpense || 0) + (t.otherExpense || 0) + maintTotal,
        status: t.status,
      };
    })
  );
  res.json(rows);
});

// POST /api/fuel/expenses - add a standalone expense to a trip
router.post("/expenses", requireEdit("fuelExp"), async (req, res) => {
  try {
    const { tripId, toll, other } = req.body;
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: "Trip not found." });
    trip.tollExpense = (trip.tollExpense || 0) + (Number(toll) || 0);
    trip.otherExpense = (trip.otherExpense || 0) + (Number(other) || 0);
    await trip.save();
    res.json(trip);
  } catch (err) {
    res.status(500).json({ message: "Could not add expense.", error: err.message });
  }
});

// GET /api/fuel/total-operational-cost
router.get("/total-operational-cost", async (req, res) => {
  const fuelAgg = await FuelLog.aggregate([{ $group: { _id: null, total: { $sum: "$cost" } } }]);
  const maintAgg = await Maintenance.aggregate([{ $group: { _id: null, total: { $sum: "$cost" } } }]);
  const fuel = fuelAgg[0]?.total || 0;
  const maintenance = maintAgg[0]?.total || 0;
  res.json({ fuel, maintenance, total: fuel + maintenance });
});

module.exports = router;
