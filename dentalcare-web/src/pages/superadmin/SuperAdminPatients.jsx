import { useEffect, useMemo, useState } from "react";
import SuperAdminSidebar from "../../components/superadmin/layout/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/layout/SuperAdminTopbar";
import { getSuperAdminPatients } from "../../services/superAdminService";

import "../../styles/admin/layout/admin-sidebar.css";
import "../../styles/admin/layout/admin-topbar.css";
import "../../styles/admin/notifications/admin-notification-popup.css";
import "../../styles/admin/shared/admin-responsive.css";

import "../../styles/superadmin/patients/superadmin-patients.css";
import "../../styles/superadmin/shared/superadmin-responsive.css";

const BRANCHES = ["All Branches", "Dasmarinas", "General Trias", "Bacoor"];

function formatDate(dateString) {
  if (!dateString || dateString === "N/A" || dateString === "Never") return dateString;
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function getProcedureStatusClass(status = "") {
  return status.toLowerCase().replace(/\s+/g, "-");
}

function getPatientStatusClass(status = "") {
  return status.toLowerCase() === "active" ? "is-active" : "is-inactive";
}

function PatientDetailsModal({ patient, onClose }) {
  if (!patient) return null;

  return (
    <div className="superadmin-patient-details-overlay" onClick={onClose}>
      <div
        className="superadmin-patient-details-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="superadmin-patient-details-close" onClick={onClose}>
          ×
        </button>

        <div className="superadmin-patient-details-header">
          <div className="superadmin-patient-details-avatar">
            {patient.name ? patient.name.charAt(0).toUpperCase() : "P"}
          </div>

          <div className="superadmin-patient-details-header-text">
            <h2>{patient.name}</h2>
            <p>{patient.service}</p>
            <span
              className={`superadmin-patient-status-badge ${getPatientStatusClass(
                patient.status
              )}`}
            >
              {patient.status}
            </span>
          </div>
        </div>

        <div className="superadmin-patient-details-grid">
          <div className="superadmin-patient-info-card">
            <h4>Personal Information</h4>

            <div className="superadmin-patient-info-row">
              <span>Full Name</span>
              <strong>{patient.name}</strong>
            </div>

            <div className="superadmin-patient-info-row">
              <span>Gender</span>
              <strong>{patient.gender}</strong>
            </div>

            <div className="superadmin-patient-info-row">
              <span>Age</span>
              <strong>{patient.age}</strong>
            </div>

            <div className="superadmin-patient-info-row">
              <span>Birthday</span>
              <strong>{formatDate(patient.birthday)}</strong>
            </div>

            <div className="superadmin-patient-info-row">
              <span>Phone Number</span>
              <strong>{patient.phone}</strong>
            </div>

            <div className="superadmin-patient-info-row">
              <span>Email Address</span>
              <strong>{patient.email}</strong>
            </div>

            <div className="superadmin-patient-info-row">
              <span>Address</span>
              <strong>{patient.address}</strong>
            </div>
          </div>

          <div className="superadmin-patient-info-card">
            <h4>Latest Visit Information</h4>

            <div className="superadmin-patient-info-row">
              <span>Branch</span>
              <strong>{patient.branch}</strong>
            </div>

            <div className="superadmin-patient-info-row">
              <span>Last Date of Visit</span>
              <strong>{formatDate(patient.visitDate)}</strong>
            </div>

            <div className="superadmin-patient-info-row">
              <span>Service</span>
              <strong>{patient.service}</strong>
            </div>

            <div className="superadmin-patient-info-row">
              <span>Status</span>
              <strong>{patient.status}</strong>
            </div>
          </div>

          <div className="superadmin-patient-info-card superadmin-patient-procedure-card">
            <h4>Procedure / Treatment History</h4>

            <div className="superadmin-patient-procedure-list">
              {patient.procedures?.length > 0 ? (
                patient.procedures.map((procedure, index) => (
                  <div className="superadmin-patient-procedure-item" key={index}>
                    <div className="superadmin-patient-procedure-top">
                      <strong>{procedure.name}</strong>
                      <span
                        className={`superadmin-patient-procedure-badge ${getProcedureStatusClass(
                          procedure.status
                        )}`}
                      >
                        {procedure.status}
                      </span>
                    </div>

                    <div className="superadmin-patient-procedure-meta">
                      <div className="superadmin-patient-procedure-row">
                        <span>Date</span>
                        <strong>{formatDate(procedure.date)}</strong>
                      </div>

                      <div className="superadmin-patient-procedure-row">
                        <span>Time</span>
                        <strong>{procedure.time}</strong>
                      </div>

                      <div className="superadmin-patient-procedure-row">
                        <span>Doctor</span>
                        <strong>{procedure.doctor}</strong>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="superadmin-patient-procedure-empty">
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

export default function SuperAdminPatients() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("All Branches");
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    const fetchPatients = async () => {
      const res = await getSuperAdminPatients();
      if (res?.success) setPatients(res.data);
    };
    fetchPatients();
  }, []);

  const filteredPatients = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return patients.filter((patient) => {
      const matchesBranch =
        selectedBranch === "All Branches" || patient.branch === selectedBranch;

      const matchesSearch =
        !keyword ||
        (patient.name || "").toLowerCase().includes(keyword) ||
        (patient.gender || "").toLowerCase().includes(keyword) ||
        (patient.phone || "").toLowerCase().includes(keyword) ||
        (patient.status || "").toLowerCase().includes(keyword) ||
        (patient.branch || "").toLowerCase().includes(keyword);

      return matchesBranch && matchesSearch;
    });
  }, [patients, searchTerm, selectedBranch]);

  const activeCount = filteredPatients.filter(
    (patient) => patient.status === "Active"
  ).length;

  const inactiveCount = filteredPatients.filter(
    (patient) => patient.status === "Pending" || patient.status === "Inactive"
  ).length;

  const handleMarkAllRead = () => {
    setNotifications([]);
    setIsNotificationOpen(false);
  };

  return (
    <div className="admin-dashboard-page">
      <SuperAdminSidebar />

      <main className="admin-main-content">
        <SuperAdminTopbar
          title="Patient List"
          notifications={notifications}
          isNotificationOpen={isNotificationOpen}
          onToggleNotifications={() => setIsNotificationOpen((prev) => !prev)}
          onCloseNotifications={() => setIsNotificationOpen(false)}
          onMarkAllRead={handleMarkAllRead}
        />

        <div className="superadmin-patients-fixed-page">
          <div className="superadmin-patients-content">
            <section className="superadmin-patients-header">
              <h2 className="superadmin-patients-title">Patient List</h2>
              <p className="superadmin-patients-subtitle">
                View and manage patient records from all branches.
              </p>
            </section>

            <section className="superadmin-patients-stats">
              <div className="superadmin-patient-stat-card">
                <span>Total Patients</span>
                <h3>{filteredPatients.length}</h3>
              </div>

              <div className="superadmin-patient-stat-card">
                <span>Active Patients</span>
                <h3>{activeCount}</h3>
              </div>

              <div className="superadmin-patient-stat-card">
                <span>Inactive Patients</span>
                <h3>{inactiveCount}</h3>
              </div>
            </section>

            <section className="superadmin-patients-list-card">
              <div className="superadmin-patients-card-head superadmin-patients-card-head-wrap">
                <div>
                  <h3>Patient List</h3>
                  <p>Only the list area scrolls when there are many records.</p>
                </div>

                <div className="superadmin-patients-top-actions">
                  <input
                    type="text"
                    placeholder="Search patient, gender, phone, branch..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="superadmin-patients-search"
                  />

                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="superadmin-patients-filter"
                  >
                    {BRANCHES.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="superadmin-patients-table-scroll">
                <div className="superadmin-patients-table-wrap">
                  <table className="superadmin-patients-table">
                    <thead>
                      <tr>
                        <th>Patient Name</th>
                        <th>Gender</th>
                        <th>Age</th>
                        <th>Phone Number</th>
                        <th>Last Date of Visit</th>
                        <th>Branch</th>
                        <th>Status</th>
                        <th className="superadmin-patient-action-header">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredPatients.length > 0 ? (
                        filteredPatients.map((patient) => (
                          <tr key={patient.id}>
                            <td className="superadmin-patient-name-cell">
                              {patient.name}
                            </td>
                            <td>{patient.gender}</td>
                            <td>{patient.age}</td>
                            <td>{patient.phone}</td>
                            <td>{formatDate(patient.visitDate)}</td>
                            <td>{patient.branch}</td>
                            <td>
                              <span
                                className={`superadmin-patient-status-badge ${getPatientStatusClass(
                                  patient.status
                                )}`}
                              >
                                {patient.status}
                              </span>
                            </td>
                            <td className="superadmin-patient-action-cell">
                              <button
                                className="superadmin-patient-view-btn"
                                onClick={() => setSelectedPatient(patient)}
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="superadmin-patient-empty-state">
                            No patients found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <PatientDetailsModal
        patient={selectedPatient}
        onClose={() => setSelectedPatient(null)}
      />
    </div>
  );
}