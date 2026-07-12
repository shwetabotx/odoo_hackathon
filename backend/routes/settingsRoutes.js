const express = require("express");
const router = express.Router();
const Settings = require("../models/Settings");
const { protect } = require("../middleware/auth");
const { ROLES, MATRIX } = require("../config/permissions");

router.use(protect);

router.get("/", async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  res.json({ settings, rbac: MATRIX, roles: ROLES });
});

router.put("/", async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create(req.body);
  else {
    Object.assign(settings, req.body);
    await settings.save();
  }
  res.json(settings);
});

module.exports = router;
