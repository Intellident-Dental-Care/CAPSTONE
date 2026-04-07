import { useMemo, useState } from "react";
import SuperAdminSidebar from "../../components/superadmin/layout/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/layout/SuperAdminTopbar";

import "../../styles/admin/layout/admin-sidebar.css";
import "../../styles/admin/layout/admin-topbar.css";
import "../../styles/admin/notifications/admin-notification-popup.css";
import "../../styles/admin/shared/admin-responsive.css";

import "../../styles/superadmin/patients/superadmin-patients.css";
import "../../styles/superadmin/shared/superadmin-responsive.css";

const BRANCHES = ["All Branches", "Dasmarinas", "General Trias", "Bacoor"];

const initialPatients = [
  {
    id: 1,
    name: "Sarah Kim",
    gender: "Female",
    age: 25,
    phone: "09123456789",
    visitDate: "2026-02-05",
    email: "sarahkim@email.com",
    birthday: "2001-08-12",
    address: "General Trias, Cavite",
    branch: "General Trias",
    status: "Active",
    service: "Dental Consultation",
    procedures: [
      {
        name: "Dental Consultation",
        date: "2026-02-05",
        time: "09:30 AM",
        doctor: "Dr. Nicole Hernandez",
        status: "Completed",
      },
      {
        name: "Teeth Cleaning",
        date: "2026-02-12",
        time: "10:00 AM",
        doctor: "Dr. Mark Villanueva",
        status: "Completed",
      },
    ],
  },
  {
    id: 2,
    name: "John Cruz",
    gender: "Male",
    age: 31,
    phone: "09184561234",
    visitDate: "2026-02-08",
    email: "johncruz@email.com",
    birthday: "1994-03-21",
    address: "General Trias, Cavite",
    branch: "General Trias",
    status: "Inactive",
    service: "Teeth Cleaning",
    procedures: [
      {
        name: "Dental Consultation",
        date: "2026-02-08",
        time: "11:00 AM",
        doctor: "Dr. Nicole Hernandez",
        status: "Completed",
      },
      {
        name: "Teeth Cleaning",
        date: "2026-02-22",
        time: "02:00 PM",
        doctor: "Dr. Samantha Hernandez",
        status: "Scheduled",
      },
    ],
  },
  {
    id: 3,
    name: "Angela Reyes",
    gender: "Female",
    age: 28,
    phone: "09981234567",
    visitDate: "2026-02-10",
    email: "angelareyes@email.com",
    birthday: "1997-11-02",
    address: "General Trias, Cavite",
    branch: "General Trias",
    status: "Active",
    service: "Tooth Extraction",
    procedures: [
      {
        name: "X-Ray",
        date: "2026-02-10",
        time: "08:45 AM",
        doctor: "Dr. Miguel Reyes",
        status: "Completed",
      },
      {
        name: "Tooth Extraction",
        date: "2026-02-10",
        time: "09:30 AM",
        doctor: "Dr. Miguel Reyes",
        status: "Completed",
      },
    ],
  },
  {
    id: 4,
    name: "Michael Santos",
    gender: "Male",
    age: 36,
    phone: "09235551234",
    visitDate: "2026-02-11",
    email: "michaelsantos@email.com",
    birthday: "1990-01-15",
    address: "Dasmarinas, Cavite",
    branch: "Dasmarinas",
    status: "Active",
    service: "Braces Adjustment",
    procedures: [
      {
        name: "Braces Adjustment",
        date: "2026-02-11",
        time: "03:00 PM",
        doctor: "Dr. Andrea Santos",
        status: "Scheduled",
      },
    ],
  },
  {
    id: 5,
    name: "Bea Flores",
    gender: "Female",
    age: 22,
    phone: "09354441234",
    visitDate: "2026-02-12",
    email: "beaflores@email.com",
    birthday: "2003-06-30",
    address: "General Trias, Cavite",
    branch: "General Trias",
    status: "Active",
    service: "Dental Filling",
    procedures: [
      {
        name: "Dental Consultation",
        date: "2026-02-12",
        time: "01:00 PM",
        doctor: "Dr. Nicole Hernandez",
        status: "Completed",
      },
      {
        name: "Dental Filling",
        date: "2026-02-14",
        time: "09:00 AM",
        doctor: "Dr. Carla Mendoza",
        status: "Completed",
      },
    ],
  },
  {
    id: 6,
    name: "Carlo Mendoza",
    gender: "Male",
    age: 40,
    phone: "09175552345",
    visitDate: "2026-02-14",
    email: "carlomendoza@email.com",
    birthday: "1986-09-04",
    address: "General Trias, Cavite",
    branch: "General Trias",
    status: "Inactive",
    service: "Root Canal",
    procedures: [
      {
        name: "Dental Consultation",
        date: "2026-02-14",
        time: "10:30 AM",
        doctor: "Dr. Miguel Reyes",
        status: "Completed",
      },
      {
        name: "Root Canal",
        date: "2026-02-18",
        time: "01:00 PM",
        doctor: "Dr. Miguel Reyes",
        status: "Ongoing",
      },
      {
        name: "Post Treatment Check-up",
        date: "2026-02-25",
        time: "11:00 AM",
        doctor: "Dr. Miguel Reyes",
        status: "Follow-up",
      },
    ],
  },
  {
    id: 7,
    name: "Nicole Ramos",
    gender: "Female",
    age: 29,
    phone: "09192223334",
    visitDate: "2026-02-16",
    email: "nicoleramos@email.com",
    birthday: "1996-07-18",
    address: "Bacoor, Cavite",
    branch: "Bacoor",
    status: "Active",
    service: "Teeth Whitening",
    procedures: [
      {
        name: "Teeth Whitening",
        date: "2026-02-16",
        time: "10:00 AM",
        doctor: "Dr. Angela Santos",
        status: "Completed",
      },
    ],
  },
  {
    id: 8,
    name: "Daniel Garcia",
    gender: "Male",
    age: 34,
    phone: "09261112223",
    visitDate: "2026-02-18",
    email: "danielgarcia@email.com",
    birthday: "1992-04-27",
    address: "Dasmarinas, Cavite",
    branch: "Dasmarinas",
    status: "Inactive",
    service: "Dental Cleaning",
    procedures: [
      {
        name: "Dental Cleaning",
        date: "2026-02-18",
        time: "01:30 PM",
        doctor: "Dr. Andrea Santos",
        status: "Completed",
      },
    ],
  },
];

const initialNotifications = [
  {
    id: 1,
    title: "Patient Record Updated",
    message: "A patient record was recently updated.",
    time: "5 mins ago",
  },
  {
    id: 2,
    title: "New Visit Logged",
    message: "A new patient visit was recorded today.",
    time: "18 mins ago",
  },
];

function formatDate(dateString) {
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
            {patient.name.charAt(0).toUpperCase()}
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
  const [notifications, setNotifications] = useState(initialNotifications);
  const [patients] = useState(initialPatients);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("All Branches");
  const [selectedPatient, setSelectedPatient] = useState(null);

  const filteredPatients = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return patients.filter((patient) => {
      const matchesBranch =
        selectedBranch === "All Branches" || patient.branch === selectedBranch;

      const matchesSearch =
        !keyword ||
        patient.name.toLowerCase().includes(keyword) ||
        patient.gender.toLowerCase().includes(keyword) ||
        patient.phone.toLowerCase().includes(keyword) ||
        patient.status.toLowerCase().includes(keyword) ||
        patient.branch.toLowerCase().includes(keyword);

      return matchesBranch && matchesSearch;
    });
  }, [patients, searchTerm, selectedBranch]);

  const activeCount = filteredPatients.filter(
    (patient) => patient.status === "Active"
  ).length;

  const inactiveCount = filteredPatients.filter(
    (patient) => patient.status === "Inactive"
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