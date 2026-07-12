const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    depotName: { type: String, default: "Gandhinagar Depot GJ4" },
    currency: { type: String, default: "INR (₹)" },
    distanceUnit: { type: String, default: "Kilometers" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
