import { useMemo, useState } from "react";
import AdminSidebar from "../../components/admin/layout/AdminSidebar";
import AdminTopbar from "../../components/admin/layout/AdminTopbar";

import "../../styles/admin/dashboard/admin-layout.css";
import "../../styles/admin/layout/admin-sidebar.css";
import "../../styles/admin/layout/admin-topbar.css";
import "../../styles/admin/notifications/admin-notification-popup.css";
import "../../styles/admin/shared/admin-responsive.css";
import "../../styles/admin/queue/queue.css";

const initialQueue = [
  {
    id: 1,
    queueNumber: 2,
    name: "Riko Tanaka Suzuki",
    time: "9:00 AM - 9:30 AM",
    status: "In-Treatment",
    procedure: "Dental Cleaning",
    dentist: "Dr. Shin Tamura",
  },
  {
    id: 2,
    queueNumber: 3,
    name: "Aiko Mendoza",
    time: "9:30 AM - 10:00 AM",
    status: "Waiting",
    procedure: "Tooth Extraction",
    dentist: "Dr. Angela Cruz",
  },
  {
    id: 3,
    queueNumber: 4,
    name: "John Reyes",
    time: "10:00 AM - 10:30 AM",
    status: "Waiting",
    procedure: "Braces Adjustment",
    dentist: "Dr. Shin Tamura",
  },
  {
    id: 4,
    queueNumber: 5,
    name: "Maria Santos",
    time: "10:30 AM - 11:00 AM",
    status: "Waiting",
    procedure: "Consultation",
    dentist: "Dr. Angela Cruz",
  },
  {
    id: 5,
    queueNumber: 6,
    name: "Kevin Cruz",
    time: "11:00 AM - 11:30 AM",
    status: "Waiting",
    procedure: "Filling",
    dentist: "Dr. Shin Tamura",
  },
];

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

  const [queueList, setQueueList] = useState(initialQueue);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showStartNextModal, setShowStartNextModal] = useState(false);
  const [showDelayModal, setShowDelayModal] = useState(false);

  const [selectedDelay, setSelectedDelay] = useState("10");
  const [customDelay, setCustomDelay] = useState("");
  const [delayUnit, setDelayUnit] = useState("minutes");
  const [notificationMessage, setNotificationMessage] = useState("");

  const currentPatient = useMemo(
    () => queueList.find((item) => item.status === "In-Treatment"),
    [queueList]
  );

  const waitingPatients = useMemo(
    () => queueList.filter((item) => item.status === "Waiting"),
    [queueList]
  );

  const nextPatient = waitingPatients[0] || null;

  const completedCount = useMemo(
    () => queueList.filter((item) => item.status === "Completed").length,
    [queueList]
  );

  const waitingCount = waitingPatients.length;
  const estimatedWait = waitingCount > 0 ? waitingCount * 15 : 0;

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

  const confirmCompleteTreatment = () => {
    if (!currentPatient) return;

    setQueueList((prev) =>
      prev.map((item) =>
        item.id === currentPatient.id
          ? { ...item, status: "Completed" }
          : item
      )
    );

    setShowCompleteConfirm(false);

    if (nextPatient) {
      setShowStartNextModal(true);
    }
  };

  const startNextTreatment = () => {
    if (!nextPatient) {
      setShowStartNextModal(false);
      return;
    }

    setQueueList((prev) =>
      prev.map((item) =>
        item.id === nextPatient.id
          ? { ...item, status: "In-Treatment" }
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
  };

  const handleDelayConfirm = () => {
    let chosenDelayText = "";

    if (selectedDelay === "custom") {
      const value = customDelay || "0";
      chosenDelayText = `${value} ${delayUnit}`;
    } else {
      chosenDelayText = `${selectedDelay} minutes`;
    }

    setNotifications((prev) => [
      {
        id: Date.now(),
        title: "Schedule Delay:",
        message:
          notificationMessage.trim() !== ""
            ? notificationMessage
            : `Queue delayed by ${chosenDelayText}`,
        time: "Just now",
      },
      ...prev,
    ]);

    setShowDelayModal(false);
    setSelectedDelay("10");
    setCustomDelay("");
    setDelayUnit("minutes");
    setNotificationMessage("");
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
              <p>For remaining patients</p>
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
                          {nextPatient ? "15 minutes" : "No patient waiting"}
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
                        patient.status === "In-Treatment"
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
                >
                  Confirm Delay and Notify
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}