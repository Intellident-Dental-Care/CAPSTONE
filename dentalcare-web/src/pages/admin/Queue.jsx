import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/admin/layout/AdminSidebar";
import AdminTopbar from "../../components/admin/layout/AdminTopbar";
import { applyQueueDelay, getTodayQueue, updateQueueStatus } from "../../services/adminService";

import "../../styles/admin/dashboard/admin-layout.css";
import "../../styles/admin/layout/admin-sidebar.css";
import "../../styles/admin/layout/admin-topbar.css";
import "../../styles/admin/notifications/admin-notification-popup.css";
import "../../styles/admin/shared/admin-responsive.css";
import "../../styles/admin/queue/queue.css";

export default function Queue() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Queue Update:",
      message: "Patient #2 is now in-treatment",
      time: "2 mins ago",
    },
    {
      id: 2,
      title: "Upcoming Patient:",
      message: "Patient #3 is the next in queue",
      time: "5 mins ago",
    },
    {
      id: 3,
      title: "Dentist Availability:",
      message: "Dr. Shin Tamura is ready for the next patient",
      time: "8 mins ago",
    },
  ]);

  const [queueList, setQueueList] = useState([]);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showStartNextModal, setShowStartNextModal] = useState(false);
  const [showDelayModal, setShowDelayModal] = useState(false);

  const [selectedDelay, setSelectedDelay] = useState("10");
  const [customDelay, setCustomDelay] = useState("");
  const [delayUnit, setDelayUnit] = useState("minutes");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [delayOffsetMinutes, setDelayOffsetMinutes] = useState(0);
  const [isApplyingDelay, setIsApplyingDelay] = useState(false);
  const [estimatedWaitMinutes, setEstimatedWaitMinutes] = useState(0);
  const [nextPatientWaitMinutes, setNextPatientWaitMinutes] = useState(0);

  const loadQueue = async () => {
    const response = await getTodayQueue({ forceRefresh: true });
    if (!response?.success) {
      return;
    }

    const mapped = (response?.data?.bookings || []).map((item) => ({
      id: item.id,
      queueNumber: item.queueNumber,
      name: item.patientName,
      time: item.time,
      status: item.status,
      rawStatus: item.rawStatus,
      procedure: item.procedure,
      dentist: item.dentist,
    }));

    setDelayOffsetMinutes(Number(response?.data?.delay?.totalDelayMinutes || 0));
    setEstimatedWaitMinutes(Number(response?.data?.estimatedWaitMinutes || 0));
    setNextPatientWaitMinutes(Number(response?.data?.nextPatientWaitMinutes || 0));

    setQueueList(mapped.length ? mapped : []);
  };

  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      if (!mounted) return;
      await loadQueue();
    };

    refresh();

    return () => {
      mounted = false;
    };
  }, []);

  const currentPatient = useMemo(() => {
    return (
      queueList.find((item) => item.status === "In Treatment") ||
      queueList.find((item) => item.status === "In Queue") ||
      null
    );
  }, [queueList]);

  const waitingPatients = useMemo(
    () => queueList.filter((item) => item.rawStatus === "pending" || item.status === "Waiting"),
    [queueList]
  );

  const nextPatient = waitingPatients[0] || null;

  const completedCount = useMemo(
    () => queueList.filter((item) => item.status === "Completed").length,
    [queueList]
  );

  const waitingCount = waitingPatients.length;
  const estimatedWait = nextPatient
    ? Math.max(0, Number.isFinite(nextPatientWaitMinutes) ? nextPatientWaitMinutes : 0)
    : 0;
  const nextPatientWait = nextPatient
    ? Math.max(0, Number.isFinite(nextPatientWaitMinutes) ? nextPatientWaitMinutes : 0)
    : 0;

  const today = new Date();
  const todayFormatted = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const currentMonth = today.toLocaleString("default", { month: "long" });
  const currentYear = today.getFullYear();
  const currentDay = today.getDate();

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

  const handleCompleteClick = () => {
    if (!currentPatient) return;
    setShowCompleteConfirm(true);
  };

  const confirmCompleteTreatment = async () => {
    if (!currentPatient) return;

    const result = await updateQueueStatus(currentPatient.id, "completed");
    if (!result?.success) {
      setNotifications((prev) => [
        {
          id: Date.now(),
          title: "Queue Update Failed:",
          message: result?.message || "Could not mark patient as completed",
          time: "Just now",
        },
        ...prev,
      ]);
      return;
    }

    setQueueList((prev) =>
      prev.map((item) =>
        item.id === currentPatient.id
          ? { ...item, status: "Completed", rawStatus: "completed" }
          : item
      )
    );

    setShowCompleteConfirm(false);

    if (nextPatient) {
      setShowStartNextModal(true);
    }

    await loadQueue();
  };

  const startNextTreatment = async () => {
    if (!nextPatient) {
      setShowStartNextModal(false);
      return;
    }

    const result = await updateQueueStatus(nextPatient.id, "in treatment");
    if (!result?.success) {
      setNotifications((prev) => [
        {
          id: Date.now(),
          title: "Queue Update Failed:",
          message: result?.message || "Could not start treatment",
          time: "Just now",
        },
        ...prev,
      ]);
      setShowStartNextModal(false);
      return;
    }

    setQueueList((prev) =>
      prev.map((item) =>
        item.id === nextPatient.id
          ? { ...item, status: "In Treatment", rawStatus: "in_treatment" }
          : item
      )
    );

    setNotifications((prev) => [
      {
        id: Date.now(),
        title: "Queue Update:",
        message: `Patient #${nextPatient.queueNumber} is now in-treatment`,
        time: "Just now",
      },
      ...prev,
    ]);

    setShowStartNextModal(false);
    await loadQueue();
  };

  const handleDelayConfirm = async () => {
    if (isApplyingDelay) return;

    let delayMinutes = 0;
    let chosenDelayText = "";

    if (selectedDelay === "custom") {
      const raw = Number(customDelay || 0);
      if (!Number.isFinite(raw) || raw <= 0) {
        return;
      }

      delayMinutes = delayUnit === "hours" ? raw * 60 : raw;
      chosenDelayText = `${raw} ${delayUnit}`;
    } else {
      delayMinutes = Number(selectedDelay || 0);
      if (!Number.isFinite(delayMinutes) || delayMinutes <= 0) {
        return;
      }
      chosenDelayText = `${selectedDelay} minutes`;
    }

    setIsApplyingDelay(true);

    const finalMessage =
      notificationMessage.trim() !== ""
        ? notificationMessage.trim()
        : `Queue delayed by ${chosenDelayText}`;

    const response = await applyQueueDelay({
      delayMinutes,
      message: finalMessage,
    });

    if (!response?.success) {
      setIsApplyingDelay(false);
      return;
    }

    setDelayOffsetMinutes(Number(response?.data?.delay?.totalDelayMinutes || 0));

    setNotifications((prev) => [
      {
        id: Date.now(),
        title: "Schedule Delay:",
        message: finalMessage,
        time: "Just now",
      },
      ...prev,
    ]);

    setShowDelayModal(false);
    setSelectedDelay("10");
    setCustomDelay("");
    setDelayUnit("minutes");
    setNotificationMessage("");

    await loadQueue();
    setIsApplyingDelay(false);
  };

  return (
    <div className="admin-dashboard-page">
      <AdminSidebar />

      <main className="admin-main-content">
        <AdminTopbar
          title="Queue Control"
          notifications={notifications}
          isNotificationOpen={isNotificationOpen}
          onToggleNotifications={handleToggleNotifications}
          onCloseNotifications={handleCloseNotifications}
          onMarkAllRead={handleMarkAllRead}
        />

        <div className="queue-page">
          <div className="queue-header">
            <div>
              <h2 className="queue-page-title">Queue Control</h2>
              <p className="queue-page-subtitle">
                Manage the live queue, next patient, and schedule delays for
                today.
              </p>
            </div>

            <div className="queue-header-date">
              <span>Today</span>
              <strong>{todayFormatted}</strong>
            </div>
          </div>

          <div className="queue-stats-grid">
            <div className="queue-stat-card">
              <span className="queue-stat-label">Now Serving</span>
              <h3>{currentPatient ? `#${currentPatient.queueNumber}` : "--"}</h3>
              <p>{currentPatient ? currentPatient.name : "No active patient"}</p>
            </div>

            <div className="queue-stat-card">
              <span className="queue-stat-label">Patients Waiting</span>
              <h3>{waitingCount}</h3>
              <p>Currently in today’s queue</p>
            </div>

            <div className="queue-stat-card">
              <span className="queue-stat-label">Completed</span>
              <h3>{completedCount}</h3>
              <p>Finished treatments today</p>
            </div>

            <div className="queue-stat-card">
              <span className="queue-stat-label">Estimated Wait</span>
              <h3>{estimatedWait} min</h3>
              <p>For next patient, includes {delayOffsetMinutes} min delay offset</p>
            </div>
          </div>

          <div className="queue-content-grid">
            <section className="queue-left-section">
              <div className="queue-live-card">
                <div className="queue-card-head">
                  <h3>Live Queue</h3>
                  <span className="queue-live-badge">Active</span>
                </div>

                {currentPatient ? (
                  <>
                    <div className="queue-live-number">
                      #{currentPatient.queueNumber}
                    </div>

                    <div className="queue-live-status">
                      {currentPatient.status}
                    </div>

                    <div className="queue-live-details">
                      <div className="queue-live-detail-item">
                        <span>Patient</span>
                        <strong>{currentPatient.name}</strong>
                      </div>

                      <div className="queue-live-detail-item">
                        <span>Appointment</span>
                        <strong>{currentPatient.time}</strong>
                      </div>

                      <div className="queue-live-detail-item">
                        <span>Procedure</span>
                        <strong>{currentPatient.procedure}</strong>
                      </div>

                      <div className="queue-live-detail-item">
                        <span>Dentist</span>
                        <strong>{currentPatient.dentist}</strong>
                      </div>
                    </div>

                    <div className="queue-progress-wrap">
                      <p>
                        Estimated wait for the next patient:{" "}
                        <strong>
                          {nextPatient ? `${nextPatientWait} minutes` : "No patient waiting"}
                        </strong>
                      </p>

                      <div className="queue-progress-bar">
                        <div className="queue-progress-fill"></div>
                      </div>
                    </div>

                    <button
                      className="queue-primary-btn queue-complete-btn"
                      onClick={handleCompleteClick}
                    >
                      Complete Treatment
                    </button>
                  </>
                ) : (
                  <div className="queue-empty-state">
                    <h4>No Active Treatment</h4>
                    <p>There is no patient currently being treated.</p>
                  </div>
                )}
              </div>

              <div className="queue-lower-grid">
                <div className="queue-next-card">
                  <div className="queue-card-head">
                    <h3>Next Patient</h3>
                  </div>

                  {nextPatient ? (
                    <>
                      <div className="queue-next-number">
                        #{nextPatient.queueNumber}
                      </div>
                      <h4>{nextPatient.name}</h4>
                      <p>{nextPatient.time}</p>
                      <span className="queue-chip">{nextPatient.procedure}</span>

                      <div className="queue-next-meta">
                        <span>Assigned Dentist</span>
                        <strong>{nextPatient.dentist}</strong>
                      </div>
                    </>
                  ) : (
                    <div className="queue-empty-state">
                      <p>No next patient in queue.</p>
                    </div>
                  )}
                </div>

                <div className="queue-delay-card">
                  <div className="queue-card-head">
                    <h3>Delay Management</h3>
                  </div>

                  <p className="queue-delay-text">
                    Update the schedule and notify affected patients if there is
                    a delay in treatment flow.
                  </p>

                  <div className="queue-delay-preview">
                    <div className="queue-delay-preview-item">
                      <span>Suggested Action</span>
                      <strong>Notify waiting patients</strong>
                    </div>

                    <div className="queue-delay-preview-item">
                      <span>Affected Queue</span>
                      <strong>{waitingCount} patient(s)</strong>
                    </div>
                  </div>

                  <button
                    className="queue-primary-btn queue-delay-btn"
                    onClick={() => setShowDelayModal(true)}
                  >
                    Update Schedule & Notify
                  </button>
                </div>
              </div>
            </section>

            <aside className="queue-right-section">
              <div className="queue-list-card">
                <div className="queue-card-head">
                  <h3>Today’s Queue</h3>
                  <span className="queue-total-badge">
                    {queueList.length} total
                  </span>
                </div>

                <div className="queue-list-scroll">
                  {queueList.map((patient) => (
                    <div
                      key={patient.id}
                      className={`queue-list-item ${
                        patient.status === "In Treatment"
                          ? "active-treatment"
                          : patient.status === "In Queue"
                          ? "active"
                          : patient.status === "Completed"
                          ? "completed"
                          : ""
                      }`}
                    >
                      <div className="queue-list-left">
                        <div className="queue-list-number">
                          #{patient.queueNumber}
                        </div>

                        <div className="queue-list-info">
                          <h4>{patient.name}</h4>
                          <p>{patient.procedure}</p>
                        </div>
                      </div>

                      <div className="queue-list-right">
                        <span>{patient.time}</span>
                        <small>{patient.status}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="queue-calendar-card">
                <div className="queue-card-head">
                  <h3>Calendar</h3>
                  <span className="queue-calendar-tag">Today only</span>
                </div>

                <div className="queue-calendar-month">
                  <strong>{currentMonth}</strong>
                  <span>{currentYear}</span>
                </div>

                <div className="queue-calendar-box">
                  <div className="queue-calendar-label">Today’s Date</div>
                  <div className="queue-calendar-number">{currentDay}</div>
                  <div className="queue-calendar-full">{todayFormatted}</div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {showCompleteConfirm && (
          <div className="queue-modal-overlay">
            <div className="queue-modal queue-modal-small">
              <h2>Confirm Completion</h2>
              <p>
                Are you sure the procedure or treatment for{" "}
                <strong>{currentPatient?.name}</strong> is already complete?
              </p>

              <div className="queue-modal-actions">
                <button
                  className="queue-secondary-btn"
                  onClick={() => setShowCompleteConfirm(false)}
                >
                  Cancel
                </button>

                <button
                  className="queue-primary-btn"
                  onClick={confirmCompleteTreatment}
                >
                  Yes, Complete
                </button>
              </div>
            </div>
          </div>
        )}

        {showStartNextModal && nextPatient && (
          <div className="queue-modal-overlay">
            <div className="queue-modal queue-modal-start">
              <h2>Start Treatment</h2>
              <p className="queue-start-message">
                <strong>{nextPatient.name}</strong> has been successfully moved
                to the live queue.
              </p>
              <p className="queue-start-time">
                Appointment: {nextPatient.time}
              </p>

              <div className="queue-modal-actions queue-modal-actions-center">
                <button
                  className="queue-primary-btn"
                  onClick={startNextTreatment}
                >
                  Start
                </button>
              </div>
            </div>
          </div>
        )}

        {showDelayModal && (
          <div className="queue-modal-overlay">
            <div className="queue-modal queue-modal-delay">
              <div className="queue-delay-modal-head">
                <h2>Delay Management</h2>

                <button
                  className="queue-close-btn"
                  onClick={() => setShowDelayModal(false)}
                >
                  ×
                </button>
              </div>

              <div className="queue-delay-modal-body">
                <div className="queue-delay-options">
                  <label className="queue-delay-option">
                    <input
                      type="radio"
                      name="delay"
                      checked={selectedDelay === "10"}
                      onChange={() => setSelectedDelay("10")}
                    />
                    <span>10 Minutes</span>
                  </label>

                  <label className="queue-delay-option">
                    <input
                      type="radio"
                      name="delay"
                      checked={selectedDelay === "20"}
                      onChange={() => setSelectedDelay("20")}
                    />
                    <span>20 Minutes</span>
                  </label>

                  <label className="queue-delay-option">
                    <input
                      type="radio"
                      name="delay"
                      checked={selectedDelay === "30"}
                      onChange={() => setSelectedDelay("30")}
                    />
                    <span>30 Minutes</span>
                  </label>

                  <label className="queue-delay-option">
                    <input
                      type="radio"
                      name="delay"
                      checked={selectedDelay === "45"}
                      onChange={() => setSelectedDelay("45")}
                    />
                    <span>45 Minutes</span>
                  </label>

                  <label className="queue-delay-option">
                    <input
                      type="radio"
                      name="delay"
                      checked={selectedDelay === "custom"}
                      onChange={() => setSelectedDelay("custom")}
                    />
                    <span>Custom</span>
                  </label>

                  {selectedDelay === "custom" && (
                    <div className="queue-custom-delay-group">
                      <input
                        type="number"
                        className="queue-custom-delay"
                        placeholder="Enter value"
                        value={customDelay}
                        onChange={(e) => setCustomDelay(e.target.value)}
                      />

                      <select
                        className="queue-custom-unit"
                        value={delayUnit}
                        onChange={(e) => setDelayUnit(e.target.value)}
                      >
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="queue-delay-message-wrap">
                  <textarea
                    placeholder="Optional notification message..."
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                  />
                </div>
              </div>

              <div className="queue-modal-actions">
                <button
                  className="queue-secondary-btn"
                  onClick={() => setShowDelayModal(false)}
                >
                  Cancel
                </button>

                <button
                  className="queue-primary-btn"
                  onClick={handleDelayConfirm}
                  disabled={isApplyingDelay}
                >
                  {isApplyingDelay ? "Applying..." : "Confirm Delay and Notify"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}