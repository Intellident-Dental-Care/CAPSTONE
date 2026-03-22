import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/public/Landing";
import Login from "./pages/public/Login";
import DentistDashboard from "./pages/dentist/DentistDashboard";
import DentistProfile from "./pages/dentist/DentistProfile";
import DentistSchedule from "./pages/dentist/DentistSchedule";
import DentistPatientHistory from "./pages/dentist/DentistPatientHistory";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/dentist-dashboard"
          element={<Navigate to="/dentist/dashboard" replace />}
        />

        <Route path="/dentist/dashboard" element={<DentistDashboard />} />
        <Route path="/dentist/profile" element={<DentistProfile />} />
        <Route path="/dentist/schedule" element={<DentistSchedule />} />
        <Route path="/dentist/patient-history" element={<DentistPatientHistory />} />
      </Routes>
    </BrowserRouter>
  );
}