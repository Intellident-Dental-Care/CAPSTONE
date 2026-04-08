import { useEffect, useMemo, useState } from "react";
import SuperAdminSidebar from "../../components/superadmin/layout/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/layout/SuperAdminTopbar";
import {
  getSuperAdminDentists,
  createSuperAdminDentist,
  updateSuperAdminDentistStatus,
  updateSuperAdminDentistSchedules,
} from "../../services/superAdminService";

import "../../styles/admin/layout/admin-sidebar.css";
import "../../styles/admin/layout/admin-topbar.css";
import "../../styles/admin/notifications/admin-notification-popup.css";
import "../../styles/admin/shared/admin-responsive.css";

import "../../styles/superadmin/dentists/superadmin-dentists.css";
import "../../styles/superadmin/shared/superadmin-responsive.css";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// We map short string versions backend might return to our full array above
const normalizeDay = (dayStr) => {
  const lowered = String(dayStr).toLowerCase();
  if (lowered.includes("mon")) return "Monday";
  if (lowered.includes("tue")) return "Tuesday";
  if (lowered.includes("wed")) return "Wednesday";
  if (lowered.includes("thu")) return "Thursday";
  if (lowered.includes("fri")) return "Friday";
  if (lowered.includes("sat")) return "Saturday";
  if (lowered.includes("sun")) return "Sunday";
  return dayStr;
};

// Normalize branch strings to handle differences in database inputs
const normalizeBranchStr = (branchStr) => {
  const b = String(branchStr).toLowerCase();
  if (b.includes("dasma")) return "Dasmarinas, Cavite";
  if (b.includes("gentri") || b.includes("trias")) return "General Trias, Cavite";
  if (b.includes("bacoor")) return "Bacoor, Cavite";
  return branchStr;
};

const isSameSchedule = (left, right) => {
  return (
    normalizeDay(left.day) === normalizeDay(right.day) &&
    String(left.time || "").trim() === String(right.time || "").trim()
  );
};

const BRANCHES = ["Dasmarinas, Cavite", "General Trias, Cavite", "Bacoor, Cavite"];

const TIME_OPTIONS = [
  "8:00 AM - 12:00 PM",
  "9:00 AM - 1:00 PM",
  "10:00 AM - 2:00 PM",
  "1:00 PM - 5:00 PM",
  "2:00 PM - 6:00 PM",
  "3:00 PM - 7:00 PM",
  "8:00 AM - 5:00 PM",
  "9:00 AM - 6:00 PM",
];

function buildEmptyScheduleForm() {
  return {
    branch: "Dasmarinas, Cavite",
    day: "Monday",
    time: TIME_OPTIONS[0],
  };
}

export default function SuperAdminDentists() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Dentist Update",
      message: "A dentist schedule was updated.",
      time: "8 mins ago",
    },
  ]);

  const [dentists, setDentists] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    email: "",
  });

  const [scheduleForm, setScheduleForm] = useState(buildEmptyScheduleForm());
  const [pendingSchedules, setPendingSchedules] = useState([]);

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: "",
    ids: [],
    title: "",
    message: "",
    payload: null,
  });

  const [editModal, setEditModal] = useState({
    open: false,
    dentistId: null,
    dentistEmail: "",
    schedules: [],
    scheduleForm: buildEmptyScheduleForm(),
  });

  const fetchDentists = async () => {
    const res = await getSuperAdminDentists();
    if (res?.success) setDentists(res.data);
  };

  useEffect(() => {
    fetchDentists();
  }, []);

  const filteredDentists = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) return dentists;

    return dentists.filter((dentist) => {
      const scheduleText = (dentist.schedules || [])
        .map((schedule) => `${schedule.branch} ${schedule.day} ${schedule.time}`)
        .join(" ")
        .toLowerCase();

      return (
        (dentist.email || "").toLowerCase().includes(keyword) ||
        (dentist.name || "").toLowerCase().includes(keyword) ||
        (dentist.contactNumber || "").toLowerCase().includes(keyword) ||
        (dentist.specialty || "").toLowerCase().includes(keyword) ||
        scheduleText.includes(keyword)
      );
    });
  }, [dentists, searchTerm]);

  const totalDentists = filteredDentists.length;
  const activeDentists = filteredDentists.filter(
    (dentist) => dentist.status === "Active"
  ).length;
  const inactiveDentists = filteredDentists.filter(
    (dentist) => dentist.status === "Disabled" || dentist.status === "Inactive"
  ).length;

  const allVisibleSelected =
    filteredDentists.length > 0 &&
    filteredDentists.every((dentist) => selectedIds.includes(dentist.id));

  const handleMarkAllRead = () => {
    setNotifications([]);
    setIsNotificationOpen(false);
  };

  const handleAddPendingSchedule = () => {
    const newSchedule = {
      branch: scheduleForm.branch,
      day: scheduleForm.day,
      time: scheduleForm.time,
    };

    const hasDuplicate = pendingSchedules.some((schedule) =>
      isSameSchedule(schedule, newSchedule)
    );

    if (hasDuplicate) {
      alert("This schedule already exists for this dentist.");
      return;
    }

    setPendingSchedules((prev) => [...prev, newSchedule]);
    setScheduleForm(buildEmptyScheduleForm());
  };

  const handleRemovePendingSchedule = (indexToRemove) => {
    setPendingSchedules((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const openRegisterModal = (e) => {
    e.preventDefault();

    if (!form.email.trim() || pendingSchedules.length === 0) return;

    setConfirmModal({
      open: true,
      type: "register-dentist",
      ids: [],
      title: "Register Dentist Account",
      message: `Are you sure you want to register ${form.email.trim()} with ${pendingSchedules.length} schedule(s)?`,
      payload: {
        email: form.email.trim(),
        schedules: pendingSchedules,
      },
    });
  };

  const openSingleStatusModal = (dentist) => {
    const isActive = dentist.status === "Active";

    setConfirmModal({
      open: true,
      type: isActive ? "disable-single" : "enable-single",
      ids: [dentist.id],
      title: isActive ? "Disable Dentist Account" : "Enable Dentist Account",
      message: isActive
        ? `Are you sure you want to disable ${dentist.email}?`
        : `Are you sure you want to enable ${dentist.email}?`,
      payload: null,
    });
  };

  const openBulkDisableModal = () => {
    if (selectedIds.length === 0) return;

    setConfirmModal({
      open: true,
      type: "disable-multiple",
      ids: selectedIds,
      title: "Disable Selected Accounts",
      message: `Are you sure you want to disable ${selectedIds.length} selected account(s)?`,
      payload: null,
    });
  };

  const openBulkEnableModal = () => {
    if (selectedIds.length === 0) return;

    setConfirmModal({
      open: true,
      type: "enable-multiple",
      ids: selectedIds,
      title: "Enable Selected Accounts",
      message: `Are you sure you want to enable ${selectedIds.length} selected account(s)?`,
      payload: null,
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      open: false,
      type: "",
      ids: [],
      title: "",
      message: "",
      payload: null,
    });
  };

  const handleConfirmAction = async () => {
    const { type, ids, payload } = confirmModal;

    if (type === "register-dentist" && payload) {
      setIsSubmitting(true);
      const res = await createSuperAdminDentist({
        email: payload.email,
        schedules: payload.schedules,
        name: "New Dentist",
        contactNumber: "Not Set",
        specialty: "General Dentistry",
        licenseNumber: "Not Set",
        yearsExperience: 0
      });
      setIsSubmitting(false);

      if (res?.success) {
        fetchDentists();
        setForm({ email: "" });
        setPendingSchedules([]);
        setScheduleForm(buildEmptyScheduleForm());
      } else {
        alert(res?.message || "Failed to create dentist account.");
      }
    }

    if (type === "disable-single" || type === "disable-multiple") {
      setIsSubmitting(true);
      const results = await Promise.all(ids.map((id) => updateSuperAdminDentistStatus(id, false)));
      setIsSubmitting(false);

      if (results.some((result) => !result?.success)) {
        alert(results.find((result) => !result?.success)?.message || "Failed to disable one or more dentist accounts.");
      }

      await fetchDentists();
      setSelectedIds([]);
    }

    if (type === "enable-single" || type === "enable-multiple") {
      setIsSubmitting(true);
      const results = await Promise.all(ids.map((id) => updateSuperAdminDentistStatus(id, true)));
      setIsSubmitting(false);

      if (results.some((result) => !result?.success)) {
        alert(results.find((result) => !result?.success)?.message || "Failed to enable one or more dentist accounts.");
      }

      await fetchDentists();
      setSelectedIds([]);
    }

    closeConfirmModal();
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      const visibleIds = filteredDentists.map((dentist) => dentist.id);
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
      return;
    }

    const visibleIds = filteredDentists.map((dentist) => dentist.id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const openEditModal = (dentist) => {
    const normalizedSchedules = (dentist.schedules || []).map((schedule) => ({
      branch: normalizeBranchStr(schedule.branch),
      day: normalizeDay(schedule.day),
      time: schedule.time,
    }));

    setEditModal({
      open: true,
      dentistId: dentist.id,
      dentistEmail: dentist.email,
      schedules: normalizedSchedules,
      scheduleForm: buildEmptyScheduleForm(),
    });
  };

  const closeEditModal = () => {
    setEditModal({
      open: false,
      dentistId: null,
      dentistEmail: "",
      schedules: [],
      scheduleForm: buildEmptyScheduleForm(),
    });
  };

  const handleAddEditSchedule = () => {
    const newSchedule = {
      branch: editModal.scheduleForm.branch,
      day: editModal.scheduleForm.day,
      time: editModal.scheduleForm.time,
    };

    const hasDuplicate = editModal.schedules.some((schedule) =>
      isSameSchedule(schedule, newSchedule)
    );

    if (hasDuplicate) {
      alert("This schedule already exists for this dentist.");
      return;
    }

    setEditModal((prev) => ({
      ...prev,
      schedules: [...prev.schedules, newSchedule],
      scheduleForm: buildEmptyScheduleForm(),
    }));
  };

  const handleRemoveEditSchedule = (indexToRemove) => {
    setEditModal((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleSaveEditedSchedules = async () => {
    if (!editModal.dentistId) return;

    setIsSubmitting(true);
    const res = await updateSuperAdminDentistSchedules(
      editModal.dentistId,
      editModal.schedules
    );
    setIsSubmitting(false);

    if (!res?.success) {
      alert(res?.message || "Failed to save schedule changes.");
      return;
    }

    await fetchDentists();
    closeEditModal();
  };

  return (
    <div className="admin-dashboard-page">
      <SuperAdminSidebar />

      <main className="admin-main-content">
        <SuperAdminTopbar
          title="Dentist Management"
          notifications={notifications}
          isNotificationOpen={isNotificationOpen}
          onToggleNotifications={() => setIsNotificationOpen((prev) => !prev)}
          onCloseNotifications={() => setIsNotificationOpen(false)}
          onMarkAllRead={handleMarkAllRead}
        />

        <div className="superadmin-dentists-fixed-page">
          <div className="superadmin-dentists-content">
            <section className="superadmin-dentists-header">
              <h2 className="superadmin-dentists-title">Dentist Management</h2>
              <p className="superadmin-dentists-subtitle">
                Register dentists, assign multiple schedules, and manage account
                status.
              </p>
            </section>

            <section className="superadmin-dentists-stats">
              <div className="superadmin-dentist-stat-card">
                <span>Total Dentist</span>
                <h3>{totalDentists}</h3>
              </div>

              <div className="superadmin-dentist-stat-card">
                <span>Active Dentist</span>
                <h3>{activeDentists}</h3>
              </div>

              <div className="superadmin-dentist-stat-card">
                <span>Inactive Dentist</span>
                <h3>{inactiveDentists}</h3>
              </div>
            </section>

            <section className="superadmin-dentists-form-card">
              <div className="superadmin-dentists-card-head">
                <div>
                  <h3>Register Dentist</h3>
                  <p>Email and schedule details are required for registration.</p>
                </div>
              </div>

              <form
                onSubmit={openRegisterModal}
                className="superadmin-dentists-form-stack"
              >
                <div className="superadmin-dentists-field superadmin-dentists-field-wide">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="dentist@email.com"
                    value={form.email}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                  />
                </div>

                <div className="superadmin-dentists-schedule-builder">
                  <div className="superadmin-dentists-schedule-grid">
                    <div className="superadmin-dentists-field">
                      <label>Branch</label>
                      <select
                        value={scheduleForm.branch}
                        onChange={(e) =>
                          setScheduleForm((prev) => ({
                            ...prev,
                            branch: e.target.value,
                          }))
                        }
                      >
                        {BRANCHES.map((branch) => (
                          <option key={branch} value={branch}>
                            {branch}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="superadmin-dentists-field">
                      <label>Day</label>
                      <select
                        value={scheduleForm.day}
                        onChange={(e) =>
                          setScheduleForm((prev) => ({
                            ...prev,
                            day: e.target.value,
                          }))
                        }
                      >
                        {DAYS.map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="superadmin-dentists-field">
                      <label>Time</label>
                      <select
                        value={scheduleForm.time}
                        onChange={(e) =>
                          setScheduleForm((prev) => ({
                            ...prev,
                            time: e.target.value,
                          }))
                        }
                      >
                        {TIME_OPTIONS.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="superadmin-dentists-form-action">
                      <button
                        type="button"
                        onClick={handleAddPendingSchedule}
                        className="superadmin-dentists-secondary-btn add-schedule-btn"
                      >
                        Add Schedule
                      </button>
                    </div>
                  </div>

                  <div className="superadmin-dentists-added-schedules">
                    {pendingSchedules.length > 0 ? (
                      pendingSchedules.map((schedule, index) => (
                        <div
                          key={`${schedule.branch}-${schedule.day}-${schedule.time}-${index}`}
                          className="superadmin-dentists-schedule-tag"
                        >
                          <span>
                            {schedule.branch} • {schedule.day} • {schedule.time}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemovePendingSchedule(index)}
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="superadmin-dentists-schedule-empty">
                        No schedules added yet.
                      </p>
                    )}
                  </div>
                </div>

                <div className="superadmin-dentists-register-row">
                  <button
                    type="submit"
                    className="superadmin-dentists-primary-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Registering..." : "Register Dentist"}
                  </button>
                </div>
              </form>
            </section>

            <section className="superadmin-dentists-list-card superadmin-dentists-list-flex">
              <div className="superadmin-dentists-card-head superadmin-dentists-card-head-wrap">
                <div>
                  <h3>Dentist List</h3>
                  <p>Only the list area scrolls when there are many records.</p>
                </div>

                <div className="superadmin-dentists-top-actions">
                  <input
                    type="text"
                    placeholder="Search name, email, branch, day..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="superadmin-dentists-search"
                  />

                  <button
                    type="button"
                    onClick={openBulkEnableModal}
                    className="superadmin-dentists-secondary-btn enable-selected-btn"
                    disabled={selectedIds.length === 0}
                  >
                    Enable Selected
                  </button>

                  <button
                    type="button"
                    onClick={openBulkDisableModal}
                    className="superadmin-dentists-secondary-btn"
                    disabled={selectedIds.length === 0}
                  >
                    Disable Selected
                  </button>
                </div>
              </div>

              <div className="superadmin-dentists-table-scroll">
                <div className="superadmin-dentists-table-wrap">
                  <table className="superadmin-dentists-table">
                    <thead>
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            checked={allVisibleSelected}
                            onChange={toggleSelectAllVisible}
                          />
                        </th>
                        <th>Name</th>
                        <th>Date of Birth</th>
                        <th>Age</th>
                        <th>Sex</th>
                        <th>Contact Number</th>
                        <th>Email</th>
                        <th>Schedules</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredDentists.map((dentist) => (
                        <tr key={dentist.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(dentist.id)}
                              onChange={() => toggleSelectOne(dentist.id)}
                            />
                          </td>

                          <td className="superadmin-dentists-name-cell">
                            {dentist.name || (
                              <span className="superadmin-dentists-empty-text">
                                Not set yet
                              </span>
                            )}
                          </td>

                          <td>
                            {dentist.dateOfBirth || (
                              <span className="superadmin-dentists-empty-text">
                                Not set yet
                              </span>
                            )}
                          </td>

                          <td>
                            {dentist.age || (
                              <span className="superadmin-dentists-empty-text">
                                Not set yet
                              </span>
                            )}
                          </td>

                          <td>
                            {dentist.sex || (
                              <span className="superadmin-dentists-empty-text">
                                Not set yet
                              </span>
                            )}
                          </td>

                          <td>
                            {dentist.contactNumber || (
                              <span className="superadmin-dentists-empty-text">
                                Not set yet
                              </span>
                            )}
                          </td>

                          <td className="superadmin-dentists-email-cell">
                            {dentist.email}
                          </td>

                          <td>
                            <div className="superadmin-dentists-schedule-cell">
                              {(dentist.schedules || []).map((schedule, index) => (
                                <div
                                  key={`${schedule.branch}-${schedule.day}-${schedule.time}-${index}`}
                                  className="superadmin-dentists-schedule-chip"
                                >
                                  {schedule.branch} • {normalizeDay(schedule.day)} • {schedule.time}
                                </div>
                              ))}
                            </div>
                          </td>

                          <td>
                            <span
                              className={`superadmin-dentists-status ${
                                dentist.status === "Active"
                                  ? "is-active"
                                  : "is-disabled"
                              }`}
                            >
                              {dentist.status}
                            </span>
                          </td>

                          <td>
                            <div className="superadmin-dentists-action-stack">
                              <button
                                type="button"
                                onClick={() => openEditModal(dentist)}
                                className="superadmin-dentists-action-btn edit-btn"
                              >
                                Edit Schedule
                              </button>

                              <button
                                type="button"
                                onClick={() => openSingleStatusModal(dentist)}
                                className={`superadmin-dentists-action-btn ${
                                  dentist.status === "Active"
                                    ? "disable-btn"
                                    : "enable-btn"
                                }`}
                              >
                                {dentist.status === "Active"
                                  ? "Disable"
                                  : "Enable"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {filteredDentists.length === 0 && (
                        <tr>
                          <td colSpan="10">
                            <div className="superadmin-dentists-empty-state">
                              No dentist records found.
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section className="superadmin-dentists-calendar-card">
              <div className="superadmin-dentists-card-head">
                <div>
                  <h3>Weekly Schedule View</h3>
                  <p>Calendar-style view of all dentist schedules.</p>
                </div>
              </div>

              <div className="superadmin-dentists-calendar-grid">
                <div className="superadmin-dentists-calendar-header-cell">Branch</div>
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className="superadmin-dentists-calendar-header-cell"
                  >
                    {day}
                  </div>
                ))}

                {BRANCHES.map((branch) => (
                  <div className="superadmin-dentists-calendar-row" key={branch}>
                    <div className="superadmin-dentists-calendar-branch-cell">
                      {branch}
                    </div>

                    {DAYS.map((day) => {
                      const matchingSchedules = dentists.flatMap((dentist) =>
                        (dentist.schedules || [])
                          .filter(
                            (schedule) =>
                              normalizeBranchStr(schedule.branch) === normalizeBranchStr(branch) && 
                              normalizeDay(schedule.day) === day
                          )
                          .map((schedule, index) => ({
                            dentistId: dentist.id,
                            dentistEmail: dentist.email,
                            dentistName: dentist.name,
                            status: dentist.status,
                            scheduleId: `${dentist.id}-${index}-${schedule.time}`,
                            time: schedule.time,
                          }))
                      );

                      return (
                        <div
                          key={`${branch}-${day}`}
                          className="superadmin-dentists-calendar-day-cell"
                        >
                          {matchingSchedules.length > 0 ? (
                            matchingSchedules.map((item) => (
                              <div
                                key={item.scheduleId}
                                className={`superadmin-dentists-calendar-event ${
                                  item.status === "Active"
                                    ? "is-active"
                                    : "is-disabled"
                                }`}
                              >
                                <strong>
                                  {item.dentistName || item.dentistEmail}
                                </strong>
                                <span>{item.time}</span>
                              </div>
                            ))
                          ) : (
                            <span className="superadmin-dentists-calendar-empty">
                              —
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      {confirmModal.open && (
        <div
          className="superadmin-dentists-modal-overlay"
          onClick={closeConfirmModal}
        >
          <div
            className="superadmin-dentists-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{confirmModal.title}</h3>
            <p>{confirmModal.message}</p>

            <div className="superadmin-dentists-modal-actions">
              <button
                type="button"
                className="superadmin-dentists-modal-cancel"
                onClick={closeConfirmModal}
              >
                Cancel
              </button>

              <button
                type="button"
                className="superadmin-dentists-modal-confirm"
                onClick={handleConfirmAction}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editModal.open && (
        <div
          className="superadmin-dentists-modal-overlay"
          onClick={closeEditModal}
        >
          <div
            className="superadmin-dentists-modal superadmin-dentists-edit-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Edit Schedule</h3>
            <p className="superadmin-dentists-edit-email">{editModal.dentistEmail}</p>

            <div className="superadmin-dentists-edit-builder">
              <div className="superadmin-dentists-field">
                <label>Branch</label>
                <select
                  value={editModal.scheduleForm.branch}
                  onChange={(e) =>
                    setEditModal((prev) => ({
                      ...prev,
                      scheduleForm: {
                        ...prev.scheduleForm,
                        branch: e.target.value,
                      },
                    }))
                  }
                >
                  {BRANCHES.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>

              <div className="superadmin-dentists-field">
                <label>Day</label>
                <select
                  value={editModal.scheduleForm.day}
                  onChange={(e) =>
                    setEditModal((prev) => ({
                      ...prev,
                      scheduleForm: {
                        ...prev.scheduleForm,
                        day: e.target.value,
                      },
                    }))
                  }
                >
                  {DAYS.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div className="superadmin-dentists-field">
                <label>Time</label>
                <select
                  value={editModal.scheduleForm.time}
                  onChange={(e) =>
                    setEditModal((prev) => ({
                      ...prev,
                      scheduleForm: {
                        ...prev.scheduleForm,
                        time: e.target.value,
                      },
                    }))
                  }
                >
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleAddEditSchedule}
                className="superadmin-dentists-secondary-btn add-schedule-btn"
              >
                Add Schedule
              </button>
            </div>

            <div className="superadmin-dentists-edit-list">
              {editModal.schedules.length > 0 ? (
                editModal.schedules.map((schedule, index) => (
                  <div
                    key={`${schedule.branch}-${schedule.day}-${schedule.time}-${index}`}
                    className="superadmin-dentists-schedule-tag"
                  >
                    <span>
                      {schedule.branch} • {normalizeDay(schedule.day)} • {schedule.time}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEditSchedule(index)}
                    >
                      ✕
                    </button>
                  </div>
                ))
              ) : (
                <p className="superadmin-dentists-schedule-empty">
                  No schedules added yet.
                </p>
              )}
            </div>

            <div className="superadmin-dentists-modal-actions">
              <button
                type="button"
                className="superadmin-dentists-modal-cancel"
                onClick={closeEditModal}
              >
                Cancel
              </button>

              <button
                type="button"
                className="superadmin-dentists-modal-confirm"
                onClick={handleSaveEditedSchedules}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Schedule"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}