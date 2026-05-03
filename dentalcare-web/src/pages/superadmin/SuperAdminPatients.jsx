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

import logo from "../../assets/logo.png";

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

  const handleExportPDF = () => {
    const logoUrl =
      typeof logo === "string"
        ? logo
        : new URL("../../assets/logo.png", import.meta.url).href;

    const rowsHtml =
      filteredPatients.length > 0
        ? filteredPatients
            .map(
              (patient, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${patient.name || "-"}</td>
                  <td>${patient.gender || "-"}</td>
                  <td>${patient.age || "-"}</td>
                  <td>${patient.phone || "-"}</td>
                  <td>${formatDate(patient.visitDate) || "-"}</td>
                  <td>${patient.branch || "-"}</td>
                  <td>${patient.status || "-"}</td>
                </tr>
              `
            )
            .join("")
        : `
          <tr>
            <td colspan="8" style="text-align:center; padding:18px; color:#8a90a2;">
              No patient records found.
            </td>
          </tr>
        `;

    const printWindow = window.open("", "_blank", "width=1200,height=900");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Patient List Report</title>
          <style>
            * { box-sizing: border-box; }
            @page { size: A4 landscape; margin: 12mm; }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, Helvetica, sans-serif;
              background: #ffffff;
              color: #222;
              font-size: 13px;
              line-height: 1.35;
            }
            .report-container { width: 100%; }
            .report-header {
              display: flex;
              align-items: center;
              gap: 14px;
              border-bottom: 2px solid #ef4b84;
              padding-bottom: 10px;
              margin-bottom: 14px;
            }
            .report-logo {
              width: 54px;
              height: 54px;
              object-fit: contain;
              flex-shrink: 0;
            }
            .report-title-wrap { flex: 1; min-width: 0; }
            .report-title {
              margin: 0;
              font-size: 24px;
              font-weight: 800;
              color: #a52d63;
              line-height: 1.1;
            }
            .report-subtitle {
              margin: 4px 0 0;
              font-size: 13px;
              color: #666;
            }
            .report-filter-note {
              margin: 6px 0 0;
              font-size: 12px;
              color: #7a7a7a;
            }
            .section { margin-bottom: 14px; }
            .section-title {
              margin: 0 0 8px;
              font-size: 13px;
              font-weight: 800;
              color: #a52d63;
              text-transform: uppercase;
              letter-spacing: 0.4px;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 10px;
            }
            .stat-card {
              border: 1px solid #f1d7e3;
              border-radius: 10px;
              background: #ffffff;
              padding: 10px 12px;
              min-height: 72px;
            }
            .stat-label {
              font-size: 11px;
              color: #777;
              margin-bottom: 6px;
            }
            .stat-value {
              font-size: 24px;
              font-weight: 800;
              color: #ef4b84;
              line-height: 1;
            }
            .table-wrap {
              border: 1px solid #f1d7e3;
              border-radius: 12px;
              overflow: visible;
              background: #ffffff;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
            }
            thead {
              display: table-header-group;
              background: #fff5f9;
            }
            tr {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            th, td {
              border-bottom: 1px solid #f3dbe5;
              padding: 10px 8px;
              text-align: left;
              vertical-align: top;
              font-size: 12px;
              word-break: break-word;
            }
            th {
              color: #7b4b61;
              font-weight: 700;
            }
            tbody tr:nth-child(even) {
              background: #fffdfd;
            }
            .col-no { width: 6%; }
            .col-name { width: 20%; }
            .col-gender { width: 10%; }
            .col-age { width: 8%; }
            .col-phone { width: 16%; }
            .col-visit { width: 16%; }
            .col-branch { width: 14%; }
            .col-status { width: 10%; }
            .footer-note {
              margin-top: 12px;
              font-size: 10px;
              color: #888;
              text-align: right;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              thead { display: table-header-group; }
              table { page-break-inside: auto; }
              tr, td, th { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="report-header">
              <img src="${logoUrl}" alt="GC Dental Care Logo" class="report-logo" />
              <div class="report-title-wrap">
                <h1 class="report-title">Patient List Report</h1>
                <p class="report-subtitle">GC Dental Care • Powered by Intellident</p>
                <p class="report-filter-note">Branch Filter: ${selectedBranch}</p>
              </div>
            </div>

            <div class="section">
              <h2 class="section-title">Totals Summary</h2>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-label">Total Patients</div>
                  <div class="stat-value">${filteredPatients.length}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Active Patients</div>
                  <div class="stat-value">${activeCount}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Inactive Patients</div>
                  <div class="stat-value">${inactiveCount}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <h2 class="section-title">Patient List</h2>
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th class="col-no">No.</th>
                      <th class="col-name">Patient Name</th>
                      <th class="col-gender">Gender</th>
                      <th class="col-age">Age</th>
                      <th class="col-phone">Phone Number</th>
                      <th class="col-visit">Last Date of Visit</th>
                      <th class="col-branch">Branch</th>
                      <th class="col-status">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rowsHtml}
                  </tbody>
                </table>
              </div>
            </div>

            <div class="footer-note">
              Generated on ${new Date().toLocaleString()}
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 700);
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
            <section className="superadmin-patients-page-head">
              <div className="superadmin-patients-page-head-left">
                <h2 className="superadmin-patients-title">Patient List</h2>
                <p className="superadmin-patients-subtitle">
                  View and manage patient records from all branches.
                </p>
              </div>

              <div className="superadmin-patients-page-head-right">
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="superadmin-patients-filter superadmin-patients-page-filter"
                >
                  {BRANCHES.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="superadmin-patients-export-btn"
                  onClick={handleExportPDF}
                >
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M12 3V14"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M8.5 10.5L12 14L15.5 10.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M5 16.5V18C5 19.1 5.9 20 7 20H17C18.1 20 19 19.1 19 18V16.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span>Export PDF</span>
                </button>
              </div>
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
              <div className="superadmin-patients-card-head">
                <div className="superadmin-patients-list-head">
                  <div className="superadmin-patients-list-head-text">
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
                  </div>
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