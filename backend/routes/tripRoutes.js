const express = require("express");
const router = express.Router();
const Trip = require("../models/Trip");
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");
const FuelLog = require("../models/FuelLog");
const { protect, requireView, requireEdit } = require("../middleware/auth");

router.use(protect, requireView("trips"));

const nextTripCode = async () => {
  const count = await Trip.countDocuments();
  return `TR${String(count + 1).padStart(3, "0")}`;
};

// GET /api/trips - live board, most recent first
router.get("/", async (req, res) => {
  const trips = await Trip.find()
    .populate("vehicle", "name regNo capacity capacityUnit")
    .populate("driver", "name")
    .sort({ createdAt: -1 });
  res.json(trips);
});

// POST /api/trips - create in Draft status
router.post("/", requireEdit("trips"), async (req, res) => {
  try {
    const { source, destination, vehicle, driver, cargoWeight, plannedDistance } = req.body;
    if (!source || !destination || !cargoWeight || !plannedDistance) {
      return res.status(400).json({ message: "Source, destination, cargo weight and distance are required." });
    }
    const tripCode = await nextTripCode();
    const trip = await Trip.create({
      tripCode, source, destination,
      vehicle: vehicle || null, driver: driver || null,
      cargoWeight, plannedDistance, status: "Draft",
    });
    res.status(201).json(trip);
  } catch (err) {
    res.status(500).json({ message: "Could not create trip.", error: err.message });
  }
});

// POST /api/trips/:id/dispatch - validates ALL business rules
router.post("/:id/dispatch", requireEdit("trips"), async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: "Trip not found." });
    if (trip.status !== "Draft") return res.status(400).json({ message: "Only Draft trips can be dispatched." });

    const { vehicle: vehicleId, driver: driverId } = req.body.vehicle ? req.body : trip;
    if (!vehicleId || !driverId) {
      return res.status(400).json({ message: "A vehicle and driver must be selected before dispatch." });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    const driver = await Driver.findById(driverId);
    if (!vehicle) return res.status(404).json({ message: "Selected vehicle not found." });
    if (!driver) return res.status(404).json({ message: "Selected driver not found." });

    // Rule: Retired / In Shop vehicles never dispatchable
    if (vehicle.status === "Retired" || vehicle.status === "In Shop") {
      return res.status(400).json({ message: `Vehicle is ${vehicle.status} and cannot be dispatched.` });
    }
    // Rule: vehicle already On Trip
    if (vehicle.status === "On Trip") {
      return res.status(400).json({ message: "Vehicle is already assigned to another trip." });
    }
    // Rule: expired license or suspended driver
    if (driver.isLicenseExpired()) {
      return res.status(400).json({ message: "Driver's license has expired. Blocked from trip assignment." });
    }
    if (driver.status === "Suspended") {
      return res.status(400).json({ message: "Driver is Suspended. Blocked from trip assignment." });
    }
    if (driver.status === "On Trip") {
      return res.status(400).json({ message: "Driver is already assigned to another trip." });
    }
    // Rule: cargo weight vs capacity
    const capacityKg = vehicle.capacityInKg();
    if (trip.cargoWeight > capacityKg) {
      return res.status(400).json({
        message: `Capacity exceeded by ${trip.cargoWeight - capacityKg} kg — dispatch blocked.`,
      });
    }

    trip.vehicle = vehicle._id;
    trip.driver = driver._id;
    trip.status = "Dispatched";
    trip.dispatchedAt = new Date();
    await trip.save();

    vehicle.status = "On Trip";
    driver.status = "On Trip";
    driver.tripsAssigned += 1;
    await vehicle.save();
    await driver.save();

    const populated = await trip.populate([{ path: "vehicle" }, { path: "driver" }]);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: "Could not dispatch trip.", error: err.message });
  }
});

// POST /api/trips/:id/complete - odometer, fuel, expenses, revenue
router.post("/:id/complete", requireEdit("trips"), async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).populate("vehicle").populate("driver");
    if (!trip) return res.status(404).json({ message: "Trip not found." });
    if (trip.status !== "Dispatched") return res.status(400).json({ message: "Only Dispatched trips can be completed." });

    const { actualDistance, fuelConsumed, fuelCost, tollExpense, otherExpense, revenue } = req.body;

    trip.actualDistance = actualDistance ?? trip.plannedDistance;
    trip.fuelConsumed = fuelConsumed || 0;
    trip.fuelCost = fuelCost || 0;
    trip.tollExpense = tollExpense || 0;
    trip.otherExpense = otherExpense || 0;
    trip.revenue = revenue || 0;
    trip.status = "Completed";
    trip.completedAt = new Date();
    await trip.save();

    if (trip.vehicle) {
      trip.vehicle.status = "Available";
      trip.vehicle.odometer += trip.actualDistance;
      await trip.vehicle.save();
    }
    if (trip.driver) {
      trip.driver.status = "Available";
      trip.driver.tripsCompleted += 1;
      await trip.driver.save();
    }
    if (trip.fuelConsumed > 0) {
      await FuelLog.create({
        vehicle: trip.vehicle._id, trip: trip._id, date: new Date(),
        liters: trip.fuelConsumed, cost: trip.fuelCost,
      });
    }

    res.json(trip);
  } catch (err) {
    res.status(500).json({ message: "Could not complete trip.", error: err.message });
  }
});

// POST /api/trips/:id/cancel - restores vehicle/driver if it was dispatched
router.post("/:id/cancel", requireEdit("trips"), async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).populate("vehicle").populate("driver");
    if (!trip) return res.status(404).json({ message: "Trip not found." });
    if (trip.status === "Completed" || trip.status === "Cancelled") {
      return res.status(400).json({ message: `Trip is already ${trip.status}.` });
    }

    if (trip.status === "Dispatched") {
      if (trip.vehicle) { trip.vehicle.status = "Available"; await trip.vehicle.save(); }
      if (trip.driver) { trip.driver.status = "Available"; await trip.driver.save(); }
    }
    trip.status = "Cancelled";
    trip.note = req.body.note || trip.note;
    await trip.save();
    res.json(trip);
  } catch (err) {
    res.status(500).json({ message: "Could not cancel trip.", error: err.message });
  }
});

module.exports = router;
