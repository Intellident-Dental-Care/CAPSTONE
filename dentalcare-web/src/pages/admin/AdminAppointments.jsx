import React, { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/admin/layout/AdminSidebar";
import AdminTopbar from "../../components/admin/layout/AdminTopbar";
import {
  createWalkInAppointment,
  getAdminAppointments,
  getAdminDentists,
  getAdminPatients,
  updateAppointmentStatus,
} from "../../services/adminService";
import { useBranch } from "../../context/BranchContext";
import "../../styles/admin/appointments/admin-appointments.css";
import "../../styles/admin/dashboard/admin-layout.css";
import "../../styles/admin/layout/admin-sidebar.css";
import "../../styles/admin/layout/admin-topbar.css";
import "../../styles/admin/notifications/admin-notification-popup.css";
import "../../styles/admin/shared/admin-responsive.css";

const branchOptions = [
  "Dasmarinas, Cavite",
  "General Trias, Cavite",
  "Bacoor, Cavite",
];

const branchAliases = {
  dasmarinas_cavite: ["dasmarinas, cavite", "dasmari\u00f1as, cavite", "gc dental care | dasmari\u00f1as", "gc dental care | dasmarinas"],
  general_trias_cavite: ["general trias, cavite", "gc dental care | gentri", "gentri", "general trias"],
  bacoor_cavite: ["bacoor, cavite", "gc dental care | bacoor", "bacoor"],
};

const toBranchKey = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "";

  const entry = Object.entries(branchAliases).find(([, aliases]) => aliases.includes(normalized));
  return entry ? entry[0] : normalized;
};

const toBranchLabel = (value) => {
  const key = toBranchKey(value);
  if (key === "dasmarinas_cavite") return "Dasmarinas, Cavite";
  if (key === "general_trias_cavite") return "General Trias, Cavite";
  if (key === "bacoor_cavite") return "Bacoor, Cavite";
  return String(value || "");
};

const getCurrentTimeLabel = () => {
  const now = new Date();
  return now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const getTodayDayShort = () => {
  return new Date().toLocaleDateString("en-US", { weekday: "short" });
};

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

export default function AdminAppointments() {
  const { selectedBranch } = useBranch();
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

  const [appointments, setAppointments] = useState([]);
  const [patientCatalog, setPatientCatalog] = useState([]);
  const [doctorCatalog, setDoctorCatalog] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
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
    branch: selectedBranch || "",
    treatment: "",
    date: today,
    time: "",
    notes: "",
  });

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      const [appointmentsResult, patientsResult, dentistsResult] = await Promise.all([
        getAdminAppointments({ branch: selectedBranch, forceRefresh: true }),
        getAdminPatients(),
        getAdminDentists(),
      ]);

      if (active && appointmentsResult?.success && Array.isArray(appointmentsResult.data)) {
        setAppointments(appointmentsResult.data);
      }

      if (active && patientsResult?.success && Array.isArray(patientsResult.data)) {
        setPatientCatalog(
          patientsResult.data.map((patient) => ({
            id: patient.id,
            name: patient.name,
            gender: patient.gender || "-",
            age: Number(patient.age) || 0,
            phone: patient.phone || "",
          }))
        );
      }

      if (active && dentistsResult?.success && Array.isArray(dentistsResult.data)) {
        setDoctorCatalog(
          dentistsResult.data.map((dentist) => ({
            id: dentist.id,
            name: dentist.name,
            specialty: dentist.specialty || "General Dentistry",
            branch: toBranchLabel(dentist.schedules?.[0]?.branch || ""),
            schedules: Array.isArray(dentist.schedules) ? dentist.schedules : [],
          }))
        );
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, [selectedBranch]);

  useEffect(() => {
    if (selectedBranch) {
      setWalkInForm((prev) => ({ ...prev, branch: selectedBranch }));
    }
  }, [selectedBranch]);

  const patientSuggestions = useMemo(() => {
    if (!patientQuery.trim()) return [];
    return patientCatalog.filter((patient) =>
      patient.name.toLowerCase().includes(patientQuery.toLowerCase())
    );
  }, [patientCatalog, patientQuery]);

  const filteredDoctors = useMemo(() => {
    if (!walkInForm.branch) return [];
    const selectedBranchKey = toBranchKey(walkInForm.branch);
    const todayDayShort = getTodayDayShort();

    return doctorCatalog.filter((doctor) => {
      const schedules = Array.isArray(doctor.schedules) ? doctor.schedules : [];
      return schedules.some(
        (schedule) =>
          schedule?.active &&
          schedule?.day === todayDayShort &&
          toBranchKey(schedule?.branch) === selectedBranchKey
      );
    });
  }, [doctorCatalog, walkInForm.branch]);

  const selectedDoctorDetails = useMemo(() => {
    return doctorCatalog.find((doctor) => doctor.name === walkInForm.dentist) || null;
  }, [doctorCatalog, walkInForm.dentist]);

  const dynamicTimeOptions = useMemo(() => {
    if (!walkInForm.dentist) return [];
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const slots = [];

    let hours = now.getHours();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const minsStr = String(now.getMinutes()).padStart(2, "0");
    slots.push({
      label: `Now (${hours}:${minsStr} ${ampm})`,
      value: "Now",
    });

    const bookedRanges = appointments
      .filter((a) => a.dentist === walkInForm.dentist && a.date === today && a.status !== "Cancelled")
      .map((a) => {
        const match = String(a.time).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (!match) return { start: 0, end: 0 };
        let h = Number(match[1]);
        const m = Number(match[2]);
        if (match[3].toUpperCase() === "PM" && h !== 12) h += 12;
        if (match[3].toUpperCase() === "AM" && h === 12) h = 0;
        const startMins = h * 60 + m;
        return { start: startMins, end: startMins + 60 };
      });

    for (let h = 9; h <= 16; h++) {
      for (let m of [0, 30]) {
        const slotMins = h * 60 + m;
        if (slotMins <= currentMins) continue;

        const overlaps = bookedRanges.some((b) => slotMins < b.end && slotMins + 60 > b.start);
        
        if (!overlaps) {
          let hr12 = h % 12 || 12;
          let ampmStr = h >= 12 ? "PM" : "AM";
          let label = `${String(hr12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampmStr}`;
          slots.push({ label, value: label });
        }
      }
    }
    return slots;
  }, [appointments, walkInForm.dentist, today]);

  const filteredAppointments = useMemo(() => {
    const selectedBranchKey = toBranchKey(selectedBranch);

    return appointments.filter((appointment) => {
      const matchesSearch =
        appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.dentist.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.treatment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.branch.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || appointment.status === statusFilter;

      const matchesBranch =
        !selectedBranch ||
        selectedBranch === "All" ||
        toBranchKey(appointment.branch) === selectedBranchKey;

      const matchesDateRange = isWithinRange(
        appointment.date,
        startDate,
        endDate
      );

      return matchesSearch && matchesStatus && matchesBranch && matchesDateRange;
    });
  }, [appointments, searchTerm, statusFilter, selectedBranch, startDate, endDate]);

  const summary = useMemo(() => {
    return {
      total: filteredAppointments.length,
      pending: filteredAppointments.filter((a) => a.status === "Pending").length,
      queue: filteredAppointments.filter((a) => a.status === "In Queue" || a.status === "In Treatment").length,
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

  const handleConfirmCancel = async () => {
    if (!selectedAppointment) return;

    const updateResult = await updateAppointmentStatus(selectedAppointment.id, "cancelled");
    if (!updateResult?.success) {
      return;
    }

    setAppointments((prev) =>
      prev.map((appointment) =>
        appointment.id === selectedAppointment.id
          ? { ...appointment, status: "Cancelled", notes: "Cancelled due to not showing up" }
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

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedIds.length === 0) return;

    const updateResults = await Promise.all(
      selectedIds.map(async (id) => {
        const result = await updateAppointmentStatus(id, newStatus);
        return { id, success: !!result?.success, message: result?.message || "" };
      })
    );

    const succeededIds = updateResults.filter((item) => item.success).map((item) => item.id);
    if (!succeededIds.length) {
      return;
    }

    setAppointments((prev) =>
      prev.map((appointment) =>
        succeededIds.includes(appointment.id)
          ? {
              ...appointment,
              status: newStatus,
              notes:
                newStatus === "Cancelled"
                  ? "Cancelled due to not showing up"
                  : appointment.notes,
            }
          : appointment
      )
    );

    setNotifications((prev) => [
      {
        id: Date.now(),
        title: "Bulk Update:",
        message: `${succeededIds.length} appointment(s) marked as ${newStatus}`,
        time: "Just now",
      },
      ...prev,
    ]);

    setSelectedIds((prev) => prev.filter((id) => !succeededIds.includes(id)));

    const refreshedAppointments = await getAdminAppointments({ branch: selectedBranch, forceRefresh: true });
    if (refreshedAppointments?.success && Array.isArray(refreshedAppointments.data)) {
      setAppointments(refreshedAppointments.data);
    }
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
      branch: selectedBranch || "",
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
      time: "Now",
    }));
    setWalkInStep(2);
  };

  const handleProceedToReview = () => {
    if (!walkInForm.time.trim()) return;
    setWalkInStep(3);
  };

  const handleConfirmWalkIn = async () => {
    if (
      !walkInForm.patientName.trim() ||
      !walkInForm.branch.trim() ||
      !walkInForm.dentist.trim() ||
      !walkInForm.treatment.trim()
    ) {
      return;
    }

    const selectedDentist = doctorCatalog.find((doctor) => doctor.name === walkInForm.dentist);

    const createResult = await createWalkInAppointment({
      userId: walkInForm.patientId,
      patientName: walkInForm.patientName,
      dentistId: selectedDentist?.id || null,
      branch: walkInForm.branch,
      service: walkInForm.treatment,
      time: walkInForm.time,
    });

    if (!createResult?.success) {
      return;
    }

    const newAppointment = {
      id: createResult?.data?.id || Date.now(),
      patientName: walkInForm.patientName,
      gender: walkInForm.gender || "Male",
      age: Number(walkInForm.age) || 0,
      dentist: walkInForm.dentist,
      branch: walkInForm.branch,
      treatment: walkInForm.treatment,
      date: createResult?.data?.appointmentDate || today,
      time: createResult?.data?.appointmentTimeLabel || (walkInForm.time === "Now" ? getCurrentTimeLabel() : walkInForm.time),
      type: "Walk-in",
      status: "Pending",
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

  const invalidSelectedCount = selectedIds.filter((id) => {
    const appt = appointments.find((a) => a.id === id);
    return appt && appt.date !== today;
  }).length;

  const hasInvalidDates = invalidSelectedCount > 0;

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
              <span>Pending</span>
              <h3>{summary.pending}</h3>
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
                placeholder="Search patient, dentist, service, or branch"
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
                <option value="Pending">Pending</option>
                <option value="In Queue">In Queue</option>
                <option value="In Treatment">In Treatment</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className="appointments-bulk-bar">
              <div className="appointments-bulk-left">
                <strong>{selectedIds.length}</strong> selected
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <div className="appointments-bulk-actions">
                  <button
                    className="bulk-action-btn soft-btn"
                    onClick={() => handleBulkStatusChange("In Treatment")}
                    disabled={hasInvalidDates}
                    style={hasInvalidDates ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                  >
                    Mark as In Treatment
                  </button>

                  <button
                    className="bulk-action-btn soft-btn"
                    onClick={() => handleBulkStatusChange("In Queue")}
                    disabled={hasInvalidDates}
                    style={hasInvalidDates ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                  >
                    Mark as In Queue
                  </button>

                  <button
                    className="bulk-action-btn danger-bulk-btn"
                    onClick={() => handleBulkStatusChange("Cancelled")}
                  >
                    Cancel Selected
                  </button>
                </div>

                {hasInvalidDates && (
                  <div style={{ fontSize: "13px", color: "#ef4444", fontStyle: "italic", marginTop: "6px" }}>
                    * {invalidSelectedCount} selected appointment{invalidSelectedCount > 1 ? "s" : ""} cannot be marked as "In Queue" or "In Treatment" because they are not scheduled for today.
                  </div>
                )}
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
              <span>Service</span>
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
                  <label>Service</label>
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
                      {dynamicTimeOptions.map((slot) => (
                        <button
                          key={slot.value}
                          className={`walkin-time-slot ${
                            walkInForm.time === slot.value ? "active" : ""
                          }`}
                          onClick={() => handleWalkInInputChange("time", slot.value)}
                        >
                          {slot.label}
                        </button>
                      ))}
                      
                      {dynamicTimeOptions.length === 0 && (
                        <p style={{ fontSize: 12, color: "#888", gridColumn: "1/-1", textAlign: "center" }}>
                          No available slots left today for this dentist.
                        </p>
                      )}
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
                      Edit Time
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