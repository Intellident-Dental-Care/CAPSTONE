import { useMemo, useState } from "react";
import AdminSidebar from "../../components/admin/layout/AdminSidebar";
import AdminTopbar from "../../components/admin/layout/AdminTopbar";

import "../../styles/admin/patient/admin-patient.css";
import "../../styles/admin/dashboard/admin-layout.css";
import "../../styles/admin/layout/admin-sidebar.css";
import "../../styles/admin/layout/admin-topbar.css";
import "../../styles/admin/notifications/admin-notification-popup.css";
import "../../styles/admin/shared/admin-responsive.css";

const adminAssignedBranch = "General Trias";

const patientData = [
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
    status: "Completed",
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
      {
        name: "Dental Filling",
        date: "2026-02-19",
        time: "01:30 PM",
        doctor: "Dr. Angela Santos",
        status: "Follow-up",
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
    status: "Scheduled",
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
    status: "Completed",
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
    address: "Dasmariñas, Cavite",
    branch: "Dasmariñas",
    status: "Scheduled",
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
    status: "Completed",
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
    status: "Follow-up",
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
];

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
                  <div className="patient-procedure-item" key={index}>
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

  const filteredPatients = useMemo(() => {
    return patientData
      .filter((patient) => patient.branch === adminAssignedBranch)
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
  }, [searchTerm]);

  const totalPatients = filteredPatients.length;
  const completedPatients = filteredPatients.filter(
    (patient) => patient.status === "Completed"
  ).length;

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
                        <td>{patient.name}</td>
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