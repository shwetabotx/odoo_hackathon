require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");
const Vehicle = require("./models/Vehicle");
const Driver = require("./models/Driver");

const run = async () => {
  await connectDB();

  await User.deleteMany({});
  await Vehicle.deleteMany({});
  await Driver.deleteMany({});

  await User.create([
    { name: "Raven K.", email: "raven@transitops.in", password: "password123", role: "Dispatcher" },
    { name: "Meera Shah", email: "meera@transitops.in", password: "password123", role: "FleetManager" },
    { name: "Karan Patel", email: "karan@transitops.in", password: "password123", role: "SafetyOfficer" },
    { name: "Anjali Rao", email: "anjali@transitops.in", password: "password123", role: "FinancialAnalyst" },
  ]);

  await Vehicle.create([
    { regNo: "GJ01AB4521", name: "VAN-05", type: "Van", capacity: 500, capacityUnit: "kg", odometer: 74000, acquisitionCost: 620000, status: "Available" },
    { regNo: "GJ01AB9981", name: "TRUCK-11", type: "Truck", capacity: 5, capacityUnit: "Ton", odometer: 182000, acquisitionCost: 2450000, status: "Available" },
    { regNo: "GJ01AB1120", name: "MINI-03", type: "Mini", capacity: 1, capacityUnit: "Ton", odometer: 66000, acquisitionCost: 410000, status: "Available" },
    { regNo: "GJ01AB0008", name: "VAN-09", type: "Van", capacity: 750, capacityUnit: "kg", odometer: 241900, acquisitionCost: 590000, status: "Retired" },
  ]);

  await Driver.create([
    { name: "Alex", licenseNo: "DL-88213", licenseCategory: "LMV", licenseExpiry: new Date("2028-12-01"), contact: "9876500000", safetyScore: 96, status: "Available" },
    { name: "John", licenseNo: "DL-44120", licenseCategory: "HMV", licenseExpiry: new Date("2025-03-01"), contact: "9822000000", safetyScore: 81, status: "Suspended" },
    { name: "Priya", licenseNo: "DL-77031", licenseCategory: "LMV", licenseExpiry: new Date("2027-08-01"), contact: "9911000000", safetyScore: 99, status: "Available" },
    { name: "Suresh", licenseNo: "DL-90045", licenseCategory: "HMV", licenseExpiry: new Date("2027-01-01"), contact: "9744000000", safetyScore: 88, status: "Off Duty" },
  ]);

  console.log("Seed complete. Demo logins (password: password123):");
  console.log("  Dispatcher       -> raven@transitops.in");
  console.log("  Fleet Manager    -> meera@transitops.in");
  console.log("  Safety Officer   -> karan@transitops.in");
  console.log("  Financial Analyst-> anjali@transitops.in");
  mongoose.connection.close();
};

run();
