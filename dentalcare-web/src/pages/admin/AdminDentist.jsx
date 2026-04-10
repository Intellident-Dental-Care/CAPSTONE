import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import AdminSidebar from "../../components/admin/layout/AdminSidebar";
import AdminTopbar from "../../components/admin/layout/AdminTopbar";
import AuthService from "../../services/authService";
import { getAdminDentists, getAdminProfile } from "../../services/adminService";

import "../../styles/admin/dentist/admin-dentist.css";
import "../../styles/admin/dashboard/admin-layout.css";
import "../../styles/admin/layout/admin-sidebar.css";
import "../../styles/admin/layout/admin-topbar.css";
import "../../styles/admin/notifications/admin-notification-popup.css";
import "../../styles/admin/shared/admin-responsive.css";

const defaultAssignedBranch = "General Trias";

const dentistData = [
  {
    id: 1,
    name: "Dr. Nicole Hernandez",
    specialty: "Prosthodontics",
    birthday: "1990-04-12",
    sex: "Female",
    phone: "09123456789",
    email: "nicolehernandez@gcdentalcare.com",
    status: "Available",
    schedules: [
      { branch: "General Trias", days: "Mon - Wed", time: "9:00 AM - 3:00 PM" },
      { branch: "Dasmariñas", days: "Thu - Fri", time: "10:00 AM - 5:00 PM" },
    ],
  },
  {
    id: 2,
    name: "Dr. Andrea Santos",
    specialty: "Orthodontics",
    birthday: "1988-09-21",
    sex: "Female",
    phone: "09176543210",
    email: "andreasantos@gcdentalcare.com",
    status: "On Duty",
    schedules: [
      { branch: "General Trias", days: "Tue - Thu", time: "1:00 PM - 6:00 PM" },
      { branch: "Imus", days: "Sat", time: "9:00 AM - 2:00 PM" },
    ],
  },
  {
    id: 3,
    name: "Dr. Miguel Reyes",
    specialty: "Endodontics",
    birthday: "1987-01-18",
    sex: "Male",
    phone: "09981234567",
    email: "miguelreyes@gcdentalcare.com",
    status: "Available",
    schedules: [{ branch: "Imus", days: "Mon - Fri", time: "8:00 AM - 4:00 PM" }],
  },
  {
    id: 4,
    name: "Dr. Carla Mendoza",
    specialty: "Pediatric Dentistry",
    birthday: "1992-11-05",
    sex: "Female",
    phone: "09234567891",
    email: "carlamendoza@gcdentalcare.com",
    status: "Leave",
    schedules: [
      { branch: "General Trias", days: "Fri - Sat", time: "9:00 AM - 1:00 PM" },
      { branch: "Bacoor", days: "Mon - Tue", time: "10:00 AM - 4:00 PM" },
    ],
  },
  {
    id: 5,
    name: "Dr. Samantha Hernandez",
    specialty: "Prosthodontics",
    birthday: "1991-07-14",
    sex: "Female",
    phone: "09123456780",
    email: "samanthahernandez@gcdentalcare.com",
    status: "Available",
    schedules: [{ branch: "General Trias", days: "Mon - Fri", time: "8:00 AM - 2:00 PM" }],
  },
  {
    id: 6,
    name: "Dr. Angela Santos",
    specialty: "Orthodontics",
    birthday: "1989-03-09",
    sex: "Female",
    phone: "09176543211",
    email: "angelasantos@gcdentalcare.com",
    status: "On Duty",
    schedules: [
      { branch: "General Trias", days: "Wed - Sat", time: "11:00 AM - 6:00 PM" },
      { branch: "Dasmariñas", days: "Mon", time: "9:00 AM - 1:00 PM" },
    ],
  },
  {
    id: 7,
    name: "Dr. Mark Villanueva",
    specialty: "General Dentistry",
    birthday: "1993-01-27",
    sex: "Male",
    phone: "09261234567",
    email: "markvillanueva@gcdentalcare.com",
    status: "Available",
    schedules: [{ branch: "General Trias", days: "Tue - Sun", time: "10:00 AM - 4:00 PM" }],
  },
  {
    id: 8,
    name: "Dr. Bea Flores",
    specialty: "Periodontics",
    birthday: "1990-12-03",
    sex: "Female",
    phone: "09351234567",
    email: "beaflores@gcdentalcare.com",
    status: "Available",
    schedules: [
      { branch: "General Trias", days: "Mon - Thu", time: "9:00 AM - 3:00 PM" },
      { branch: "Bacoor", days: "Fri", time: "1:00 PM - 5:00 PM" },
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
    title: "Schedule Updated",
    message: "A dentist schedule was updated for General Trias.",
    time: "1 hour ago",
  },
];

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function DentistDetailsModal({ dentist, onClose, adminAssignedBranch }) {
  if (!dentist) return null;

  return (
    <div className="dentist-details-overlay" onClick={onClose}>
      <div
        className="dentist-details-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="dentist-details-close" onClick={onClose}>
          ×
        </button>

        <div className="dentist-details-header">
          <div className="dentist-details-avatar">
            {dentist.name.replace("Dr. ", "").charAt(0).toUpperCase()}
          </div>

          <div className="dentist-details-header-text">
            <h2>{dentist.name}</h2>
            <p>{dentist.specialty}</p>
            <span
              className={`dentist-badge ${dentist.status
                .toLowerCase()
                .replace(/\s+/g, "-")}`}
            >
              {dentist.status}
            </span>
          </div>
        </div>

        <div className="dentist-details-grid">
          <div className="dentist-info-card">
            <h4>Personal Information</h4>

            <div className="dentist-info-row">
              <span>Full Name</span>
              <strong>{dentist.name}</strong>
            </div>

            <div className="dentist-info-row">
              <span>Birthday</span>
              <strong>{formatDate(dentist.birthday)}</strong>
            </div>

            <div className="dentist-info-row">
              <span>Sex</span>
              <strong>{dentist.sex}</strong>
            </div>

            <div className="dentist-info-row">
              <span>Phone Number</span>
              <strong>{dentist.phone}</strong>
            </div>

            <div className="dentist-info-row">
              <span>Email Address</span>
              <strong>{dentist.email}</strong>
            </div>
          </div>

          <div className="dentist-info-card">
            <h4>Professional Information</h4>

            <div className="dentist-info-row">
              <span>Specialty</span>
              <strong>{dentist.specialty}</strong>
            </div>

            <div className="dentist-info-row">
              <span>Status</span>
              <strong>{dentist.status}</strong>
            </div>

            <div className="dentist-info-row">
              <span>Assigned Branch View</span>
              <strong>{dentist.currentBranchToday || adminAssignedBranch}</strong>
            </div>

            <div className="dentist-info-row">
              <span>Today's Schedule</span>
              <strong>{dentist.currentScheduleToday || "No Schedule Today"}</strong>
            </div>
          </div>

          <div className="dentist-info-card dentist-schedule-card">
            <h4>Schedule in All Branches</h4>

            <div className="dentist-schedule-list">
              {dentist.schedules.map((schedule, index) => (
                <div className="dentist-schedule-item" key={index}>
                  <div className="dentist-schedule-top">
                    <strong>{schedule.branch}</strong>
                  </div>
                  <p>{schedule.days}</p>
                  <span>{schedule.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDentist() {
  const currentUser = AuthService.getCurrentUser() || {};
  const isSuperAdmin = (currentUser?.admin_type || currentUser?.adminType) === "super_admin";

  if (!isSuperAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDentist, setSelectedDentist] = useState(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [dentists, setDentists] = useState([]);
  const [adminAssignedBranch, setAdminAssignedBranch] = useState(defaultAssignedBranch);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const [dentistsResult, profileResult] = await Promise.all([getAdminDentists(), getAdminProfile()]);

      if (active && dentistsResult?.success && Array.isArray(dentistsResult.data)) {
        setDentists(dentistsResult.data);
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

  const filteredDentists = useMemo(() => {
    return dentists
      .filter((dentist) =>
        dentist.schedules.some(
          (schedule) =>
            !adminAssignedBranch ||
            schedule.branch === adminAssignedBranch ||
            String(schedule.branch || "").toLowerCase().includes(String(adminAssignedBranch).toLowerCase())
        )
      )
      .filter((dentist) => {
        const search = searchTerm.toLowerCase();

        return (
          dentist.name.toLowerCase().includes(search) ||
          dentist.specialty.toLowerCase().includes(search) ||
          dentist.status.toLowerCase().includes(search) ||
          dentist.phone.toLowerCase().includes(search)
        );
      });
  }, [adminAssignedBranch, dentists, searchTerm]);

  const totalDentists = filteredDentists.length;
  const activeDentists = filteredDentists.filter(
    (dentist) => dentist.status === "Available" || dentist.status === "On Duty"
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
    <div className="admin-dentist-page">
      <AdminSidebar />

      <div className="admin-dentist-main">
        <AdminTopbar
          title="Dentist"
          notifications={notifications}
          isNotificationOpen={isNotificationOpen}
          onToggleNotifications={handleToggleNotifications}
          onCloseNotifications={handleCloseNotifications}
          onMarkAllRead={handleMarkAllRead}
        />

        <div className="admin-dentist-content">
          <div className="admin-dentist-heading">
            <div>
              <h1>Dentists</h1>
              <p>
                Manage and view dentist records assigned to {adminAssignedBranch}.
              </p>
            </div>
          </div>

          <div className="admin-dentist-stats">
            <div className="dentist-stat-card">
              <span>Total Dentists</span>
              <h3>{totalDentists}</h3>
            </div>

            <div className="dentist-stat-card">
              <span>Active Dentists</span>
              <h3>{activeDentists}</h3>
            </div>

            <div className="dentist-stat-card">
              <span>Assigned Branch</span>
              <h3 className="branch-name-card">{adminAssignedBranch}</h3>
            </div>
          </div>

          <div className="admin-dentist-table-card">
            <div className="admin-dentist-table-top">
              <div>
                <h3>Dentist List</h3>
                <p>{filteredDentists.length} dentist(s) found</p>
              </div>

              <div className="admin-dentist-search">
                <input
                  type="text"
                  placeholder="Search dentist, specialty, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="admin-dentist-table-wrapper">
              <table className="admin-dentist-table">
                <thead>
                  <tr>
                    <th>Dentist Name</th>
                    <th>Specialty</th>
                    <th>Branch</th>
                    <th>Phone Number</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredDentists.length > 0 ? (
                    filteredDentists.map((dentist) => {
                      const visibleBranch = dentist.currentBranchToday || adminAssignedBranch;

                      return (
                        <tr key={dentist.id}>
                          <td>{dentist.name}</td>
                          <td>{dentist.specialty}</td>
                          <td>{visibleBranch}</td>
                          <td>{dentist.phone}</td>
                          <td>
                            <span
                              className={`dentist-badge ${dentist.status
                                .toLowerCase()
                                .replace(/\s+/g, "-")}`}
                            >
                              {dentist.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="dentist-view-btn"
                              onClick={() => setSelectedDentist(dentist)}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="dentist-empty-state">
                        No dentists found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <DentistDetailsModal
        dentist={selectedDentist}
        onClose={() => setSelectedDentist(null)}
        adminAssignedBranch={adminAssignedBranch}
      />
    </div>
  );
}