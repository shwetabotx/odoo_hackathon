const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
  {
    tripCode: { type: String, required: true, unique: true }, // TR001, TR002...
    source: { type: String, required: true },
    destination: { type: String, required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", default: null },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", default: null },
    cargoWeight: { type: Number, required: true }, // kg
    plannedDistance: { type: Number, required: true }, // km
    actualDistance: { type: Number, default: null },
    fuelConsumed: { type: Number, default: null }, // liters
    fuelCost: { type: Number, default: null },
    tollExpense: { type: Number, default: 0 },
    otherExpense: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Draft", "Dispatched", "Completed", "Cancelled"],
      default: "Draft",
    },
    note: { type: String, default: "" },
    dispatchedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Trip", tripSchema);
