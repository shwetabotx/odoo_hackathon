const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    licenseNo: { type: String, required: true, unique: true, trim: true, uppercase: true },
    licenseCategory: { type: String, enum: ["LMV", "HMV"], required: true },
    licenseExpiry: { type: Date, required: true },
    contact: { type: String, required: true },
    tripsCompleted: { type: Number, default: 0 },
    tripsAssigned: { type: Number, default: 0 },
    safetyScore: { type: Number, default: 100, min: 0, max: 100 },
    status: {
      type: String,
      enum: ["Available", "On Trip", "Off Duty", "Suspended"],
      default: "Available",
    },
  },
  { timestamps: true }
);

driverSchema.methods.isLicenseExpired = function () {
  return this.licenseExpiry < new Date();
};

module.exports = mongoose.model("Driver", driverSchema);
