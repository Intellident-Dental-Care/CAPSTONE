import { useMemo, useState } from "react";
import SuperAdminSidebar from "../../components/superadmin/layout/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/layout/SuperAdminTopbar";

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

const BRANCHES = ["Dasmarinas", "General Trias", "Bacoor"];

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

const initialDentists = [
  {
    id: 1,
    name: "Andrea Lopez",
    dateOfBirth: "1990-08-12",
    age: 34,
    sex: "Female",
    contactNumber: "09171231234",
    email: "dr.andrea@gcdental.com",
    status: "Active",
    isProfileCompleted: true,
    schedules: [
      { branch: "Dasmarinas", day: "Monday", time: "9:00 AM - 1:00 PM" },
      { branch: "Dasmarinas", day: "Wednesday", time: "1:00 PM - 5:00 PM" },
    ],
  },
  {
    id: 2,
    name: "Angela Santos",
    dateOfBirth: "1989-04-05",
    age: 35,
    sex: "Female",
    contactNumber: "09182345678",
    email: "dr.angela@gcdental.com",
    status: "Active",
    isProfileCompleted: true,
    schedules: [
      { branch: "General Trias", day: "Wednesday", time: "1:00 PM - 5:00 PM" },
      { branch: "Bacoor", day: "Friday", time: "9:00 AM - 1:00 PM" },
    ],
  },
  {
    id: 3,
    name: "",
    dateOfBirth: "",
    age: "",
    sex: "",
    contactNumber: "",
    email: "dr.shin@gcdental.com",
    status: "Disabled",
    isProfileCompleted: false,
    schedules: [
      { branch: "Bacoor", day: "Friday", time: "10:00 AM - 2:00 PM" },
    ],
  },
];

function buildEmptyScheduleForm() {
  return {
    branch: "Dasmarinas",
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

  const [dentists, setDentists] = useState(initialDentists);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredDentists = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) return dentists;

    return dentists.filter((dentist) => {
      const scheduleText = (dentist.schedules || [])
        .map((schedule) => `${schedule.branch} ${schedule.day} ${schedule.time}`)
        .join(" ")
        .toLowerCase();

      return (
        dentist.email.toLowerCase().includes(keyword) ||
        (dentist.name || "").toLowerCase().includes(keyword) ||
        (dentist.contactNumber || "").toLowerCase().includes(keyword) ||
        (dentist.sex || "").toLowerCase().includes(keyword) ||
        scheduleText.includes(keyword)
      );
    });
  }, [dentists, searchTerm]);

  const totalDentists = filteredDentists.length;
  const activeDentists = filteredDentists.filter(
    (dentist) => dentist.status === "Active"
  ).length;
  const inactiveDentists = filteredDentists.filter(
    (dentist) => dentist.status === "Disabled"
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

  const handleConfirmAction = () => {
    const { type, ids, payload } = confirmModal;

    if (type === "register-dentist" && payload) {
      const newDentist = {
        id: Date.now(),
        name: "",
        dateOfBirth: "",
        age: "",
        sex: "",
        contactNumber: "",
        email: payload.email,
        status: "Active",
        isProfileCompleted: false,
        schedules: payload.schedules,
      };

      setDentists((prev) => [newDentist, ...prev]);
      setForm({ email: "" });
      setPendingSchedules([]);
      setScheduleForm(buildEmptyScheduleForm());
    }

    if (type === "disable-single" || type === "disable-multiple") {
      setDentists((prev) =>
        prev.map((dentist) =>
          ids.includes(dentist.id) ? { ...dentist, status: "Disabled" } : dentist
        )
      );
      setSelectedIds([]);
    }

    if (type === "enable-single" || type === "enable-multiple") {
      setDentists((prev) =>
        prev.map((dentist) =>
          ids.includes(dentist.id) ? { ...dentist, status: "Active" } : dentist
        )
      );
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
    setEditModal({
      open: true,
      dentistId: dentist.id,
      dentistEmail: dentist.email,
      schedules: [...(dentist.schedules || [])],
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

  const handleSaveEditedSchedules = () => {
    if (!editModal.dentistId || editModal.schedules.length === 0) return;

    setDentists((prev) =>
      prev.map((dentist) =>
        dentist.id === editModal.dentistId
          ? { ...dentist, schedules: editModal.schedules }
          : dentist
      )
    );

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
                  >
                    Register Dentist
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
                                  {schedule.branch} • {schedule.day} • {schedule.time}
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
                              schedule.branch === branch && schedule.day === day
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
              >
                Confirm
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
                      {schedule.branch} • {schedule.day} • {schedule.time}
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
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}