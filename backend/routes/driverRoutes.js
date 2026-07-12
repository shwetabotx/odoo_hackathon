const express = require("express");
const router = express.Router();
const Driver = require("../models/Driver");
const { protect, requireView, requireEdit } = require("../middleware/auth");

router.use(protect, requireView("drivers"));

// GET /api/drivers?search=
router.get("/", async (req, res) => {
  const { search } = req.query;
  const filter = {};
  if (search) filter.name = { $regex: search, $options: "i" };
  const drivers = await Driver.find(filter).sort({ createdAt: -1 });
  res.json(drivers);
});

// GET /api/drivers/available - excludes expired license & suspended, used by Trip Dispatcher
router.get("/available", async (req, res) => {
  const drivers = await Driver.find({
    status: "Available",
    licenseExpiry: { $gte: new Date() },
  }).sort({ name: 1 });
  res.json(drivers);
});

router.post("/", requireEdit("drivers"), async (req, res) => {
  try {
    const { name, licenseNo, licenseCategory, licenseExpiry, contact, safetyScore, status } = req.body;
    if (!name || !licenseNo || !licenseCategory || !licenseExpiry || !contact) {
      return res.status(400).json({ message: "Missing required driver fields." });
    }
    const existing = await Driver.findOne({ licenseNo: licenseNo.toUpperCase() });
    if (existing) return res.status(409).json({ message: "License No. must be unique." });

    const driver = await Driver.create({
      name, licenseNo, licenseCategory, licenseExpiry, contact,
      safetyScore: safetyScore ?? 100,
      status: status || "Available",
    });
    res.status(201).json(driver);
  } catch (err) {
    res.status(500).json({ message: "Could not create driver.", error: err.message });
  }
});

router.put("/:id", requireEdit("drivers"), async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!driver) return res.status(404).json({ message: "Driver not found." });
    res.json(driver);
  } catch (err) {
    res.status(500).json({ message: "Could not update driver.", error: err.message });
  }
});

// PATCH /api/drivers/:id/status  { status } - manual toggle, blocked while On Trip
router.patch("/:id/status", requireEdit("drivers"), async (req, res) => {
  const driver = await Driver.findById(req.params.id);
  if (!driver) return res.status(404).json({ message: "Driver not found." });
  if (driver.status === "On Trip") {
    return res.status(400).json({ message: "Cannot manually change status while driver is On Trip." });
  }
  driver.status = req.body.status;
  await driver.save();
  res.json(driver);
});

router.delete("/:id", requireEdit("drivers"), async (req, res) => {
  const driver = await Driver.findByIdAndDelete(req.params.id);
  if (!driver) return res.status(404).json({ message: "Driver not found." });
  res.json({ message: "Driver deleted." });
});

module.exports = router;
