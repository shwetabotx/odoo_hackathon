const express = require("express");
const router = express.Router();
const Maintenance = require("../models/Maintenance");
const Vehicle = require("../models/Vehicle");
const { protect, requireView, requireEdit } = require("../middleware/auth");

router.use(protect, requireView("maintenance"));

router.get("/", async (req, res) => {
  const logs = await Maintenance.find().populate("vehicle", "name regNo status").sort({ createdAt: -1 });
  res.json(logs);
});

// POST /api/maintenance - creating an active record sets vehicle -> In Shop
router.post("/", requireEdit("maintenance"), async (req, res) => {
  try {
    const { vehicle: vehicleId, serviceType, cost, date, notes } = req.body;
    if (!vehicleId || !serviceType || cost === undefined) {
      return res.status(400).json({ message: "Vehicle, service type and cost are required." });
    }
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found." });
    if (vehicle.status === "On Trip") {
      return res.status(400).json({ message: "Vehicle is On Trip and cannot be sent to maintenance." });
    }

    const log = await Maintenance.create({
      vehicle: vehicleId, serviceType, cost, date: date || new Date(), notes, status: "In Shop",
    });

    vehicle.status = "In Shop";
    await vehicle.save();

    const populated = await log.populate("vehicle");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Could not create maintenance record.", error: err.message });
  }
});

// PUT /api/maintenance/:id/close - restores vehicle to Available (unless Retired)
router.put("/:id/close", requireEdit("maintenance"), async (req, res) => {
  try {
    const log = await Maintenance.findById(req.params.id).populate("vehicle");
    if (!log) return res.status(404).json({ message: "Maintenance record not found." });
    if (log.status === "Completed") return res.status(400).json({ message: "Record already closed." });

    log.status = "Completed";
    await log.save();

    if (log.vehicle && log.vehicle.status !== "Retired") {
      log.vehicle.status = "Available";
      await log.vehicle.save();
    }
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: "Could not close maintenance record.", error: err.message });
  }
});

module.exports = router;
