import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthService from "./services/authService";
import Landing from "./pages/public/Landing";
import Login from "./pages/public/Login";
import ForgotPassword from "./pages/public/ForgotPassword";
import DentistDashboard from "./pages/dentist/DentistDashboard";
import DentistProfile from "./pages/dentist/DentistProfile";
import DentistSchedule from "./pages/dentist/DentistSchedule";
import DentistPatientHistory from "./pages/dentist/DentistPatientHistory";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Queue from "./pages/admin/Queue";
import Appointments from "./pages/admin/AdminAppointments";
import AdminDentist from "./pages/admin/AdminDentist";
import AdminPatient from "./pages/admin/AdminPatient";

function ProtectedRoute({ expectedRole, children }) {
  const isAuthenticated = AuthService.isAuthenticated();
  const role = AuthService.getRole();

  if (!isAuthenticated) {
    return <Navigate to={`/login?role=${expectedRole}`} replace />;
  }

  if (role !== expectedRole) {
    return <Navigate to={`/login?role=${expectedRole}`} replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route
          path="/dentist-dashboard"
          element={<Navigate to="/dentist/dashboard" replace />}
        />

        <Route
          path="/admin-dashboard"
          element={<Navigate to="/admin/dashboard" replace />}
        />

        <Route
          path="/dentist/dashboard"
          element={(
            <ProtectedRoute expectedRole="dentist">
              <DentistDashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/dentist/profile"
          element={(
            <ProtectedRoute expectedRole="dentist">
              <DentistProfile />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/dentist/schedule"
          element={(
            <ProtectedRoute expectedRole="dentist">
              <DentistSchedule />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/dentist/patient-history"
          element={(
            <ProtectedRoute expectedRole="dentist">
              <DentistPatientHistory />
            </ProtectedRoute>
          )}
        />

        <Route
          path="/admin/dashboard"
          element={(
            <ProtectedRoute expectedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/queue-control"
          element={(
            <ProtectedRoute expectedRole="admin">
              <Queue />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/appointments"
          element={(
            <ProtectedRoute expectedRole="admin">
              <Appointments />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/dentists"
          element={(
            <ProtectedRoute expectedRole="admin">
              <AdminDentist />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/patients"
          element={(
            <ProtectedRoute expectedRole="admin">
              <AdminPatient />
            </ProtectedRoute>
          )}
        />
      </Routes>
    </BrowserRouter>
  );
}