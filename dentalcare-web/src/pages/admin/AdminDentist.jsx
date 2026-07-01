import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/admin/layout/AdminSidebar";
import AdminTopbar from "../../components/admin/layout/AdminTopbar";
import AuthService from "../../services/authService";
import {
  getAdminDentists,
  getAdminProfile,
  setDentistLeave,
  cancelDentistLeave,
  getDentistLeaves,
  checkLeaveConflict,
} from "../../services/adminService";

import "../../styles/admin/dentist/admin-dentist.css";
import "../../styles/admin/dashboard/admin-layout.css";
import "../../styles/admin/layout/admin-sidebar.css";
import "../../styles/admin/layout/admin-topbar.css";
import "../../styles/admin/notifications/admin-notification-popup.css";
import "../../styles/admin/shared/admin-responsive.css";

const defaultAssignedBranch = "General Trias";

// Helper function to check if dentist is currently on leave
function getDentistOnLeaveInfo(dentist) {
  if (!dentist.leave || !Array.isArray(dentist.leave) || dentist.leave.length === 0) {
    return { isOnLeave: false, leaveData: null };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const leave of dentist.leave) {
    const startDate = new Date(leave.start_date);
    const endDate = new Date(leave.end_date);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    if (today >= startDate && today <= endDate) {
      return { isOnLeave: true, leaveData: leave };
    }
  }

  return { isOnLeave: false, leaveData: null };
}

function calculateLeaveDuration(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  return days;
}

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
  if (!dateString) return "N/A";

  const date = new Date(dateString);

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function DentistDetailsModal({ dentist, onClose, adminAssignedBranch, onSetLeave }) {
  if (!dentist) return null;

  const { isOnLeave, leaveData } = getDentistOnLeaveInfo(dentist);
  const displayStatus = isOnLeave ? "On Leave" : dentist.status;

  return (
    <div className="dentist-details-overlay" onClick={onClose}>
      <div className="dentist-details-modal" onClick={(e) => e.stopPropagation()}>
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
              className={`dentist-badge ${displayStatus
                .toLowerCase()
                .replace(/\s+/g, "-")}`}
            >
              {displayStatus}
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
              <strong>{displayStatus}</strong>
            </div>

            {isOnLeave && leaveData ? (
              <>
                <div className="dentist-info-row">
                  <span>Leave Date</span>
                  <strong>
                    {formatDate(leaveData.start_date)} - {formatDate(leaveData.end_date)}
                  </strong>
                </div>

                <div className="dentist-info-row">
                  <span>Duration</span>
                  <strong>
                    {calculateLeaveDuration(leaveData.start_date, leaveData.end_date)} days
                  </strong>
                </div>
              </>
            ) : (
              <>
                <div className="dentist-info-row">
                  <span>Assigned Branch View</span>
                  <strong>{dentist.currentBranchToday || adminAssignedBranch}</strong>
                </div>

                <div className="dentist-info-row">
                  <span>Today's Schedule</span>
                  <strong>{dentist.currentScheduleToday || "No Schedule Today"}</strong>
                </div>
              </>
            )}
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

function DentistLeaveModal({
  dentist,
  leaveForm,
  setLeaveForm,
  onClose,
  onSubmit,
  isSubmitting,
  errorMessage,
}) {
  if (!dentist) return null;

  return (
    <div className="dentist-details-overlay" onClick={onClose}>
      <div className="dentist-leave-modal" onClick={(e) => e.stopPropagation()}>
        <button className="dentist-details-close" onClick={onClose}>
          ×
        </button>

        <h2>Set Dentist Leave</h2>

        <p className="leave-modal-subtitle">
          Set leave schedule for <strong>{dentist.name}</strong>.
        </p>

        {errorMessage && (
          <div className="leave-error-message">{errorMessage}</div>
        )}

        <div className="leave-form-grid">
          <div className="leave-field">
            <label>Start Date</label>
            <input
              type="date"
              value={leaveForm.startDate}
              onChange={(e) =>
                setLeaveForm((prev) => ({
                  ...prev,
                  startDate: e.target.value,
                }))
              }
            />
          </div>

          <div className="leave-field">
            <label>End Date</label>
            <input
              type="date"
              value={leaveForm.endDate}
              onChange={(e) =>
                setLeaveForm((prev) => ({
                  ...prev,
                  endDate: e.target.value,
                }))
              }
            />
          </div>

          <div className="leave-field full">
            <label>Reason</label>
            <textarea
              rows="5"
              placeholder="Enter reason for leave..."
              value={leaveForm.reason}
              onChange={(e) =>
                setLeaveForm((prev) => ({
                  ...prev,
                  reason: e.target.value,
                }))
              }
            />
          </div>
        </div>

        <div className="leave-modal-actions">
          <button
            className="leave-cancel-btn"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button
            className="leave-submit-btn"
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Leave"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDentist() {
  const currentUser = AuthService.getCurrentUser() || {};

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDentist, setSelectedDentist] = useState(null);
  const [selectedLeaveDentist, setSelectedLeaveDentist] = useState(null);

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);

  const [dentists, setDentists] = useState([]);
  const [adminAssignedBranch, setAdminAssignedBranch] = useState(defaultAssignedBranch);

  const [leaveForm, setLeaveForm] = useState({
    startDate: "",
    endDate: "",
    reason: "",
  });

  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  const [leaveErrorMessage, setLeaveErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      const [dentistsResult, profileResult] = await Promise.all([
        getAdminDentists(),
        getAdminProfile(),
      ]);

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
            String(schedule.branch || "")
              .toLowerCase()
              .includes(String(adminAssignedBranch).toLowerCase())
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

  const handleOpenLeaveModal = (dentist) => {
    setSelectedLeaveDentist(dentist);
    const { isOnLeave, leaveData } = getDentistOnLeaveInfo(dentist);

    setLeaveForm({
      startDate: isOnLeave && leaveData ? leaveData.start_date : "",
      endDate: isOnLeave && leaveData ? leaveData.end_date : "",
      reason: isOnLeave && leaveData ? leaveData.reason : "",
    });

    setLeaveErrorMessage("");
  };

  const handleSubmitLeave = async () => {
    setLeaveErrorMessage("");

    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason.trim()) {
      setLeaveErrorMessage("Please complete the leave date range and reason.");
      return;
    }

    if (new Date(leaveForm.endDate) < new Date(leaveForm.startDate)) {
      setLeaveErrorMessage("End date cannot be earlier than start date.");
      return;
    }

    setIsSubmittingLeave(true);

    try {
      // Check for conflicts
      const conflictCheck = await checkLeaveConflict(
        selectedLeaveDentist.id,
        leaveForm.startDate,
        leaveForm.endDate
      );

      if (!conflictCheck.success) {
        setLeaveErrorMessage(conflictCheck.message || "Failed to set leave");
        setIsSubmittingLeave(false);
        return;
      }

      // Set the leave
      const result = await setDentistLeave(
        selectedLeaveDentist.id,
        leaveForm.startDate,
        leaveForm.endDate,
        leaveForm.reason
      );

      if (result.success) {
        // Reload dentists to get updated leave info
        const dentistsResult = await getAdminDentists();
        if (dentistsResult.success && Array.isArray(dentistsResult.data)) {
          setDentists(dentistsResult.data);

          // Update selected dentist if it's the same one
          if (selectedDentist?.id === selectedLeaveDentist.id) {
            const updated = dentistsResult.data.find(
              (d) => d.id === selectedDentist.id
            );
            if (updated) {
              setSelectedDentist(updated);
            }
          }
        }

        setSelectedLeaveDentist(null);
        setLeaveForm({ startDate: "", endDate: "", reason: "" });
      } else {
        setLeaveErrorMessage(result.message || "Failed to set leave");
      }
    } catch (error) {
      console.error("Error submitting leave:", error);
      setLeaveErrorMessage("An error occurred. Please try again.");
    } finally {
      setIsSubmittingLeave(false);
    }
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
                      const { isOnLeave, leaveData } = getDentistOnLeaveInfo(dentist);
                      const displayStatus = isOnLeave ? "On Leave" : dentist.status;
                      const visibleBranch =
                        dentist.currentBranchToday || adminAssignedBranch;

                      return (
                        <tr key={dentist.id}>
                          <td>{dentist.name}</td>
                          <td>{dentist.specialty}</td>
                          <td>{visibleBranch}</td>
                          <td>{dentist.phone}</td>
                          <td>
                            <span
                              className={`dentist-badge ${displayStatus
                                .toLowerCase()
                                .replace(/\s+/g, "-")}`}
                            >
                              {displayStatus}
                            </span>
                          </td>

                          <td>
                            <div className="dentist-action-buttons">
                              <button
                                className="dentist-view-btn"
                                onClick={() => setSelectedDentist(dentist)}
                              >
                                View Details
                              </button>

                              <button
                                className="dentist-leave-btn"
                                onClick={() => handleOpenLeaveModal(dentist)}
                              >
                                {isOnLeave ? "Update Leave" : "Set Leave"}
                              </button>
                            </div>
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
        onSetLeave={handleOpenLeaveModal}
      />

      <DentistLeaveModal
        dentist={selectedLeaveDentist}
        leaveForm={leaveForm}
        setLeaveForm={setLeaveForm}
        onClose={() => setSelectedLeaveDentist(null)}
        onSubmit={handleSubmitLeave}
        isSubmitting={isSubmittingLeave}
        errorMessage={leaveErrorMessage}
      />
    </div>
  );
}