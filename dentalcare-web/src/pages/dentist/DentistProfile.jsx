import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/dentist/layout/Sidebar";
import Topbar from "../../components/dentist/layout/Topbar";
import profileImage from "../../assets/profile_sample.jpg";
import {
  getDentistProfile,
  updateDentistProfile,
  getDentistRequests,
  submitDentistRequest,
} from "../../services/dentistService";

import "../../styles/dentist/layout/sidebar.css";
import "../../styles/admin/layout/admin-topbar.css";
import "../../styles/dentist/layout/topbar.css";
import "../../styles/dentist/notifications/notification-popup.css";
import "../../styles/dentist/profile/profile-page.css";
import "../../styles/dentist/shared/responsive.css";

const SCHEDULE_DAYS = [
  { dayOfWeek: 1, label: "Monday" },
  { dayOfWeek: 2, label: "Tuesday" },
  { dayOfWeek: 3, label: "Wednesday" },
  { dayOfWeek: 4, label: "Thursday" },
  { dayOfWeek: 5, label: "Friday" },
  { dayOfWeek: 6, label: "Saturday" },
  { dayOfWeek: 0, label: "Sunday" },
];

const LEAVE_TYPES = [
  "Vacation",
  "Sick Leave",
  "Emergency",
  "Personal",
  "Other",
];

const buildScheduleState = (schedules = []) => {
  const byDay = new Map(
    (Array.isArray(schedules) ? schedules : [])
      .filter((item) => Number.isInteger(item?.dayOfWeek))
      .map((item) => [item.dayOfWeek, item])
  );

  return SCHEDULE_DAYS.map(({ dayOfWeek, label }) => {
    const current = byDay.get(dayOfWeek) || {};

    return {
      id: current.id || null,
      dayOfWeek,
      day: label,
      branch: current.branch || "No branch",
      startTime: current.startTime || "--:--",
      endTime: current.endTime || "--:--",
      isActive: current.isActive !== false,
    };
  });
};

const formatTime = (time) => {
  if (!time || time === "--:--") return "--:--";

  const [hours, minutes] = time.split(":");
  const hour = Number(hours);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;

  return `${hour12}:${minutes} ${suffix}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "";

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatRequestDate = (date) => {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getTodayString = () => getLocalDateString(new Date());

const getCalendarDays = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startOffset = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const cells = [];

  for (let i = 0; i < startOffset; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }

  return cells;
};

const getMonthLabel = (year, month) => {
  return new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
};

const createEmptyScheduleEntry = () => ({
  selectedDays: [],
  branch: "",
  startTime: "",
  endTime: "",
});

const createEmptyScheduleRequest = () => ({
  effectiveDate: "",
  schedules: [],
  reason: "",
  notes: "",
});

const createEmptyLeaveRequest = () => ({
  leaveType: "",
  dates: [],
  reason: "",
  notes: "",
});

const mapRequestRowToHistoryItem = (row) => {
  const submittedAt = row.created_at
    ? formatRequestDate(new Date(row.created_at))
    : "";

  if (row.request_type === "leave") {
    return {
      id: row.id,
      type: "Set Leave",
      destination: "Admin",
      status: row.status,
      submittedAt,
      leaveType: row.leave_type,
      dates: Array.isArray(row.leave_dates) ? row.leave_dates : [],
      reason: row.reason,
      notes: row.notes || "",
      rejectionReason: row.rejection_reason || "",
    };
  }

  return {
    id: row.id,
    type: "Change Schedule",
    destination: "Super Admin",
    status: row.status,
    submittedAt,
    effectiveDate: row.effective_date,
    schedules: (Array.isArray(row.requested_schedules)
      ? row.requested_schedules
      : []
    ).map((schedule, index) => ({
      id: `${row.id}-${index}`,
      branch: schedule.branch,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      days: getScheduleDayLabelsFromValues(schedule.days),
    })),
    reason: row.reason,
    notes: row.notes || "",
    rejectionReason: row.rejection_reason || "",
  };
};

const getScheduleDayLabelsFromValues = (selectedDays = []) => {
  return SCHEDULE_DAYS.filter((day) =>
    selectedDays.includes(day.dayOfWeek)
  ).map((day) => day.label);
};

export default function DentistProfile() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    specialization: "",
    schedules: buildScheduleState([]),
  });

  const [originalProfile, setOriginalProfile] = useState({
    fullName: "",
    phone: "",
    specialization: "",
  });

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestType, setRequestType] = useState("");
  const [requestMessage, setRequestMessage] = useState("");

  const [requestHistory, setRequestHistory] = useState([]);

  const [scheduleRequest, setScheduleRequest] = useState(
    createEmptyScheduleRequest()
  );

  const [scheduleBuilder, setScheduleBuilder] = useState(
    createEmptyScheduleEntry()
  );

  const [leaveRequest, setLeaveRequest] = useState(
    createEmptyLeaveRequest()
  );

  const currentDate = new Date();

  const [calendarDate, setCalendarDate] = useState(
    new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  );

  useEffect(() => {
    let mounted = true;

    const applyProfileData = (data = {}) => {
      const fullName = data.fullName || "";
      const phone = data.phone || "";
      const specialization = data.specialization || "";

      setProfileForm({
        fullName,
        email: data.email || "",
        phone,
        specialization,
        schedules: buildScheduleState(data.schedules || []),
      });

      setOriginalProfile({
        fullName,
        phone,
        specialization,
      });

      setNotifications(data.notifications || []);
    };

    const loadProfile = async () => {
      const cached = await getDentistProfile();

      if (!mounted) return;

      if (cached?.success) {
        applyProfileData(cached.data || {});
      }

      const fresh = await getDentistProfile({
        forceRefresh: true,
      });

      if (!mounted || !fresh?.success) return;

      applyProfileData(fresh.data || {});
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadRequests = async () => {
      const result = await getDentistRequests({ forceRefresh: true });

      if (mounted && result?.success && Array.isArray(result.data)) {
        setRequestHistory(result.data.map(mapRequestRowToHistoryItem));
      }
    };

    loadRequests();

    return () => {
      mounted = false;
    };
  }, []);

  const calendarDays = useMemo(() => {
    return getCalendarDays(
      calendarDate.getFullYear(),
      calendarDate.getMonth()
    );
  }, [calendarDate]);

  const availableBranches = useMemo(() => {
    return [
      ...new Set(
        profileForm.schedules
          .map((schedule) => schedule.branch)
          .filter(
            (branch) =>
              branch &&
              branch !== "No branch"
          )
      ),
    ];
  }, [profileForm.schedules]);

  const hasProfileChanges = useMemo(() => {
    return (
      profileForm.fullName.trim() !==
        originalProfile.fullName.trim() ||
      profileForm.phone.trim() !==
        originalProfile.phone.trim() ||
      profileForm.specialization.trim() !==
        originalProfile.specialization.trim()
    );
  }, [
    profileForm.fullName,
    profileForm.phone,
    profileForm.specialization,
    originalProfile,
  ]);

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

  const handleInputChange = (key, value) => {
    setProfileForm((prev) => ({
      ...prev,
      [key]: value,
    }));

    setSaveMessage("");
  };

  const handleSave = async () => {
    if (!hasProfileChanges) return;

    setIsSaving(true);
    setSaveMessage("");

    const result = await updateDentistProfile({
      fullName: profileForm.fullName,
      phone: profileForm.phone,
      specialization: profileForm.specialization,
    });

    if (!result?.success) {
      setSaveMessage(
        result?.message || "Failed to save changes."
      );
      setIsSaving(false);
      return;
    }

    setOriginalProfile({
      fullName: profileForm.fullName,
      phone: profileForm.phone,
      specialization: profileForm.specialization,
    });

    setSaveMessage("Profile updated successfully.");
    setIsSaving(false);
  };

  const resetRequestForm = () => {
    setRequestType("");
    setRequestMessage("");

    setScheduleRequest(
      createEmptyScheduleRequest()
    );

    setScheduleBuilder(
      createEmptyScheduleEntry()
    );

    setLeaveRequest(
      createEmptyLeaveRequest()
    );

    const now = new Date();

    setCalendarDate(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      )
    );
  };

  const handleOpenRequestModal = () => {
    resetRequestForm();
    setIsRequestModalOpen(true);
  };

  const handleCloseRequestModal = () => {
    setIsRequestModalOpen(false);
    resetRequestForm();
  };

  const handleScheduleRequestChange = (
    key,
    value
  ) => {
    setScheduleRequest((prev) => ({
      ...prev,
      [key]: value,
    }));

    setRequestMessage("");
  };

  const handleScheduleBuilderChange = (
    key,
    value
  ) => {
    setScheduleBuilder((prev) => ({
      ...prev,
      [key]: value,
    }));

    setRequestMessage("");
  };

  const handleScheduleDayToggle = (
    dayOfWeek
  ) => {
    setScheduleBuilder((prev) => {
      const alreadySelected =
        prev.selectedDays.includes(dayOfWeek);

      return {
        ...prev,
        selectedDays: alreadySelected
          ? prev.selectedDays.filter(
              (day) => day !== dayOfWeek
            )
          : [
              ...prev.selectedDays,
              dayOfWeek,
            ],
      };
    });

    setRequestMessage("");
  };

  const handleAddSchedule = () => {
    setRequestMessage("");

    if (
      scheduleBuilder.selectedDays.length === 0
    ) {
      setRequestMessage(
        "Please select at least one working day."
      );
      return;
    }

    if (!scheduleBuilder.branch) {
      setRequestMessage(
        "Please select a branch."
      );
      return;
    }

    if (
      !scheduleBuilder.startTime ||
      !scheduleBuilder.endTime
    ) {
      setRequestMessage(
        "Please enter the start and end time."
      );
      return;
    }

    if (
      scheduleBuilder.startTime >=
      scheduleBuilder.endTime
    ) {
      setRequestMessage(
        "End time must be later than start time."
      );
      return;
    }

    const newSchedule = {
      id:
        Date.now() +
        Math.random(),
      selectedDays: [
        ...scheduleBuilder.selectedDays,
      ],
      branch: scheduleBuilder.branch,
      startTime:
        scheduleBuilder.startTime,
      endTime:
        scheduleBuilder.endTime,
    };

    setScheduleRequest((prev) => ({
      ...prev,
      schedules: [
        ...prev.schedules,
        newSchedule,
      ],
    }));

    setScheduleBuilder(
      createEmptyScheduleEntry()
    );
  };

  const handleRemoveSchedule = (
    scheduleId
  ) => {
    setScheduleRequest((prev) => ({
      ...prev,
      schedules:
        prev.schedules.filter(
          (schedule) =>
            schedule.id !== scheduleId
        ),
    }));
  };

  const getScheduleDayLabels = (
    selectedDays
  ) => {
    return SCHEDULE_DAYS.filter((day) =>
      selectedDays.includes(
        day.dayOfWeek
      )
    ).map((day) => day.label);
  };

  const handleLeaveRequestChange = (
    key,
    value
  ) => {
    setLeaveRequest((prev) => ({
      ...prev,
      [key]: value,
    }));

    setRequestMessage("");
  };

  const handleLeaveDateToggle = (
    date
  ) => {
    const dateString =
      getLocalDateString(date);

    if (
      dateString <
      getTodayString()
    ) {
      return;
    }

    setLeaveRequest((prev) => {
      const alreadySelected =
        prev.dates.includes(dateString);

      return {
        ...prev,
        dates: alreadySelected
          ? prev.dates.filter(
              (item) =>
                item !== dateString
            )
          : [
              ...prev.dates,
              dateString,
            ].sort(),
      };
    });

    setRequestMessage("");
  };

  const handleRemoveLeaveDate = (
    dateString
  ) => {
    setLeaveRequest((prev) => ({
      ...prev,
      dates: prev.dates.filter(
        (date) =>
          date !== dateString
      ),
    }));
  };

  const handlePreviousMonth = () => {
    setCalendarDate((prev) => {
      const previous = new Date(
        prev.getFullYear(),
        prev.getMonth() - 1,
        1
      );

      const currentMonth =
        new Date();

      currentMonth.setDate(1);
      currentMonth.setHours(
        0,
        0,
        0,
        0
      );

      if (
        previous <
        currentMonth
      ) {
        return prev;
      }

      return previous;
    });
  };

  const handleNextMonth = () => {
    setCalendarDate(
      (prev) =>
        new Date(
          prev.getFullYear(),
          prev.getMonth() + 1,
          1
        )
    );
  };

  const handleSubmitRequest = async () => {
    setRequestMessage("");

    if (!requestType) {
      setRequestMessage(
        "Please select a request type."
      );
      return;
    }

    if (requestType === "leave") {
      if (!leaveRequest.leaveType) {
        setRequestMessage(
          "Please select a leave type."
        );
        return;
      }

      if (
        leaveRequest.dates.length === 0
      ) {
        setRequestMessage(
          "Please select at least one leave date."
        );
        return;
      }

      if (
        !leaveRequest.reason.trim()
      ) {
        setRequestMessage(
          "Please enter your reason for leave."
        );
        return;
      }

      const result = await submitDentistRequest({
        requestType: "leave",
        leaveType: leaveRequest.leaveType,
        leaveDates: [...leaveRequest.dates],
        reason: leaveRequest.reason,
        notes: leaveRequest.notes,
      });

      if (!result?.success) {
        setRequestMessage(
          result?.message || "Failed to submit leave request."
        );
        return;
      }

      setRequestHistory((prev) => [
        mapRequestRowToHistoryItem(result.data),
        ...prev,
      ]);

      setIsRequestModalOpen(false);
      resetRequestForm();
      return;
    }

    if (
      requestType === "schedule"
    ) {
      if (
        !scheduleRequest.effectiveDate
      ) {
        setRequestMessage(
          "Please select an effective date."
        );
        return;
      }

      if (
        scheduleRequest.schedules
          .length === 0
      ) {
        setRequestMessage(
          "Please add at least one requested schedule."
        );
        return;
      }

      if (
        !scheduleRequest.reason.trim()
      ) {
        setRequestMessage(
          "Please enter the reason for schedule change."
        );
        return;
      }

      const result = await submitDentistRequest({
        requestType: "schedule_change",
        effectiveDate: scheduleRequest.effectiveDate,
        requestedSchedules: scheduleRequest.schedules.map(
          (schedule) => ({
            days: schedule.selectedDays,
            branch: schedule.branch,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
          })
        ),
        reason: scheduleRequest.reason,
        notes: scheduleRequest.notes,
      });

      if (!result?.success) {
        setRequestMessage(
          result?.message || "Failed to submit schedule change request."
        );
        return;
      }

      setRequestHistory((prev) => [
        mapRequestRowToHistoryItem(result.data),
        ...prev,
      ]);

      setIsRequestModalOpen(false);
      resetRequestForm();
    }
  };

  return (
    <div className="dentist-dashboard">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() =>
          setIsSidebarOpen(false)
        }
      />

      <main className="main-content">
        <Topbar
          title="Profile"
          notifications={notifications}
          isNotificationOpen={
            isNotificationOpen
          }
          onToggleNotifications={
            handleToggleNotifications
          }
          onCloseNotifications={
            handleCloseNotifications
          }
          onMarkAllRead={
            handleMarkAllRead
          }
          profileImage={profileImage}
          onToggleSidebar={() =>
            setIsSidebarOpen(
              (prev) => !prev
            )
          }
        />

        <section className="profile-page">
          <div className="profile-card-page">
            <h2 className="profile-section-title">
              Profile Information
            </h2>

            <div className="profile-form-grid two">
              <div className="profile-field">
                <label>
                  Full Name
                </label>

                <input
                  type="text"
                  value={
                    profileForm.fullName
                  }
                  onChange={(e) =>
                    handleInputChange(
                      "fullName",
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="profile-field">
                <label>Email</label>

                <input
                  type="email"
                  value={
                    profileForm.email
                  }
                  disabled
                  className="readonly-input"
                />
              </div>

              <div className="profile-field">
                <label>
                  Contact Number
                </label>

                <input
                  type="text"
                  value={
                    profileForm.phone
                  }
                  onChange={(e) =>
                    handleInputChange(
                      "phone",
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="profile-field">
                <label>
                  Specialization
                </label>

                <input
                  type="text"
                  value={
                    profileForm.specialization
                  }
                  onChange={(e) =>
                    handleInputChange(
                      "specialization",
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

            {saveMessage && (
              <p className="section-subtitle">
                {saveMessage}
              </p>
            )}

            {hasProfileChanges && (
              <div className="profile-save-wrap profile-save-wrap-top">
                <button
                  type="button"
                  className="profile-save-btn"
                  disabled={isSaving}
                  onClick={handleSave}
                >
                  {isSaving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            )}

            <div className="profile-schedule-heading">
              <div>
                <h2 className="profile-section-title schedule-title">
                  Schedule
                </h2>

                <p className="profile-schedule-subtitle">
                  View your current
                  schedule or submit a
                  request for schedule
                  changes and leave.
                </p>
              </div>

              <button
                type="button"
                className="schedule-request-btn"
                onClick={
                  handleOpenRequestModal
                }
              >
                Request Schedule / Leave
              </button>
            </div>

            <div className="schedule-grid-modern">
              {profileForm.schedules.map(
                (schedule) => (
                  <div
                    className="schedule-modern-card"
                    key={
                      schedule.dayOfWeek
                    }
                  >
                    <div className="schedule-modern-day">
                      {schedule.day}
                    </div>

                    <div className="schedule-modern-details">
                      <div className="schedule-modern-item">
                        <span className="schedule-modern-label">
                          Branch
                        </span>

                        <span className="schedule-modern-value">
                          {schedule.branch ||
                            "No branch"}
                        </span>
                      </div>

                      <div className="schedule-modern-item">
                        <span className="schedule-modern-label">
                          Time
                        </span>

                        <span className="schedule-modern-value">
                          {formatTime(
                            schedule.startTime
                          )}{" "}
                          —{" "}
                          {formatTime(
                            schedule.endTime
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="request-history-section">
              <div className="request-history-heading">
                <div>
                  <h2 className="profile-section-title schedule-title">
                    Request History
                  </h2>

                  <p className="profile-schedule-subtitle">
                    Track the status of
                    your submitted
                    requests.
                  </p>
                </div>
              </div>

              {requestHistory.length ===
              0 ? (
                <div className="request-empty-state">
                  <div className="request-empty-icon">
                    ↗
                  </div>

                  <h3>
                    No requests yet
                  </h3>

                  <p>
                    Your schedule change
                    and leave requests
                    will appear here
                    after submission.
                  </p>
                </div>
              ) : (
                <div className="request-history-list">
                  {requestHistory.map(
                    (request) => (
                      <div
                        className="request-history-card"
                        key={request.id}
                      >
                        <div className="request-history-top">
                          <div>
                            <h3>
                              {
                                request.type
                              }
                            </h3>

                            <p>
                              Submitted{" "}
                              {
                                request.submittedAt
                              }{" "}
                              • Sent to{" "}
                              {
                                request.destination
                              }
                            </p>
                          </div>

                          <span
                            className={`request-status ${request.status.toLowerCase()}`}
                          >
                            {
                              request.status
                            }
                          </span>
                        </div>

                        {request.type ===
                        "Set Leave" ? (
                          <div className="request-history-details">
                            <div>
                              <span>
                                Leave Type
                              </span>

                              <strong>
                                {
                                  request.leaveType
                                }
                              </strong>
                            </div>

                            <div>
                              <span>
                                Leave
                                Date(s)
                              </span>

                              <strong>
                                {request.dates
                                  .map(
                                    (
                                      date
                                    ) =>
                                      formatDate(
                                        date
                                      )
                                  )
                                  .join(
                                    ", "
                                  )}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Reason
                              </span>

                              <strong>
                                {
                                  request.reason
                                }
                              </strong>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="request-history-details">
                              <div>
                                <span>
                                  Effective
                                  Date
                                </span>

                                <strong>
                                  {formatDate(
                                    request.effectiveDate
                                  )}
                                </strong>
                              </div>

                              <div>
                                <span>
                                  Requested
                                  Schedules
                                </span>

                                <strong>
                                  {
                                    request
                                      .schedules
                                      .length
                                  }{" "}
                                  schedule
                                  {request
                                    .schedules
                                    .length !==
                                  1
                                    ? "s"
                                    : ""}
                                </strong>
                              </div>

                              <div>
                                <span>
                                  Reason
                                </span>

                                <strong>
                                  {
                                    request.reason
                                  }
                                </strong>
                              </div>
                            </div>

                            <div className="history-schedule-list">
                              {request.schedules.map(
                                (
                                  schedule
                                ) => (
                                  <div
                                    className="history-schedule-item"
                                    key={
                                      schedule.id
                                    }
                                  >
                                    <strong>
                                      {schedule.days.join(
                                        ", "
                                      )}
                                    </strong>

                                    <span>
                                      {
                                        schedule.branch
                                      }
                                    </span>

                                    <span>
                                      {formatTime(
                                        schedule.startTime
                                      )}{" "}
                                      —{" "}
                                      {formatTime(
                                        schedule.endTime
                                      )}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {isRequestModalOpen && (
        <div
          className="schedule-request-overlay"
          onMouseDown={
            handleCloseRequestModal
          }
        >
          <div
            className="schedule-request-modal"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >
            <div className="schedule-request-modal-header">
              <div>
                <h2>
                  Schedule & Leave
                  Request
                </h2>

                <p>
                  Select the type of
                  request you would like
                  to submit.
                </p>
              </div>

              <button
                type="button"
                className="schedule-request-close"
                onClick={
                  handleCloseRequestModal
                }
              >
                ×
              </button>
            </div>

            <div className="request-type-grid">
              <button
                type="button"
                className={`request-type-card ${
                  requestType ===
                  "schedule"
                    ? "active"
                    : ""
                }`}
                onClick={() => {
                  setRequestType(
                    "schedule"
                  );
                  setRequestMessage("");
                }}
              >
                <div className="request-type-icon">
                  ↻
                </div>

                <div>
                  <strong>
                    Change Schedule
                  </strong>

                  <span>
                    Request multiple
                    working days, time
                    frames, or branch
                    assignments.
                  </span>
                </div>
              </button>

              <button
                type="button"
                className={`request-type-card ${
                  requestType ===
                  "leave"
                    ? "active"
                    : ""
                }`}
                onClick={() => {
                  setRequestType(
                    "leave"
                  );
                  setRequestMessage("");
                }}
              >
                <div className="request-type-icon">
                  ▣
                </div>

                <div>
                  <strong>
                    Set Leave
                  </strong>

                  <span>
                    Select one or
                    multiple dates when
                    you will be
                    unavailable.
                  </span>
                </div>
              </button>
            </div>

            {!requestType && (
              <div className="request-start-message">
                Select a request type
                above to continue.
              </div>
            )}

            {requestType ===
              "schedule" && (
              <div className="request-form-content">
                <div className="current-schedule-box">
                  <div className="current-schedule-header">
                    <h3>
                      Current Schedule
                    </h3>

                    <p>
                      Your current
                      schedule is shown
                      below for
                      reference.
                    </p>
                  </div>

                  <div className="current-schedule-list">
                    {profileForm.schedules.map(
                      (schedule) => (
                        <div
                          className="current-schedule-row"
                          key={
                            schedule.dayOfWeek
                          }
                        >
                          <strong>
                            {
                              schedule.day
                            }
                          </strong>

                          <span>
                            {
                              schedule.branch
                            }{" "}
                            •{" "}
                            {formatTime(
                              schedule.startTime
                            )}{" "}
                            —{" "}
                            {formatTime(
                              schedule.endTime
                            )}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="request-field">
                  <label>
                    Requested Effective
                    Date
                  </label>

                  <input
                    type="date"
                    min={getTodayString()}
                    value={
                      scheduleRequest.effectiveDate
                    }
                    onChange={(e) =>
                      handleScheduleRequestChange(
                        "effectiveDate",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="schedule-builder-section">
                  <div className="schedule-builder-header">
                    <div>
                      <h3>
                        Build Requested
                        Schedule
                      </h3>

                      <p>
                        Select one or
                        more days for
                        this time frame,
                        then add it to
                        your request.
                      </p>
                    </div>

                    <span>
                      {
                        scheduleRequest
                          .schedules
                          .length
                      }{" "}
                      added
                    </span>
                  </div>

                  <div className="schedule-builder-card">
                    <div className="request-field">
                      <label>
                        Working Days
                      </label>

                      <div className="request-day-selector">
                        {SCHEDULE_DAYS.map(
                          (day) => (
                            <button
                              type="button"
                              key={
                                day.dayOfWeek
                              }
                              className={
                                scheduleBuilder.selectedDays.includes(
                                  day.dayOfWeek
                                )
                                  ? "active"
                                  : ""
                              }
                              onClick={() =>
                                handleScheduleDayToggle(
                                  day.dayOfWeek
                                )
                              }
                            >
                              {day.label.slice(
                                0,
                                3
                              )}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <div className="schedule-builder-fields">
                      <div className="request-field">
                        <label>
                          Branch
                        </label>

                        <select
                          value={
                            scheduleBuilder.branch
                          }
                          onChange={(e) =>
                            handleScheduleBuilderChange(
                              "branch",
                              e.target
                                .value
                            )
                          }
                        >
                          <option value="">
                            Select branch
                          </option>

                          {availableBranches.map(
                            (
                              branch
                            ) => (
                              <option
                                key={
                                  branch
                                }
                                value={
                                  branch
                                }
                              >
                                {
                                  branch
                                }
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div className="request-field">
                        <label>
                          Start Time
                        </label>

                        <input
                          type="time"
                          value={
                            scheduleBuilder.startTime
                          }
                          onChange={(e) =>
                            handleScheduleBuilderChange(
                              "startTime",
                              e.target
                                .value
                            )
                          }
                        />
                      </div>

                      <div className="request-field">
                        <label>
                          End Time
                        </label>

                        <input
                          type="time"
                          value={
                            scheduleBuilder.endTime
                          }
                          onChange={(e) =>
                            handleScheduleBuilderChange(
                              "endTime",
                              e.target
                                .value
                            )
                          }
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      className="add-requested-schedule-btn"
                      onClick={
                        handleAddSchedule
                      }
                    >
                      + Add Schedule
                    </button>
                  </div>

                  {scheduleRequest.schedules
                    .length > 0 && (
                    <div className="added-requested-schedules">
                      <div className="added-requested-heading">
                        <strong>
                          Requested
                          Schedules
                        </strong>

                        <span>
                          Multiple time
                          frames for the
                          same day are
                          allowed.
                        </span>
                      </div>

                      <div className="added-requested-list">
                        {scheduleRequest.schedules.map(
                          (
                            schedule,
                            index
                          ) => {
                            const days =
                              getScheduleDayLabels(
                                schedule.selectedDays
                              );

                            return (
                              <div
                                className="added-requested-card"
                                key={
                                  schedule.id
                                }
                              >
                                <div className="added-requested-number">
                                  {index +
                                    1}
                                </div>

                                <div className="added-requested-info">
                                  <strong>
                                    {days.join(
                                      ", "
                                    )}
                                  </strong>

                                  <span>
                                    {
                                      schedule.branch
                                    }
                                  </span>

                                  <span>
                                    {formatTime(
                                      schedule.startTime
                                    )}{" "}
                                    —{" "}
                                    {formatTime(
                                      schedule.endTime
                                    )}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  className="remove-requested-schedule"
                                  onClick={() =>
                                    handleRemoveSchedule(
                                      schedule.id
                                    )
                                  }
                                >
                                  ×
                                </button>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="request-form-grid schedule-reason-grid">
                  <div className="request-field full">
                    <label>
                      Reason
                    </label>

                    <textarea
                      rows="4"
                      placeholder="Enter the reason for your requested schedule change..."
                      value={
                        scheduleRequest.reason
                      }
                      onChange={(e) =>
                        handleScheduleRequestChange(
                          "reason",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="request-field full">
                    <label>
                      Additional Notes{" "}
                      <span className="optional-label">
                        (Optional)
                      </span>
                    </label>

                    <textarea
                      rows="3"
                      placeholder="Add any additional information..."
                      value={
                        scheduleRequest.notes
                      }
                      onChange={(e) =>
                        handleScheduleRequestChange(
                          "notes",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {requestType ===
              "leave" && (
              <div className="request-form-content">
                <div className="request-field">
                  <label>
                    Leave Type
                  </label>

                  <select
                    value={
                      leaveRequest.leaveType
                    }
                    onChange={(e) =>
                      handleLeaveRequestChange(
                        "leaveType",
                        e.target.value
                      )
                    }
                  >
                    <option value="">
                      Select leave type
                    </option>

                    {LEAVE_TYPES.map(
                      (type) => (
                        <option
                          key={type}
                          value={type}
                        >
                          {type}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="request-calendar-section">
                  <div className="request-calendar-label">
                    <div>
                      <label>
                        Select Leave
                        Date(s)
                      </label>

                      <p>
                        You can select
                        multiple dates.
                        The dates do not
                        need to be
                        consecutive.
                      </p>
                    </div>

                    {leaveRequest.dates
                      .length > 0 && (
                      <span className="selected-date-count">
                        {
                          leaveRequest
                            .dates
                            .length
                        }{" "}
                        selected
                      </span>
                    )}
                  </div>

                  <div className="leave-calendar">
                    <div className="leave-calendar-header">
                      <button
                        type="button"
                        onClick={
                          handlePreviousMonth
                        }
                      >
                        ‹
                      </button>

                      <strong>
                        {getMonthLabel(
                          calendarDate.getFullYear(),
                          calendarDate.getMonth()
                        )}
                      </strong>

                      <button
                        type="button"
                        onClick={
                          handleNextMonth
                        }
                      >
                        ›
                      </button>
                    </div>

                    <div className="leave-calendar-weekdays">
                      <span>Sun</span>
                      <span>Mon</span>
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span>Sat</span>
                    </div>

                    <div className="leave-calendar-days">
                      {calendarDays.map(
                        (
                          date,
                          index
                        ) => {
                          if (!date) {
                            return (
                              <div
                                className="leave-calendar-empty"
                                key={`empty-${index}`}
                              />
                            );
                          }

                          const dateString =
                            getLocalDateString(
                              date
                            );

                          const isPast =
                            dateString <
                            getTodayString();

                          const isSelected =
                            leaveRequest.dates.includes(
                              dateString
                            );

                          const isToday =
                            dateString ===
                            getTodayString();

                          return (
                            <button
                              type="button"
                              key={
                                dateString
                              }
                              disabled={
                                isPast
                              }
                              className={[
                                "leave-calendar-day",
                                isSelected
                                  ? "selected"
                                  : "",
                                isToday
                                  ? "today"
                                  : "",
                                isPast
                                  ? "past"
                                  : "",
                              ]
                                .filter(
                                  Boolean
                                )
                                .join(
                                  " "
                                )}
                              onClick={() =>
                                handleLeaveDateToggle(
                                  date
                                )
                              }
                            >
                              {date.getDate()}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                </div>

                {leaveRequest.dates
                  .length > 0 && (
                  <div className="selected-leave-section">
                    <label>
                      Selected Leave
                      Dates
                    </label>

                    <div className="selected-leave-chips">
                      {leaveRequest.dates.map(
                        (date) => (
                          <div
                            className="selected-leave-chip"
                            key={date}
                          >
                            <span>
                              {formatDate(
                                date
                              )}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveLeaveDate(
                                  date
                                )
                              }
                            >
                              ×
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                <div className="request-form-grid">
                  <div className="request-field full">
                    <label>
                      Reason
                    </label>

                    <textarea
                      rows="4"
                      placeholder="Enter your reason for leave..."
                      value={
                        leaveRequest.reason
                      }
                      onChange={(e) =>
                        handleLeaveRequestChange(
                          "reason",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="request-field full">
                    <label>
                      Additional Notes{" "}
                      <span className="optional-label">
                        (Optional)
                      </span>
                    </label>

                    <textarea
                      rows="3"
                      placeholder="Add any additional information..."
                      value={
                        leaveRequest.notes
                      }
                      onChange={(e) =>
                        handleLeaveRequestChange(
                          "notes",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {requestMessage && (
              <div className="request-error-message">
                {requestMessage}
              </div>
            )}

            {requestType && (
              <div className="schedule-request-modal-actions">
                <button
                  type="button"
                  className="request-cancel-btn"
                  onClick={
                    handleCloseRequestModal
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="request-submit-btn"
                  onClick={
                    handleSubmitRequest
                  }
                >
                  Submit Request
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}