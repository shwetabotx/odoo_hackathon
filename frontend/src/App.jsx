import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Fleet from "./pages/Fleet.jsx";
import Drivers from "./pages/Drivers.jsx";
import Trips from "./pages/Trips.jsx";
import Maintenance from "./pages/Maintenance.jsx";
import FuelExpenses from "./pages/FuelExpenses.jsx";
import Analytics from "./pages/Analytics.jsx";
import Settings from "./pages/Settings.jsx";
import ProtectedRoute from "./components/Layout/ProtectedRoute.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<ProtectedRoute module="dashboard"><Dashboard /></ProtectedRoute>} />
      <Route path="/fleet" element={<ProtectedRoute module="fleet"><Fleet /></ProtectedRoute>} />
      <Route path="/drivers" element={<ProtectedRoute module="drivers"><Drivers /></ProtectedRoute>} />
      <Route path="/trips" element={<ProtectedRoute module="trips"><Trips /></ProtectedRoute>} />
      <Route path="/maintenance" element={<ProtectedRoute module="maintenance"><Maintenance /></ProtectedRoute>} />
      <Route path="/fuel-expenses" element={<ProtectedRoute module="fuelExp"><FuelExpenses /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute module="analytics"><Analytics /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute module="settings"><Settings /></ProtectedRoute>} />
    </Routes>
  );
}
