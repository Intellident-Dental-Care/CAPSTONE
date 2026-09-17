import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/admin/layout/AdminSidebar";
import AdminTopbar from "../../components/admin/layout/AdminTopbar";
import AdminSummaryCard from "../../components/admin/dashboard/AdminSummaryCard";
import {
  getDashboardSnapshot,
  getTodayQueue,
  getLeaveRequests,
  reviewLeaveRequest,
} from "../../services/adminService";
import { useBranch } from "../../context/BranchContext";

import "../../styles/admin/dashboard/admin-dashboard.css";
import "../../styles/admin/dashboard/admin-layout.css";
import "../../styles/admin/dashboard/admin-summary-card.css";
import "../../styles/admin/layout/admin-sidebar.css";
import "../../styles/admin/layout/admin-topbar.css";
import "../../styles/admin/notifications/admin-notification-popup.css";
import "../../styles/admin/shared/admin-responsive.css";

/* =========================================================
   HELPERS
========================================================= */

const formatLeaveSubmittedAt = (dateString) => {
  if (!dateString) return "-";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const mapLeaveRequestRow = (row) => ({
  id: row.id,
  dentistId: row.dentist_id,
  dentistName: row.dentist_list?.name || "Unknown Dentist",
  specialty: row.dentist_list?.specialization || "",
  leaveType: row.leave_type,
  dates: Array.isArray(row.leave_dates) ? row.leave_dates : [],
  reason: row.reason,
  notes: row.notes || "",
  submittedAt: formatLeaveSubmittedAt(row.created_at),
  status: row.status,
  rejectionReason: row.rejection_reason || "",
});

const formatLeaveDate = (dateString) => {
  if (!dateString) return "-";

  const [year, month, day] = dateString.split("-").map(Number);

  if (!year || !month || !day) {
    return dateString;
  }

  return new Date(year, month - 1, day).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatLeaveDateShort = (dateString) => {
  if (!dateString) return "-";

  const [year, month, day] = dateString.split("-").map(Number);

  if (!year || !month || !day) {
    return dateString;
  }

  return new Date(year, month - 1, day).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
};

const getLeaveDateSummary = (dates = []) => {
  if (!dates.length) return "No dates";

  if (dates.length === 1) {
    return formatLeaveDateShort(dates[0]);
  }

  if (dates.length === 2) {
    return `${formatLeaveDateShort(dates[0])}, ${formatLeaveDateShort(
      dates[1]
    )}`;
  }

  return `${formatLeaveDateShort(dates[0])} +${dates.length - 1} more`;
};

/* =========================================================
   LEAVE REQUEST REVIEW MODAL
========================================================= */

function DashboardLeaveRequestModal({
  request,
  onClose,
  onApprove,
  onReject,
}) {
  if (!request) return null;

  return (
    <div
      className="admin-dashboard-request-overlay"
      onMouseDown={onClose}
    >
      <div
        className="admin-dashboard-request-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="admin-dashboard-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <div className="admin-dashboard-request-modal-header">
          <div>
            <span className="admin-dashboard-request-eyebrow">
              Dentist Leave Request
            </span>

            <h2>{request.dentistName}</h2>

            <p>
              Review the requested leave details before approving or
              rejecting this request.
            </p>
          </div>

          <span
            className={`admin-dashboard-request-status ${request.status.toLowerCase()}`}
          >
            {request.status}
          </span>
        </div>

        <div className="admin-dashboard-request-summary-grid">
          <div className="admin-dashboard-request-summary-item">
            <span>Request ID</span>
            <strong>{request.id}</strong>
          </div>

          <div className="admin-dashboard-request-summary-item">
            <span>Leave Type</span>
            <strong>{request.leaveType}</strong>
          </div>

          <div className="admin-dashboard-request-summary-item">
            <span>Submitted</span>
            <strong>{request.submittedAt}</strong>
          </div>
        </div>

        <div className="admin-dashboard-request-section">
          <h4>Requested Leave Dates</h4>

          <div className="admin-dashboard-request-date-list">
            {request.dates.map((date) => (
              <span
                key={date}
                className="admin-dashboard-request-date-chip"
              >
                {formatLeaveDate(date)}
              </span>
            ))}
          </div>
        </div>

        <div className="admin-dashboard-request-section">
          <h4>Reason</h4>

          <div className="admin-dashboard-request-text-box">
            {request.reason || "No reason provided."}
          </div>
        </div>

        {request.notes ? (
          <div className="admin-dashboard-request-section">
            <h4>Additional Notes</h4>

            <div className="admin-dashboard-request-text-box">
              {request.notes}
            </div>
          </div>
        ) : null}

        {request.status === "Pending" ? (
          <div className="admin-dashboard-request-modal-actions">
            <button
              type="button"
              className="admin-dashboard-request-reject-btn"
              onClick={() => onReject(request)}
            >
              Reject
            </button>

            <button
              type="button"
              className="admin-dashboard-request-approve-btn"
              onClick={() => onApprove(request)}
            >
              Approve Request
            </button>
          </div>
        ) : (
          <div className="admin-dashboard-request-modal-actions">
            <button
              type="button"
              className="admin-dashboard-request-close-btn"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   REJECTION REASON MODAL
========================================================= */

function DashboardRejectLeaveModal({
  request,
  reason,
  setReason,
  error,
  onClose,
  onContinue,
}) {
  if (!request) return null;

  return (
    <div
      className="admin-dashboard-request-overlay admin-dashboard-reject-overlay"
      onMouseDown={onClose}
    >
      <div
        className="admin-dashboard-reject-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="admin-dashboard-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <div className="admin-dashboard-reject-icon">!</div>

        <h2>Reject Leave Request</h2>

        <p>
          Please provide a reason for rejecting{" "}
          <strong>{request.dentistName}</strong>&apos;s leave request.
          This reason can later be shown to the dentist.
        </p>

        <div className="admin-dashboard-reject-field">
          <label htmlFor="dashboard-rejection-reason">
            Rejection Reason
          </label>

          <textarea
            id="dashboard-rejection-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Enter the reason for rejecting this request..."
          />
        </div>

        {error ? (
          <div className="admin-dashboard-request-error">{error}</div>
        ) : null}

        <div className="admin-dashboard-reject-actions">
          <button
            type="button"
            className="admin-dashboard-reject-cancel"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="admin-dashboard-reject-continue"
            onClick={onContinue}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   FINAL CONFIRMATION MODAL
========================================================= */

function DashboardRequestConfirmationModal({
  confirmation,
  rejectionReason,
  onClose,
  onConfirm,
}) {
  if (!confirmation?.isOpen || !confirmation?.request) {
    return null;
  }

  const isApprove = confirmation.action === "approve";
  const request = confirmation.request;

  return (
    <div
      className="admin-dashboard-request-overlay admin-dashboard-confirm-overlay"
      onMouseDown={onClose}
    >
      <div
        className="admin-dashboard-confirm-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="admin-dashboard-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <div
          className={`admin-dashboard-confirm-icon ${
            isApprove ? "approve" : "reject"
          }`}
        >
          {isApprove ? "✓" : "!"}
        </div>

        <h2>
          {isApprove
            ? "Approve Leave Request?"
            : "Reject Leave Request?"}
        </h2>

        <p>
          {isApprove
            ? `Please confirm that you want to approve ${request.dentistName}'s leave request.`
            : `Please confirm that you want to reject ${request.dentistName}'s leave request.`}
        </p>

        <div className="admin-dashboard-confirm-summary">
          <div>
            <span>Dentist</span>
            <strong>{request.dentistName}</strong>
          </div>

          <div>
            <span>Leave Type</span>
            <strong>{request.leaveType}</strong>
          </div>

          <div>
            <span>Leave Date</span>
            <strong>{getLeaveDateSummary(request.dates)}</strong>
          </div>

          <div>
            <span>Request ID</span>
            <strong>{request.id}</strong>
          </div>
        </div>

        {!isApprove ? (
          <div className="admin-dashboard-confirm-reason">
            <span>Rejection Reason</span>
            <p>{rejectionReason}</p>
          </div>
        ) : null}

        <div className="admin-dashboard-confirm-actions">
          <button
            type="button"
            className="admin-dashboard-confirm-cancel"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className={
              isApprove
                ? "admin-dashboard-confirm-approve"
                : "admin-dashboard-confirm-reject"
            }
            onClick={onConfirm}
          >
            {isApprove
              ? "Yes, Approve Request"
              : "Yes, Reject Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

export default function AdminDashboard() {
  const [isNotificationOpen, setIsNotificationOpen] =
    useState(false);

  const [snapshot, setSnapshot] = useState(null);

  const { selectedBranch } = useBranch();

  /* =======================================================
     LEAVE REQUEST STATES
  ======================================================= */

  const [leaveRequests, setLeaveRequests] = useState([]);

  const [selectedLeaveRequest, setSelectedLeaveRequest] =
    useState(null);

  const [requestToReject, setRequestToReject] = useState(null);

  const [rejectionReason, setRejectionReason] = useState("");

  const [rejectionError, setRejectionError] = useState("");

  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    action: "",
    request: null,
  });

  /* =======================================================
     DASHBOARD DATA
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    const loadSnapshot = async () => {
      const response = await getDashboardSnapshot({
        forceRefresh: true,
        branch: selectedBranch,
      });

      if (mounted && response?.success) {
        let dashboardData = { ...response.data };

        const queueRes = await getTodayQueue({
          forceRefresh: true,
          branch: selectedBranch,
        });

        if (queueRes?.success) {
          const filteredBookings = (
            queueRes.data.bookings || []
          ).filter(
            (item) =>
              item.rawStatus !== "pending" &&
              item.status !== "Waiting"
          );

          const mapped = filteredBookings.map((item) => ({
            id: item.id,
            queueNumber: item.queueNumber,
            patientName: item.patientName || item.name,
            name: item.patientName || item.name,
            time: item.time,
            date: item.date || new Date().toLocaleDateString(),
            status: item.status,
            rawStatus: item.rawStatus,
            procedure: item.procedure,
            dentist: item.dentist,
          }));

          const currentPatient =
            mapped.find(
              (item) =>
                item.status === "In Treatment" ||
                item.rawStatus === "in_treatment"
            ) ||
            mapped.find(
              (item) =>
                item.status === "In Queue" ||
                item.rawStatus === "confirmed"
            ) ||
            null;

          const waitingPatients = mapped.filter(
            (item) =>
              (item.rawStatus === "confirmed" ||
                item.status === "In Queue") &&
              item.id !== currentPatient?.id
          );

          const nextPatient = waitingPatients[0] || null;

          dashboardData.liveQueue = currentPatient;
          dashboardData.nextPatient = nextPatient;

          if (dashboardData.totals) {
            dashboardData.totals.waiting =
              waitingPatients.length;
          }
        }

        if (mounted) {
          setSnapshot(dashboardData);
        }
      }
    };

    loadSnapshot();

    return () => {
      mounted = false;
    };
  }, [selectedBranch]);

  useEffect(() => {
    let mounted = true;

    const loadLeaveRequests = async () => {
      const response = await getLeaveRequests();

      if (mounted && response?.success && Array.isArray(response.data)) {
        setLeaveRequests(response.data.map(mapLeaveRequestRow));
      }
    };

    loadLeaveRequests();

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
     EXISTING DASHBOARD VALUES
  ======================================================= */

  const currentQueue = snapshot?.liveQueue || null;
  const nextPatientFromApi = snapshot?.nextPatient || null;

  const attendingDentists =
    snapshot?.attendingDentists || [];

  const topTreatments = (
    snapshot?.topTreatments || []
  ).slice(0, 4);

  const monthlyAppointments =
    snapshot?.monthlyAppointments || [];

  const nextPatientWaitMinutes = Number(
    snapshot?.nextPatientWaitMinutes || 0
  );

  const isActivePatient =
    currentQueue &&
    currentQueue.status &&
    !["Completed", "Done", "Cancelled"].includes(
      currentQueue.status
    );

  /* =======================================================
     NOTIFICATIONS
  ======================================================= */

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New Appointment Requests:",
      message: "5 new appointments today",
      time: "2 mins ago",
    },
    {
      id: 2,
      title: "Queue Update:",
      message: "Patient #2 is now in-treatment",
      time: "6 mins ago",
    },
    {
      id: 3,
      title: "Dentist Availability:",
      message: "Dr. Shin Tamura is on-duty",
      time: "12 mins ago",
    },
  ]);

  /* =======================================================
     PENDING LEAVE REQUESTS
  ======================================================= */

  const pendingLeaveRequests = useMemo(
    () =>
      leaveRequests.filter(
        (request) => request.status === "Pending"
      ),
    [leaveRequests]
  );

  /* =======================================================
     NOTIFICATION HANDLERS
  ======================================================= */

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

  /* =======================================================
     LEAVE REQUEST HANDLERS
  ======================================================= */

  const handleOpenLeaveRequest = (request) => {
    setSelectedLeaveRequest(request);
  };

  const handleCloseLeaveRequest = () => {
    setSelectedLeaveRequest(null);
  };

  const handleOpenApproveConfirmation = (request) => {
    setConfirmationModal({
      isOpen: true,
      action: "approve",
      request,
    });
  };

  const handleOpenRejectModal = (request) => {
    setRequestToReject(request);
    setRejectionReason("");
    setRejectionError("");
  };

  const handleCloseRejectModal = () => {
    setRequestToReject(null);
    setRejectionReason("");
    setRejectionError("");
  };

  const handleContinueReject = () => {
    if (!rejectionReason.trim()) {
      setRejectionError(
        "Please enter a reason for rejecting this request."
      );
      return;
    }

    setRejectionError("");

    setConfirmationModal({
      isOpen: true,
      action: "reject",
      request: requestToReject,
    });

    setRequestToReject(null);
  };

  const handleCloseConfirmation = () => {
    setConfirmationModal({
      isOpen: false,
      action: "",
      request: null,
    });
  };

  const handleConfirmRequestAction = async () => {
    const request = confirmationModal.request;

    if (!request) return;

    const isApprove =
      confirmationModal.action === "approve";

    const newStatus = isApprove
      ? "Approved"
      : "Rejected";

    const result = await reviewLeaveRequest(
      request.id,
      newStatus,
      isApprove ? "" : rejectionReason.trim()
    );

    if (!result?.success) {
      alert(result?.message || "Failed to update the leave request.");
      return;
    }

    setLeaveRequests((currentRequests) =>
      currentRequests.map((item) =>
        item.id === request.id
          ? {
              ...item,
              status: newStatus,
              rejectionReason: isApprove
                ? ""
                : rejectionReason.trim(),
            }
          : item
      )
    );

    setSelectedLeaveRequest(null);

    setNotifications((currentNotifications) => [
      {
        id: Date.now(),
        title: isApprove
          ? "Leave Request Approved:"
          : "Leave Request Rejected:",
        message: `${request.dentistName}'s ${request.leaveType.toLowerCase()} request has been ${newStatus.toLowerCase()}.`,
        time: "Just now",
      },
      ...currentNotifications,
    ]);

    setConfirmationModal({
      isOpen: false,
      action: "",
      request: null,
    });

    setRequestToReject(null);
    setRejectionReason("");
    setRejectionError("");
  };

  /* =======================================================
     CHART VALUES
  ======================================================= */

  const maxChartValue = Math.max(
    1,
    ...monthlyAppointments.flatMap((item) => [
      item.scheduled,
      item.walkin,
    ])
  );

  const scheduledPoints =
    monthlyAppointments.length > 1
      ? monthlyAppointments
          .map((item, index) => {
            const x =
              (index /
                (monthlyAppointments.length - 1)) *
              100;

            const y =
              100 -
              (item.scheduled / maxChartValue) * 100;

            return `${x},${y}`;
          })
          .join(" ")
      : "";

  const walkinPoints =
    monthlyAppointments.length > 1
      ? monthlyAppointments
          .map((item, index) => {
            const x =
              (index /
                (monthlyAppointments.length - 1)) *
              100;

            const y =
              100 -
              (item.walkin / maxChartValue) * 100;

            return `${x},${y}`;
          })
          .join(" ")
      : "";

  const pieGradient = (() => {
    if (!topTreatments.length) {
      return "conic-gradient(#f3d9e4 0% 100%)";
    }

    let cursor = 0;

    const parts = topTreatments.map(
      (item, index) => {
        const pct =
          Number.parseFloat(
            String(item.value || "0").replace("%", "")
          ) || 0;

        const start = cursor;

        cursor += pct;

        const end =
          index === topTreatments.length - 1
            ? 100
            : cursor;

        return `${item.color} ${start}% ${end}%`;
      }
    );

    return `conic-gradient(${parts.join(", ")})`;
  })();

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      <div className="admin-dashboard-page">
        <AdminSidebar />

        <main className="admin-main-content">
          <AdminTopbar
            title="Dashboard"
            notifications={notifications}
            isNotificationOpen={isNotificationOpen}
            onToggleNotifications={
              handleToggleNotifications
            }
            onCloseNotifications={
              handleCloseNotifications
            }
            onMarkAllRead={handleMarkAllRead}
          />

          <div className="admin-dashboard-grid">
            {/* =================================================
                LEFT SECTION
            ================================================= */}

            <section className="admin-left-section">
              {/* LIVE QUEUE */}

              <div className="admin-live-queue-card">
                <div className="admin-card-header-row">
                  <h3 className="admin-live-queue-title">
                    Live Queue
                  </h3>

                  <span className="admin-soft-badge">
                    Active
                  </span>
                </div>

                <div className="admin-live-queue-content">
                  {isActivePatient ? (
                    <>
                      <div className="admin-live-queue-number">
                        {`#${currentQueue.queueNumber}`}
                      </div>

                      <p className="admin-live-queue-status">
                        {currentQueue.status}
                      </p>

                      <div className="admin-live-queue-extra">
                        <div className="admin-live-queue-extra-item">
                          <span className="admin-live-queue-extra-label">
                            Next Patient
                          </span>

                          <span className="admin-live-queue-extra-value">
                            {nextPatientFromApi?.patientName ||
                              "None"}
                          </span>
                        </div>

                        <div className="admin-live-queue-extra-item">
                          <span className="admin-live-queue-extra-label">
                            Treatment / Procedure
                          </span>

                          <span className="admin-live-queue-extra-value">
                            {currentQueue.procedure || "--"}
                          </span>
                        </div>

                        <div className="admin-live-queue-extra-item">
                          <span className="admin-live-queue-extra-label">
                            Assigned Dentist
                          </span>

                          <span className="admin-live-queue-extra-value">
                            {currentQueue.dentist ||
                              "Unassigned"}
                          </span>
                        </div>
                      </div>

                      <div className="admin-live-queue-progress">
                        <div className="admin-live-queue-progress-fill" />
                      </div>

                      <p className="admin-live-queue-wait">
                        Estimated wait for the next patient:{" "}
                        <strong>
                          {nextPatientFromApi
                            ? `${nextPatientWaitMinutes} minutes`
                            : "N/A"}
                        </strong>
                      </p>
                    </>
                  ) : (
                    <div className="admin-live-queue-empty">
                      <p className="admin-live-queue-empty-title">
                        No Current Patient
                      </p>

                      <p className="admin-live-queue-empty-description">
                        The queue is currently empty or all
                        patients have been completed
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* =================================================
                  DENTIST LEAVE REQUESTS
              ================================================= */}

              <div className="admin-dashboard-leave-card">
                <div className="admin-dashboard-leave-header">
                  <div>
                    <div className="admin-dashboard-leave-title-row">
                      <h3>Dentist Leave Requests</h3>

                      {pendingLeaveRequests.length > 0 ? (
                        <span className="admin-dashboard-leave-count">
                          {pendingLeaveRequests.length} Pending
                        </span>
                      ) : null}
                    </div>

                    <p>
                      Review leave requests submitted by
                      dentists assigned to your branch.
                    </p>
                  </div>
                </div>

                {pendingLeaveRequests.length ? (
                  <div className="admin-dashboard-leave-list">
                    {pendingLeaveRequests.map((request) => (
                      <div
                        key={request.id}
                        className="admin-dashboard-leave-item"
                      >
                        <div className="admin-dashboard-leave-avatar">
                          {request.dentistName
                            .replace("Dr. ", "")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="admin-dashboard-leave-info">
                          <strong>
                            {request.dentistName}
                          </strong>

                          <span>
                            {request.leaveType} •{" "}
                            {getLeaveDateSummary(
                              request.dates
                            )}
                          </span>

                          <small>
                            Submitted{" "}
                            {request.submittedAt}
                          </small>
                        </div>

                        <button
                          type="button"
                          className="admin-dashboard-leave-review"
                          onClick={() =>
                            handleOpenLeaveRequest(request)
                          }
                        >
                          Review
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="admin-dashboard-leave-empty">
                    <div className="admin-dashboard-leave-empty-icon">
                      ✓
                    </div>

                    <div>
                      <strong>
                        No Pending Leave Requests
                      </strong>

                      <p>
                        All dentist leave requests have been
                        reviewed.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* =================================================
                  LOWER LEFT CARDS
              ================================================= */}

              <div className="admin-left-bottom-grid">
                {/* NEXT PATIENT */}

                <div className="admin-mini-stat-card admin-patient-card">
                  <p className="admin-mini-stat-title">
                    Next Patient Details
                  </p>

                  <div className="admin-patient-content">
                    {nextPatientFromApi ? (
                      <>
                        <div className="admin-patient-top">
                          <h4 className="admin-patient-name">
                            {
                              nextPatientFromApi.patientName
                            }
                          </h4>

                          <p className="admin-patient-treatment">
                            {nextPatientFromApi.procedure ||
                              "--"}
                          </p>

                          <p className="admin-patient-schedule">
                            {nextPatientFromApi.time} -{" "}
                            {nextPatientFromApi.date}
                          </p>
                        </div>

                        <div className="admin-patient-bottom">
                          <span className="admin-assigned-label">
                            Assigned Dentist
                          </span>

                          <span className="admin-assigned-value">
                            {nextPatientFromApi.dentist ||
                              "Unassigned"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div
                        className="admin-patient-top"
                        style={{
                          minHeight: "120px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                        }}
                      >
                        <h4
                          className="admin-patient-name"
                          style={{
                            color: "#A0A0A0",
                          }}
                        >
                          Queue is clear
                        </h4>

                        <p
                          className="admin-patient-treatment"
                          style={{
                            color: "#C0C0C0",
                          }}
                        >
                          No upcoming patients for today
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ATTENDING DENTISTS */}

                <div className="admin-mini-stat-card admin-dentists-card">
                  <p className="admin-mini-stat-title">
                    Attending Dentists
                  </p>

                  <div className="admin-dentists-list">
                    {attendingDentists.length ? (
                      attendingDentists.map((dentist) => (
                        <div
                          key={dentist.id}
                          className="admin-dentist-item"
                        >
                          <div className="admin-dentist-meta">
                            <p className="admin-dentist-name">
                              {dentist.name}
                            </p>

                            <span className="admin-dentist-patients">
                              {dentist.patients}
                            </span>
                          </div>

                          <span
                            className={`admin-dentist-status ${dentist.statusClass}`}
                          >
                            {dentist.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="admin-empty-text">
                        No dentists scheduled for this
                        branch.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* =================================================
                RIGHT SECTION
            ================================================= */}

            <aside className="admin-right-section">
              <div className="admin-summary-row">
                <AdminSummaryCard
                  title="Appointments"
                  subtitle="+12% today"
                  value={String(
                    snapshot?.totals?.appointments || 0
                  )}
                  variant="pink"
                />

                <AdminSummaryCard
                  title="Queue"
                  subtitle="+12% today"
                  value={String(
                    snapshot?.totals?.waiting || 0
                  )}
                  variant="rose"
                />
              </div>

              <div className="admin-kpi-grid">
                <div className="admin-kpi-card">
                  <p className="admin-kpi-title">
                    Confirmed Today
                  </p>

                  <h3 className="admin-kpi-value">
                    {String(
                      snapshot?.totals?.confirmed || 0
                    )}
                  </h3>

                  <span className="admin-kpi-subtext">
                    Scheduled patients for today
                  </span>
                </div>

                <div className="admin-kpi-card">
                  <p className="admin-kpi-title">
                    Walk-In Patients
                  </p>

                  <h3 className="admin-kpi-value">
                    {String(
                      snapshot?.totals?.walkins || 0
                    )}
                  </h3>

                  <span className="admin-kpi-subtext">
                    Added to today&apos;s queue
                  </span>
                </div>

                <div className="admin-kpi-card">
                  <p className="admin-kpi-title">
                    Available Dentists
                  </p>

                  <h3 className="admin-kpi-value">
                    {String(
                      snapshot?.totals
                        ?.availableDentists || 0
                    )}
                  </h3>

                  <span className="admin-kpi-subtext">
                    Ready for consultations
                  </span>
                </div>
              </div>

              {/* TOP TREATMENTS */}

              <div className="admin-right-info-card">
                <div className="admin-card-head">
                  <p className="admin-right-info-label">
                    Top Treatments
                  </p>
                </div>

                <div className="admin-treatments-layout">
                  <div
                    className="admin-treatments-chart"
                    style={{
                      background: pieGradient,
                    }}
                  />

                  <div className="admin-treatments-legend">
                    {topTreatments.map(
                      (item, index) => (
                        <div
                          key={item.label}
                          className="admin-treatment-item"
                        >
                          <div className="admin-treatment-left">
                            <span
                              className={`admin-treatment-dot dot-${
                                index + 1
                              }`}
                              style={
                                item.color
                                  ? {
                                      background:
                                        item.color,
                                    }
                                  : undefined
                              }
                            />

                            <span>{item.label}</span>
                          </div>

                          <span>{item.value}</span>
                        </div>
                      )
                    )}

                    {topTreatments.length === 0 ? (
                      <div className="admin-treatment-item">
                        No treatment data yet
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* APPOINTMENTS */}

              <div className="admin-right-info-card admin-appointments-card">
                <div className="admin-card-head admin-appointments-head">
                  <p className="admin-right-info-label">
                    Appointments
                  </p>

                  <div className="admin-chart-legend">
                    <span className="admin-chart-legend-item">
                      <span className="admin-chart-dot scheduled" />
                      Scheduled Appointments
                    </span>

                    <span className="admin-chart-legend-item">
                      <span className="admin-chart-dot walkin" />
                      Walk-Ins
                    </span>
                  </div>
                </div>

                <div className="admin-line-chart-wrapper">
                  <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="admin-line-chart"
                  >
                    {[0, 20, 40, 60, 80, 100].map(
                      (y) => (
                        <line
                          key={y}
                          x1="0"
                          y1={y}
                          x2="100"
                          y2={y}
                          className="admin-chart-grid-line"
                        />
                      )
                    )}

                    <polyline
                      fill="none"
                      points={scheduledPoints}
                      className="admin-chart-line-scheduled"
                    />

                    <polyline
                      fill="none"
                      points={walkinPoints}
                      className="admin-chart-line-walkin"
                    />
                  </svg>

                  <div className="admin-line-chart-months">
                    {monthlyAppointments.map((item) => (
                      <span key={item.month}>
                        {item.month}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>

      <DashboardLeaveRequestModal
        request={selectedLeaveRequest}
        onClose={handleCloseLeaveRequest}
        onApprove={handleOpenApproveConfirmation}
        onReject={handleOpenRejectModal}
      />

      <DashboardRejectLeaveModal
        request={requestToReject}
        reason={rejectionReason}
        setReason={setRejectionReason}
        error={rejectionError}
        onClose={handleCloseRejectModal}
        onContinue={handleContinueReject}
      />

      <DashboardRequestConfirmationModal
        confirmation={confirmationModal}
        rejectionReason={rejectionReason}
        onClose={handleCloseConfirmation}
        onConfirm={handleConfirmRequestAction}
      />
    </>
  );
}