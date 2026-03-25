import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/public/Landing";
import Login from "./pages/public/Login";
import DentistDashboard from "./pages/dentist/DentistDashboard";
import DentistProfile from "./pages/dentist/DentistProfile";
import DentistSchedule from "./pages/dentist/DentistSchedule";
import DentistPatientHistory from "./pages/dentist/DentistPatientHistory";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Queue from "./pages/admin/Queue";
import Appointments from "./pages/admin/AdminAppointments";
import AdminDentist from "./pages/admin/AdminDentist";
import AdminPatient from "./pages/admin/AdminPatient";

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

        <Route
          path="/admin-dashboard"
          element={<Navigate to="/admin/dashboard" replace />}
        />

        <Route path="/dentist/dashboard" element={<DentistDashboard />} />
        <Route path="/dentist/profile" element={<DentistProfile />} />
        <Route path="/dentist/schedule" element={<DentistSchedule />} />
        <Route
          path="/dentist/patient-history"
          element={<DentistPatientHistory />}
        />

        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/queue-control" element={<Queue />} />
        <Route path="/admin/appointments" element={<Appointments />} />
        <Route path="/admin/dentists" element={<AdminDentist />} />
        <Route path="/admin/patients" element={<AdminPatient />} />
      </Routes>
    </BrowserRouter>
  );
}