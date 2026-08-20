import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/admin/layout/AdminSidebar";
import AdminTopbar from "../../components/admin/layout/AdminTopbar";
import { getAdminPatients, getAdminProfile } from "../../services/adminService";

import "../../styles/admin/patient/admin-patient.css";
import "../../styles/admin/dashboard/admin-layout.css";
import "../../styles/admin/layout/admin-sidebar.css";
import "../../styles/admin/layout/admin-topbar.css";
import "../../styles/admin/notifications/admin-notification-popup.css";
import "../../styles/admin/shared/admin-responsive.css";

const defaultAssignedBranch = "General Trias";

const initialNotifications = [
  {
    id: 1,
    title: "New Appointment Booked",
    message: "A patient booked an appointment in your branch.",
    time: "5 mins ago",
  },
  {
    id: 2,
    title: "Walk-in Patient Added",
    message: "A new walk-in patient was added today.",
    time: "22 mins ago",
  },
  {
    id: 3,
    title: "Patient Record Updated",
    message: "A patient profile was updated.",
    time: "1 hour ago",
  },
];

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function getStatusClass(status = "") {
  return status.toLowerCase().replace(/\s+/g, "-");
}

function PatientDetailsModal({ patient, onClose }) {
  if (!patient) return null;

  return (
    <div className="patient-details-overlay" onClick={onClose}>
      <div
        className="patient-details-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="patient-details-close" onClick={onClose}>
          ×
        </button>

        <div className="patient-details-header">
          <div className="patient-details-avatar">
            {patient.name.charAt(0).toUpperCase()}
          </div>

          <div className="patient-details-header-text">
            <h2>{patient.name}</h2>
            <p>{patient.service}</p>
            <span className={`patient-badge ${getStatusClass(patient.status)}`}>
              {patient.status}
            </span>
          </div>
        </div>

        <div className="patient-details-grid">
          <div className="patient-info-card">
            <h4>Personal Information</h4>

            <div className="patient-info-row">
              <span>Full Name</span>
              <strong>{patient.name}</strong>
            </div>

            <div className="patient-info-row">
              <span>Gender</span>
              <strong>{patient.gender}</strong>
            </div>

            <div className="patient-info-row">
              <span>Age</span>
              <strong>{patient.age}</strong>
            </div>

            <div className="patient-info-row">
              <span>Birthday</span>
              <strong>{formatDate(patient.birthday)}</strong>
            </div>

            <div className="patient-info-row">
              <span>Phone Number</span>
              <strong>{patient.phone}</strong>
            </div>

            <div className="patient-info-row">
              <span>Email Address</span>
              <strong>{patient.email}</strong>
            </div>

            <div className="patient-info-row">
              <span>Address</span>
              <strong>{patient.address}</strong>
            </div>
          </div>

          <div className="patient-info-card">
            <h4>Latest Visit Information</h4>

            <div className="patient-info-row">
              <span>Branch</span>
              <strong>{patient.branch}</strong>
            </div>

            <div className="patient-info-row">
              <span>Date of Visit</span>
              <strong>{formatDate(patient.visitDate)}</strong>
            </div>

            <div className="patient-info-row">
              <span>Service</span>
              <strong>{patient.service}</strong>
            </div>

            <div className="patient-info-row">
              <span>Status</span>
              <strong>{patient.status}</strong>
            </div>
          </div>

          <div className="patient-info-card patient-procedure-card">
            <h4>Procedure / Treatment History</h4>

            <div className="patient-procedure-list">
              {patient.procedures?.length > 0 ? (
                patient.procedures.map((procedure, index) => (
                  <div className={`patient-procedure-item ${getStatusClass(procedure.status)}`} key={index}>
                    <div className="patient-procedure-top">
                      <strong>{procedure.name}</strong>
                      <span
                        className={`patient-badge ${getStatusClass(
                          procedure.status
                        )}`}
                      >
                        {procedure.status}
                      </span>
                    </div>

                    <div className="patient-procedure-meta">
                      <div className="patient-procedure-row">
                        <span>Date</span>
                        <strong>{formatDate(procedure.date)}</strong>
                      </div>

                      <div className="patient-procedure-row">
                        <span>Time</span>
                        <strong>{procedure.time}</strong>
                      </div>

                      <div className="patient-procedure-row">
                        <span>Doctor</span>
                        <strong>{procedure.doctor}</strong>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="patient-procedure-empty">
                  No procedures recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPatient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [patients, setPatients] = useState([]);
  const [adminAssignedBranch, setAdminAssignedBranch] = useState(defaultAssignedBranch);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const [patientsResult, profileResult] = await Promise.all([getAdminPatients(), getAdminProfile()]);
      if (active && patientsResult?.success && Array.isArray(patientsResult.data)) {
        setPatients(patientsResult.data);
      }

      if (active && profileResult?.success && profileResult?.data?.branch) {
        setAdminAssignedBranch(profileResult.data.branch);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const filteredPatients = useMemo(() => {
    const adminBranches = adminAssignedBranch ? adminAssignedBranch.split("|").map(b => b.trim().toLowerCase()) : [];

    return patients
      .filter((patient) => {
        if (!adminAssignedBranch || adminAssignedBranch === "All") return true;
        return adminBranches.includes(String(patient.branch || "").trim().toLowerCase());
      })
      .filter((patient) => {
        const search = searchTerm.toLowerCase();
        return (
          patient.name.toLowerCase().includes(search) ||
          patient.gender.toLowerCase().includes(search) ||
          patient.phone.toLowerCase().includes(search) ||
          patient.service.toLowerCase().includes(search) ||
          patient.status.toLowerCase().includes(search)
        );
      });
  }, [patients, searchTerm, adminAssignedBranch]);

  const totalPatients = filteredPatients.length;
  const completedPatients = filteredPatients.reduce((count, patient) => {
    const completedProcedures = (patient.procedures || []).filter(
      (procedure) => procedure.status === "Completed"
    ).length;
    return count + completedProcedures;
  }, 0);

  const handleToggleNotifications = () => {
    setIsNotificationOpen((prev) => !prev);
  };

  const handleCloseNotifications = () => {
    setIsNotificationOpen(false);
  };

  const handleMarkAllRead = () => {
    setNotifications([]);
  };

  return (
    <div className="admin-patient-page">
      <AdminSidebar />

      <div className="admin-patient-main">
        <AdminTopbar
          title="Patients"
          notifications={notifications}
          isNotificationOpen={isNotificationOpen}
          onToggleNotifications={handleToggleNotifications}
          onCloseNotifications={handleCloseNotifications}
          onMarkAllRead={handleMarkAllRead}
        />

        <div className="admin-patient-content">
          <div className="admin-patient-heading">
            <div>
              <h1>Patients</h1>
              <p>
                Manage and view patient records assigned to {adminAssignedBranch}.
              </p>
            </div>
          </div>

          <div className="admin-patient-stats">
            <div className="patient-stat-card">
              <span>Total Patients</span>
              <h3>{totalPatients}</h3>
            </div>

            <div className="patient-stat-card">
              <span>Completed Visits</span>
              <h3>{completedPatients}</h3>
            </div>

            <div className="patient-stat-card">
              <span>Assigned Branch</span>
              <h3 className="branch-name-card">{adminAssignedBranch}</h3>
            </div>
          </div>

          <div className="admin-patient-table-card">
            <div className="admin-patient-table-top">
              <div>
                <h3>Patient List</h3>
                <p>{filteredPatients.length} patient(s) found</p>
              </div>

              <div className="admin-patient-search">
                <input
                  type="text"
                  placeholder="Search patient, phone, service..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="admin-patient-table-wrapper">
              <table className="admin-patient-table">
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>Gender</th>
                    <th>Age</th>
                    <th>Phone Number</th>
                    <th>Date of Visit</th>
                    <th>Status</th>
                    <th className="patient-action-header">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPatients.length > 0 ? (
                    filteredPatients.map((patient) => (
                      <tr key={patient.id}>
                        <td>
                          <div className="patient-name-cell">
                            <strong>{patient.name}</strong>
                            {patient.accountName && patient.accountName !== patient.name ? (
                              <span className="patient-account-label">
                                Profile under {patient.accountName}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td>{patient.gender}</td>
                        <td>{patient.age}</td>
                        <td>{patient.phone}</td>
                        <td>{formatDate(patient.visitDate)}</td>
                        <td>
                          <span
                            className={`patient-badge ${getStatusClass(
                              patient.status
                            )}`}
                          >
                            {patient.status}
                          </span>
                        </td>
                        <td className="patient-action-cell">
                          <button
                            className="patient-view-btn"
                            onClick={() => setSelectedPatient(patient)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="patient-empty-state">
                        No patients found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <PatientDetailsModal
        patient={selectedPatient}
        onClose={() => setSelectedPatient(null)}
      />
    </div>
  );
}