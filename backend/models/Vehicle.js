const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    regNo: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true }, // e.g. VAN-05
    type: { type: String, enum: ["Van", "Truck", "Mini"], required: true },
    capacity: { type: Number, required: true }, // numeric value
    capacityUnit: { type: String, enum: ["kg", "Ton"], default: "kg" },
    odometer: { type: Number, default: 0 },
    acquisitionCost: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Available", "On Trip", "In Shop", "Retired"],
      default: "Available",
    },
  },
  { timestamps: true }
);

// helper: normalized capacity in kg for comparisons
vehicleSchema.methods.capacityInKg = function () {
  return this.capacityUnit === "Ton" ? this.capacity * 1000 : this.capacity;
};

module.exports = mongoose.model("Vehicle", vehicleSchema);
