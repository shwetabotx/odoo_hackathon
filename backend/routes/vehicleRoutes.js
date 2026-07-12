const express = require("express");
const router = express.Router();
const Vehicle = require("../models/Vehicle");
const { protect, requireView, requireEdit } = require("../middleware/auth");

router.use(protect, requireView("fleet"));

// GET /api/vehicles?type=&status=&search=
router.get("/", async (req, res) => {
  const { type, status, search } = req.query;
  const filter = {};
  if (type && type !== "All") filter.type = type;
  if (status && status !== "All") filter.status = status;
  if (search) filter.regNo = { $regex: search, $options: "i" };
  const vehicles = await Vehicle.find(filter).sort({ createdAt: -1 });
  res.json(vehicles);
});

// GET /api/vehicles/available - excludes Retired & In Shop, used by Trip Dispatcher
router.get("/available", async (req, res) => {
  const vehicles = await Vehicle.find({ status: "Available" }).sort({ name: 1 });
  res.json(vehicles);
});

router.post("/", requireEdit("fleet"), async (req, res) => {
  try {
    const { regNo, name, type, capacity, capacityUnit, odometer, acquisitionCost, status } = req.body;
    if (!regNo || !name || !type || !capacity || !acquisitionCost) {
      return res.status(400).json({ message: "Missing required vehicle fields." });
    }
    const existing = await Vehicle.findOne({ regNo: regNo.toUpperCase() });
    if (existing) return res.status(409).json({ message: "Registration No. must be unique." });

    const vehicle = await Vehicle.create({
      regNo, name, type, capacity, capacityUnit, odometer, acquisitionCost,
      status: status || "Available",
    });
    res.status(201).json(vehicle);
  } catch (err) {
    res.status(500).json({ message: "Could not create vehicle.", error: err.message });
  }
});

router.put("/:id", requireEdit("fleet"), async (req, res) => {
  try {
    if (req.body.regNo) {
      const dup = await Vehicle.findOne({ regNo: req.body.regNo.toUpperCase(), _id: { $ne: req.params.id } });
      if (dup) return res.status(409).json({ message: "Registration No. must be unique." });
    }
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found." });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ message: "Could not update vehicle.", error: err.message });
  }
});

router.delete("/:id", requireEdit("fleet"), async (req, res) => {
  const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
  if (!vehicle) return res.status(404).json({ message: "Vehicle not found." });
  res.json({ message: "Vehicle deleted." });
});

module.exports = router;
