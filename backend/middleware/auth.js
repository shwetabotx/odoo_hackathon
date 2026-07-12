const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { canView, canEdit } = require("../config/permissions");

// Verifies JWT and attaches req.user (minus password)
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authenticated. Missing token." });
    }
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ message: "User no longer exists." });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

// module = 'fleet' | 'drivers' | 'trips' | 'fuelExp' | 'analytics' | 'maintenance'
const requireView = (module) => (req, res, next) => {
  if (!canView(req.user.role, module)) {
    return res.status(403).json({ message: `Your role (${req.user.role}) does not have access to ${module}.` });
  }
  next();
};

const requireEdit = (module) => (req, res, next) => {
  if (!canEdit(req.user.role, module)) {
    return res.status(403).json({ message: `Your role (${req.user.role}) has read-only or no access to ${module}.` });
  }
  next();
};

module.exports = { protect, requireView, requireEdit };
