import React, { useMemo, useState } from "react";
import AdminSidebar from "../../components/admin/layout/AdminSidebar";
import AdminTopbar from "../../components/admin/layout/AdminTopbar";
import "../../styles/admin/appointments/admin-appointments.css";
import "../../styles/admin/dashboard/admin-layout.css";
import "../../styles/admin/layout/admin-sidebar.css";
import "../../styles/admin/layout/admin-topbar.css";
import "../../styles/admin/notifications/admin-notification-popup.css";
import "../../styles/admin/shared/admin-responsive.css";

const initialAppointments = [
  {
    id: 1,
    patientName: "Riko Tanaka Suzuki",
    gender: "Male",
    age: 25,
    dentist: "Dr. Dian Crizzie Mendoza",
    branch: "GC Dental Care | Dasmariñas",
    treatment: "Wisdom Tooth Removal",
    date: "2026-02-19",
    time: "09:30 AM - 10:30 AM",
    type: "Online",
    status: "Completed",
    notes: "Patient arrived on time.",
  },
  {
    id: 2,
    patientName: "Alden Cruz",
    gender: "Male",
    age: 25,
    dentist: "Dr. Andrea Lopez",
    branch: "GC Dental Care | GenTri",
    treatment: "Dental Consultation",
    date: "2026-02-19",
    time: "10:30 AM - 11:30 AM",
    type: "Walk-in",
    status: "Completed",
    notes: "Initial consultation.",
  },
  {
    id: 3,
    patientName: "Sunshine Velasquez",
    gender: "Female",
    age: 29,
    dentist: "Dr. Dian Crizzie Mendoza",
    branch: "GC Dental Care | Dasmariñas",
    treatment: "Cleaning",
    date: "2026-02-19",
    time: "11:30 AM - 12:30 PM",
    type: "Online",
    status: "In Queue",
    notes: "Waiting for turn.",
  },
  {
    id: 4,
    patientName: "Alex Rivera",
    gender: "Male",
    age: 24,
    dentist: "Dr. Angela Santos",
    branch: "GC Dental Care | Imus",
    treatment: "Post & Core for RCT",
    date: "2026-02-19",
    time: "01:30 PM - 02:30 PM",
    type: "Online",
    status: "In Queue",
    notes: "Follow-up appointment.",
  },
  {
    id: 5,
    patientName: "Mark Delos Reyes",
    gender: "Male",
    age: 30,
    dentist: "Dr. Andrea Lopez",
    branch: "GC Dental Care | Dasmariñas",
    treatment: "TMJ Consultation",
    date: "2026-02-20",
    time: "09:30 AM - 10:30 AM",
    type: "Online",
    status: "Waiting",
    notes: "Needs x-ray review.",
  },
  {
    id: 6,
    patientName: "Paula Gomez",
    gender: "Female",
    age: 28,
    dentist: "Dr. Angela Santos",
    branch: "GC Dental Care | GenTri",
    treatment: "Tooth Restoration",
    date: "2026-02-21",
    time: "09:30 AM - 10:30 AM",
    type: "Online",
    status: "Waiting",
    notes: "Needs tooth shade matching.",
  },
  {
    id: 7,
    patientName: "Leah Torres",
    gender: "Female",
    age: 41,
    dentist: "Dr. Dian Crizzie Mendoza",
    branch: "GC Dental Care | Dasmariñas",
    treatment: "Tooth Extraction",
    date: "2026-02-21",
    time: "10:30 AM - 11:30 AM",
    type: "Walk-in",
    status: "Waiting",
    notes: "Sensitive to anesthesia.",
  },
  {
    id: 8,
    patientName: "Chris Brown",
    gender: "Male",
    age: 25,
    dentist: "Dr. Andrea Lopez",
    branch: "GC Dental Care | Imus",
    treatment: "Teeth Whitening",
    date: "2026-02-22",
    time: "09:30 AM - 10:30 AM",
    type: "Online",
    status: "Cancelled",
    notes: "Cancelled by patient.",
  },
  {
    id: 9,
    patientName: "John Lee",
    gender: "Male",
    age: 25,
    dentist: "Dr. Angela Santos",
    branch: "GC Dental Care | Dasmariñas",
    treatment: "Wisdom Tooth Removal",
    date: "2026-02-23",
    time: "10:30 AM - 11:30 AM",
    type: "Online",
    status: "Cancelled",
    notes: "Patient unavailable.",
  },
];

const patientOptions = [
  { id: 1, name: "Riko Tanaka Suzuki", gender: "Male", age: 25, phone: "09123456781" },
  { id: 2, name: "Alden Cruz", gender: "Male", age: 25, phone: "09123456782" },
  { id: 3, name: "Sunshine Velasquez", gender: "Female", age: 29, phone: "09123456783" },
  { id: 4, name: "Alex Rivera", gender: "Male", age: 24, phone: "09123456784" },
  { id: 5, name: "Mark Delos Reyes", gender: "Male", age: 30, phone: "09123456785" },
  { id: 6, name: "Paula Gomez", gender: "Female", age: 28, phone: "09123456786" },
  { id: 7, name: "Leah Torres", gender: "Female", age: 41, phone: "09123456787" },
  { id: 8, name: "John Lee", gender: "Male", age: 25, phone: "09123456788" },
];

const branchOptions = [
  "GC Dental Care | Dasmariñas",
  "GC Dental Care | GenTri",
  "GC Dental Care | Imus",
];

const doctorOptions = [
  {
    id: 1,
    name: "Dr. Dian Crizzie Mendoza",
    specialty: "Orthodontics",
    branch: "GC Dental Care | Dasmariñas",
  },
  {
    id: 2,
    name: "Dr. Andrea Lopez",
    specialty: "General Dentistry",
    branch: "GC Dental Care | GenTri",
  },
  {
    id: 3,
    name: "Dr. Angela Santos",
    specialty: "Endodontics",
    branch: "GC Dental Care | Imus",
  },
  {
    id: 4,
    name: "Dr. Carlo Reyes",
    specialty: "Oral Surgery",
    branch: "GC Dental Care | Dasmariñas",
  },
];

const serviceOptions = [
  "Dental Consultation",
  "Cleaning",
  "Tooth Extraction",
  "Teeth Whitening",
  "Tooth Restoration",
  "Wisdom Tooth Removal",
  "TMJ Consultation",
  "Post & Core for RCT",
];

const walkInTimeOptions = [
  "09:00 AM",
  "09:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "01:00 PM",
  "01:30 PM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
];

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function formatLongDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function isWithinRange(date, startDate, endDate) {
  const current = new Date(date);
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (start && current < start) return false;
  if (end && current > end) return false;
  return true;
}

function toAppointmentRange(time) {
  return `${time} - ${time}`;
}

export default function AdminAppointments() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New Appointment Requests:",
      message: "3 new walk-in requests need confirmation",
      time: "2 mins ago",
    },
    {
      id: 2,
      title: "Queue Update:",
      message: "2 patients were moved to in queue",
      time: "8 mins ago",
    },
    {
      id: 3,
      title: "Appointments Reminder:",
      message: "5 appointments are scheduled for today",
      time: "12 mins ago",
    },
  ]);

  const [appointments, setAppointments] = useState(initialAppointments);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [branchFilter, setBranchFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [selectedIds, setSelectedIds] = useState([]);

  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInStep, setWalkInStep] = useState(1);
  const [patientQuery, setPatientQuery] = useState("");
  const [showPatientSuggestions, setShowPatientSuggestions] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const [walkInForm, setWalkInForm] = useState({
    patientName: "",
    patientId: null,
    gender: "",
    age: "",
    phone: "",
    dentist: "",
    branch: "",
    treatment: "",
    date: today,
    time: "",
    notes: "",
  });

  const branches = useMemo(() => {
    const uniqueBranches = [...new Set(appointments.map((item) => item.branch))];
    return ["All", ...uniqueBranches];
  }, [appointments]);

  const patientSuggestions = useMemo(() => {
    if (!patientQuery.trim()) return [];
    return patientOptions.filter((patient) =>
      patient.name.toLowerCase().includes(patientQuery.toLowerCase())
    );
  }, [patientQuery]);

  const filteredDoctors = useMemo(() => {
    if (!walkInForm.branch) return [];
    return doctorOptions.filter((doctor) => doctor.branch === walkInForm.branch);
  }, [walkInForm.branch]);

  const selectedDoctorDetails = useMemo(() => {
    return doctorOptions.find((doctor) => doctor.name === walkInForm.dentist) || null;
  }, [walkInForm.dentist]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const matchesSearch =
        appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.dentist.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.treatment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.branch.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || appointment.status === statusFilter;

      const matchesBranch =
        branchFilter === "All" || appointment.branch === branchFilter;

      const matchesDateRange = isWithinRange(
        appointment.date,
        startDate,
        endDate
      );

      return matchesSearch && matchesStatus && matchesBranch && matchesDateRange;
    });
  }, [appointments, searchTerm, statusFilter, branchFilter, startDate, endDate]);

  const summary = useMemo(() => {
    return {
      total: filteredAppointments.length,
      waiting: filteredAppointments.filter((a) => a.status === "Waiting").length,
      queue: filteredAppointments.filter((a) => a.status === "In Queue").length,
      completed: filteredAppointments.filter((a) => a.status === "Completed").length,
      cancelled: filteredAppointments.filter((a) => a.status === "Cancelled").length,
    };
  }, [filteredAppointments]);

  const selectableAppointments = useMemo(() => {
    return filteredAppointments.filter(
      (item) => item.status !== "Cancelled" && item.status !== "Completed"
    );
  }, [filteredAppointments]);

  const allSelectableSelected =
    selectableAppointments.length > 0 &&
    selectableAppointments.every((item) => selectedIds.includes(item.id));

  const handleToggleNotifications = () => {
    setIsNotificationOpen((prev) => !prev);
  };

  const handleCloseNotifications = () => {
    setIsNotificationOpen(false);
  };

  const handleMarkAllRead = () => {
    setNotifications([]);
    setIsNotificationOpen(false);
  };

  const handleOpenCancelModal = (appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };

  const handleCloseCancelModal = () => {
    setSelectedAppointment(null);
    setShowCancelModal(false);
  };

  const handleConfirmCancel = () => {
    if (!selectedAppointment) return;

    setAppointments((prev) =>
      prev.map((appointment) =>
        appointment.id === selectedAppointment.id
          ? { ...appointment, status: "Cancelled", notes: "Cancelled by admin." }
          : appointment
      )
    );

    setNotifications((prev) => [
      {
        id: Date.now(),
        title: "Appointment Cancelled:",
        message: `${selectedAppointment.patientName}'s appointment was cancelled`,
        time: "Just now",
      },
      ...prev,
    ]);

    setSelectedIds((prev) => prev.filter((id) => id !== selectedAppointment.id));

    handleCloseCancelModal();
  };

  const handleToggleRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (allSelectableSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectableAppointments.map((item) => item.id));
    }
  };

  const handleBulkStatusChange = (newStatus) => {
    if (selectedIds.length === 0) return;

    setAppointments((prev) =>
      prev.map((appointment) =>
        selectedIds.includes(appointment.id)
          ? {
              ...appointment,
              status: newStatus,
              notes:
                newStatus === "Cancelled"
                  ? "Cancelled by admin."
                  : appointment.notes,
            }
          : appointment
      )
    );

    setNotifications((prev) => [
      {
        id: Date.now(),
        title: "Bulk Update:",
        message: `${selectedIds.length} appointment(s) marked as ${newStatus}`,
        time: "Just now",
      },
      ...prev,
    ]);

    setSelectedIds([]);
  };

  const resetWalkInModal = () => {
    setShowWalkInModal(false);
    setWalkInStep(1);
    setPatientQuery("");
    setShowPatientSuggestions(false);
    setWalkInForm({
      patientName: "",
      patientId: null,
      gender: "",
      age: "",
      phone: "",
      dentist: "",
      branch: "",
      treatment: "",
      date: today,
      time: "",
      notes: "",
    });
  };

  const handleWalkInInputChange = (field, value) => {
    setWalkInForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSelectPatient = (patient) => {
    setPatientQuery(patient.name);
    setShowPatientSuggestions(false);

    setWalkInForm((prev) => ({
      ...prev,
      patientName: patient.name,
      patientId: patient.id,
      gender: patient.gender,
      age: patient.age,
      phone: patient.phone,
    }));
  };

  const handleWalkInBranchChange = (value) => {
    setWalkInForm((prev) => ({
      ...prev,
      branch: value,
      dentist: "",
    }));
  };

  const handleProceedToTime = () => {
    if (
      !walkInForm.patientName.trim() ||
      !walkInForm.branch.trim() ||
      !walkInForm.dentist.trim() ||
      !walkInForm.treatment.trim()
    ) {
      return;
    }

    setWalkInForm((prev) => ({
      ...prev,
      date: today,
    }));
    setWalkInStep(2);
  };

  const handleProceedToReview = () => {
    if (!walkInForm.time.trim()) return;
    setWalkInStep(3);
  };

  const handleConfirmWalkIn = () => {
    if (
      !walkInForm.patientName.trim() ||
      !walkInForm.branch.trim() ||
      !walkInForm.dentist.trim() ||
      !walkInForm.treatment.trim() ||
      !walkInForm.time.trim()
    ) {
      return;
    }

    const newAppointment = {
      id: Date.now(),
      patientName: walkInForm.patientName,
      gender: walkInForm.gender || "Male",
      age: Number(walkInForm.age) || 0,
      dentist: walkInForm.dentist,
      branch: walkInForm.branch,
      treatment: walkInForm.treatment,
      date: today,
      time: toAppointmentRange(walkInForm.time),
      type: "Walk-in",
      status: "Waiting",
      notes: walkInForm.notes || "Walk-in appointment added by admin.",
    };

    setAppointments((prev) => [newAppointment, ...prev]);

    setNotifications((prev) => [
      {
        id: Date.now() + 1,
        title: "New Walk-In Added:",
        message: `${walkInForm.patientName} was added to appointments`,
        time: "Just now",
      },
      ...prev,
    ]);

    setWalkInStep(4);
  };

  return (
    <div className="admin-dashboard-page">
      <AdminSidebar />

      <div className="admin-main-content">
        <AdminTopbar
          title="Appointments"
          notifications={notifications}
          isNotificationOpen={isNotificationOpen}
          onToggleNotifications={handleToggleNotifications}
          onCloseNotifications={handleCloseNotifications}
          onMarkAllRead={handleMarkAllRead}
        />

        <div className="admin-appointments-content">
          <div className="appointments-header-row">
            <div>
              <h1 className="appointments-page-title">Appointments</h1>
              <p className="appointments-page-subtitle">
                Manage, monitor, and review all appointment records.
              </p>
            </div>

            <div className="appointments-header-actions">
              <button
                className="appointments-walkin-btn"
                onClick={() => setShowWalkInModal(true)}
              >
                + Add Walk-In
              </button>

              <div className="appointments-date-range-box">
                <div className="date-field">
                  <label>From</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="date-field">
                  <label>To</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="appointments-summary-grid">
            <div className="summary-card">
              <span>Total Appointments</span>
              <h3>{summary.total}</h3>
            </div>
            <div className="summary-card">
              <span>Waiting</span>
              <h3>{summary.waiting}</h3>
            </div>
            <div className="summary-card">
              <span>In Queue</span>
              <h3>{summary.queue}</h3>
            </div>
            <div className="summary-card">
              <span>Completed</span>
              <h3>{summary.completed}</h3>
            </div>
            <div className="summary-card danger-card">
              <span>Cancelled</span>
              <h3>{summary.cancelled}</h3>
            </div>
          </div>

          <div className="appointments-toolbar">
            <div className="appointments-search">
              <input
                type="text"
                placeholder="Search patient, dentist, treatment, or branch"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="appointments-filters">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Waiting">Waiting</option>
                <option value="In Queue">In Queue</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
              >
                {branches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className="appointments-bulk-bar">
              <div className="appointments-bulk-left">
                <strong>{selectedIds.length}</strong> selected
              </div>

              <div className="appointments-bulk-actions">
                <button
                  className="bulk-action-btn soft-btn"
                  onClick={() => handleBulkStatusChange("In Queue")}
                >
                  Mark as In Queue
                </button>

                <button
                  className="bulk-action-btn soft-btn"
                  onClick={() => handleBulkStatusChange("Completed")}
                >
                  Mark as Completed
                </button>

                <button
                  className="bulk-action-btn danger-bulk-btn"
                  onClick={() => handleBulkStatusChange("Cancelled")}
                >
                  Cancel Selected
                </button>
              </div>
            </div>
          )}

          <div className="appointments-table-card">
            <div className="appointments-table-head">
              <span className="checkbox-head">
                <input
                  type="checkbox"
                  checked={allSelectableSelected}
                  onChange={handleToggleSelectAll}
                />
              </span>
              <span>Patient</span>
              <span>Dentist</span>
              <span>Branch</span>
              <span>Date</span>
              <span>Time</span>
              <span>Treatment</span>
              <span>Status</span>
              <span>Action</span>
            </div>

            <div className="appointments-table-body">
              {filteredAppointments.length === 0 ? (
                <div className="appointments-empty-state">
                  No appointments found for the selected filters.
                </div>
              ) : (
                filteredAppointments.map((appointment) => {
                  const isDisabled =
                    appointment.status === "Cancelled" ||
                    appointment.status === "Completed";

                  return (
                    <div className="appointments-table-row" key={appointment.id}>
                      <div className="checkbox-cell">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(appointment.id)}
                          onChange={() => handleToggleRow(appointment.id)}
                          disabled={isDisabled}
                        />
                      </div>

                      <div className="patient-cell">
                        <strong>{appointment.patientName}</strong>
                        <p>
                          {appointment.gender} • {appointment.age} yrs • {appointment.type}
                        </p>
                      </div>

                      <div className="cell-muted">{appointment.dentist}</div>
                      <div className="cell-muted">{appointment.branch}</div>
                      <div className="cell-muted">{formatDate(appointment.date)}</div>
                      <div className="cell-muted">{appointment.time}</div>
                      <div className="cell-muted">{appointment.treatment}</div>

                      <div>
                        <span
                          className={`status-badge ${appointment.status
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          {appointment.status}
                        </span>
                      </div>

                      <div className="action-cell">
                        <button
                          className="table-action-btn view-btn"
                          onClick={() => setSelectedAppointment(appointment)}
                        >
                          View
                        </button>

                        {appointment.status !== "Cancelled" &&
                          appointment.status !== "Completed" && (
                            <button
                              className="table-action-btn cancel-btn"
                              onClick={() => handleOpenCancelModal(appointment)}
                            >
                              Cancel
                            </button>
                          )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {selectedAppointment && !showCancelModal && (
          <div
            className="appointment-modal-overlay"
            onClick={() => setSelectedAppointment(null)}
          >
            <div
              className="appointment-details-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="modal-close-btn"
                onClick={() => setSelectedAppointment(null)}
              >
                ×
              </button>

              <div className="details-top">
                <h2>Appointment Details</h2>
                <span
                  className={`status-badge ${selectedAppointment.status
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`}
                >
                  {selectedAppointment.status}
                </span>
              </div>

              <div className="details-grid">
                <div className="detail-box">
                  <label>Patient Name</label>
                  <p>{selectedAppointment.patientName}</p>
                </div>
                <div className="detail-box">
                  <label>Gender / Age</label>
                  <p>
                    {selectedAppointment.gender} / {selectedAppointment.age}
                  </p>
                </div>
                <div className="detail-box">
                  <label>Dentist</label>
                  <p>{selectedAppointment.dentist}</p>
                </div>
                <div className="detail-box">
                  <label>Branch</label>
                  <p>{selectedAppointment.branch}</p>
                </div>
                <div className="detail-box">
                  <label>Date</label>
                  <p>{formatDate(selectedAppointment.date)}</p>
                </div>
                <div className="detail-box">
                  <label>Time</label>
                  <p>{selectedAppointment.time}</p>
                </div>
                <div className="detail-box">
                  <label>Treatment</label>
                  <p>{selectedAppointment.treatment}</p>
                </div>
                <div className="detail-box">
                  <label>Appointment Type</label>
                  <p>{selectedAppointment.type}</p>
                </div>
                <div className="detail-box full-width">
                  <label>Notes</label>
                  <p>{selectedAppointment.notes}</p>
                </div>
              </div>

              <div className="details-actions">
                <button
                  className="table-action-btn view-btn"
                  onClick={() => setSelectedAppointment(null)}
                >
                  Close
                </button>

                {selectedAppointment.status !== "Cancelled" &&
                  selectedAppointment.status !== "Completed" && (
                    <button
                      className="table-action-btn cancel-btn"
                      onClick={() => handleOpenCancelModal(selectedAppointment)}
                    >
                      Cancel Appointment
                    </button>
                  )}
              </div>
            </div>
          </div>
        )}

        {showCancelModal && selectedAppointment && (
          <div
            className="appointment-modal-overlay"
            onClick={handleCloseCancelModal}
          >
            <div
              className="confirm-cancel-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Cancel Appointment</h3>
              <p>
                Are you sure you want to cancel the appointment of{" "}
                <strong>{selectedAppointment.patientName}</strong> on{" "}
                <strong>{formatDate(selectedAppointment.date)}</strong>?
              </p>

              <div className="confirm-actions">
                <button
                  className="table-action-btn view-btn"
                  onClick={handleCloseCancelModal}
                >
                  No, Keep It
                </button>
                <button
                  className="table-action-btn cancel-btn"
                  onClick={handleConfirmCancel}
                >
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showWalkInModal && (
          <div
            className="appointment-modal-overlay"
            onClick={resetWalkInModal}
          >
            <div
              className={`walkin-flow-modal ${
                walkInStep === 2 ? "walkin-flow-modal-compact" : ""
              } ${walkInStep === 4 ? "walkin-flow-modal-confirmed" : ""}`}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close-btn" onClick={resetWalkInModal}>
                ×
              </button>

              {walkInStep === 1 && (
                <>
                  <div className="walkin-header-band">
                    <h2>Add Walk-In Appointment</h2>
                    <p>
                      Select an existing patient, assign a branch and doctor, then choose the needed service.
                    </p>
                  </div>

                  <div className="walkin-form-section">
                    <div className="walkin-field full-width-field patient-search-wrap">
                      <label>Patient Name</label>
                      <input
                        type="text"
                        placeholder="Type patient name"
                        value={patientQuery}
                        onChange={(e) => {
                          setPatientQuery(e.target.value);
                          setShowPatientSuggestions(true);
                          setWalkInForm((prev) => ({
                            ...prev,
                            patientName: e.target.value,
                            patientId: null,
                            gender: "",
                            age: "",
                            phone: "",
                          }));
                        }}
                        onFocus={() => setShowPatientSuggestions(true)}
                      />

                      {showPatientSuggestions && patientSuggestions.length > 0 && (
                        <div className="patient-suggestion-list">
                          {patientSuggestions.map((patient) => (
                            <button
                              key={patient.id}
                              type="button"
                              className="patient-suggestion-item"
                              onClick={() => handleSelectPatient(patient)}
                            >
                              <strong>{patient.name}</strong>
                              <span>
                                {patient.gender} • {patient.age} yrs
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {walkInForm.patientId && (
                      <div className="walkin-selected-patient full-width-field">
                        <div>
                          <h4>{walkInForm.patientName}</h4>
                          <p>
                            {walkInForm.gender} • {walkInForm.age} yrs old
                          </p>
                        </div>
                        <span>{walkInForm.phone}</span>
                      </div>
                    )}

                    <div className="walkin-field">
                      <label>Branch</label>
                      <select
                        value={walkInForm.branch}
                        onChange={(e) => handleWalkInBranchChange(e.target.value)}
                      >
                        <option value="">Select branch</option>
                        {branchOptions.map((branch) => (
                          <option key={branch} value={branch}>
                            {branch}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="walkin-field">
                      <label>Doctor</label>
                      <select
                        value={walkInForm.dentist}
                        onChange={(e) => handleWalkInInputChange("dentist", e.target.value)}
                        disabled={!walkInForm.branch}
                      >
                        <option value="">Select doctor</option>
                        {filteredDoctors.map((doctor) => (
                          <option key={doctor.id} value={doctor.name}>
                            {doctor.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="walkin-field full-width-field">
                      <label>Service</label>
                      <select
                        value={walkInForm.treatment}
                        onChange={(e) => handleWalkInInputChange("treatment", e.target.value)}
                      >
                        <option value="">Select service</option>
                        {serviceOptions.map((service) => (
                          <option key={service} value={service}>
                            {service}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="walkin-field full-width-field">
                      <label>Notes</label>
                      <textarea
                        value={walkInForm.notes}
                        onChange={(e) => handleWalkInInputChange("notes", e.target.value)}
                        placeholder="Optional notes..."
                      />
                    </div>
                  </div>

                  <div className="walkin-footer-actions">
                    <button className="table-action-btn view-btn" onClick={resetWalkInModal}>
                      Cancel
                    </button>
                    <button className="table-action-btn cancel-btn" onClick={handleProceedToTime}>
                      Proceed
                    </button>
                  </div>
                </>
              )}

              {walkInStep === 2 && (
                <>
                  <div className="walkin-time-top">
                    <button
                      className="walkin-back-btn"
                      onClick={() => setWalkInStep(1)}
                    >
                      ←
                    </button>

                    <div className="walkin-doctor-summary">
                      <div className="walkin-avatar">
                        {walkInForm.dentist ? walkInForm.dentist.charAt(4) || "D" : "D"}
                      </div>
                      <div>
                        <h3>{walkInForm.dentist}</h3>
                        <p>{selectedDoctorDetails?.specialty || "Dental Specialist"}</p>
                        <span>{walkInForm.branch}</span>
                      </div>
                    </div>
                  </div>

                  <div className="walkin-today-card">
                    <span>Appointment Date</span>
                    <strong>{formatLongDate(today)}</strong>
                    <p>Walk-in booking uses today’s date only.</p>
                  </div>

                  <div className="walkin-time-block">
                    <h4>Select Time Slot</h4>
                    <div className="walkin-time-grid">
                      {walkInTimeOptions.map((time) => (
                        <button
                          key={time}
                          className={`walkin-time-slot ${
                            walkInForm.time === time ? "active" : ""
                          }`}
                          onClick={() => handleWalkInInputChange("time", time)}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="walkin-footer-actions">
                    <button
                      className="table-action-btn view-btn"
                      onClick={() => setWalkInStep(1)}
                    >
                      Edit Details
                    </button>
                    <button
                      className="table-action-btn cancel-btn"
                      onClick={handleProceedToReview}
                    >
                      Review Details
                    </button>
                  </div>
                </>
              )}

              {walkInStep === 3 && (
                <>
                  <div className="walkin-header-band">
                    <h2>Review Appointment</h2>
                    <p>Please check the details before confirming the booking.</p>
                  </div>

                  <div className="walkin-review-card">
                    <div className="walkin-avatar">
                      {walkInForm.dentist ? walkInForm.dentist.charAt(4) || "D" : "D"}
                    </div>
                    <div>
                      <h3>{walkInForm.dentist}</h3>
                      <p>{selectedDoctorDetails?.specialty || "Dental Specialist"}</p>
                      <span>{walkInForm.branch}</span>
                    </div>
                  </div>

                  <div className="walkin-review-grid">
                    <div className="walkin-review-box">
                      <label>Patient</label>
                      <p>{walkInForm.patientName}</p>
                    </div>
                    <div className="walkin-review-box">
                      <label>Service</label>
                      <p>{walkInForm.treatment}</p>
                    </div>
                    <div className="walkin-review-box">
                      <label>Date</label>
                      <p>{formatLongDate(today)}</p>
                    </div>
                    <div className="walkin-review-box">
                      <label>Time</label>
                      <p>{walkInForm.time}</p>
                    </div>
                    <div className="walkin-review-box full-width-field">
                      <label>Appointment Type</label>
                      <p>Walk-in appointment created by admin</p>
                    </div>
                  </div>

                  <div className="walkin-footer-actions">
                    <button
                      className="table-action-btn view-btn"
                      onClick={() => setWalkInStep(2)}
                    >
                      Edit Details
                    </button>
                    <button
                      className="table-action-btn cancel-btn"
                      onClick={handleConfirmWalkIn}
                    >
                      Confirm Booking
                    </button>
                  </div>
                </>
              )}

              {walkInStep === 4 && (
                <div className="walkin-confirmed-panel">
                  <div className="walkin-confirmed-icon">✓</div>
                  <h2>Booking Confirmed</h2>
                  <p>
                    The walk-in appointment for <strong>{walkInForm.patientName}</strong> has been added successfully.
                  </p>

                  <div className="walkin-confirmed-summary">
                    <span>{walkInForm.treatment}</span>
                    <strong>{walkInForm.dentist}</strong>
                    <p>
                      {formatLongDate(today)} • {walkInForm.time}
                    </p>
                  </div>

                  <button
                    className="table-action-btn cancel-btn walkin-confirmed-btn"
                    onClick={resetWalkInModal}
                  >
                    View Appointments
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}