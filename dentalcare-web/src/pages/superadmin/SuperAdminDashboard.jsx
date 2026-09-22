import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import logo from "../../assets/logo.png";
import SuperAdminSidebar from "../../components/superadmin/layout/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/layout/SuperAdminTopbar";
import {
  getSuperAdminDashboard,
  getSuperAdminDentists,
  getScheduleRequests,
  reviewScheduleRequest,
} from "../../services/superAdminService";

import "../../styles/admin/layout/admin-sidebar.css";
import "../../styles/admin/layout/admin-topbar.css";
import "../../styles/admin/notifications/admin-notification-popup.css";
import "../../styles/admin/shared/admin-responsive.css";

import "../../styles/superadmin/dashboard/superadmin-dashboard.css";
import "../../styles/superadmin/shared/superadmin-responsive.css";

/* =========================================================
   FALLBACK ANALYTICS
========================================================= */

const fallbackAnalyticsData = [
  {
    branch: "All Branches",
    totalBranches: 0,
    totalAdmins: 0,
    totalDentists: 0,
    totalPatients: 0,
    totalAppointments: 0,
    completed: 0,
    cancelled: 0,
    walkins: 0,
    topServices: [],
    branchPerformance: [],
    monthlyAppointments: Array.from({ length: 12 }, (_, index) => ({
      month: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ][index],
      total: 0,
    })),
  },
];

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/* =========================================================
   HELPERS
========================================================= */

const DAY_NUMBER_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const to24HourTimeString = (rawValue) => {
  const match = String(rawValue || "")
    .trim()
    .toUpperCase()
    .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);

  if (!match) return "00:00";

  let hour = Number(match[1]);
  const minute = match[2];
  const period = match[3];

  if (period === "AM") {
    if (hour === 12) hour = 0;
  } else if (hour !== 12) {
    hour += 12;
  }

  return `${String(hour).padStart(2, "0")}:${minute}`;
};

const buildCurrentSchedulesForDentist = (dentist) => {
  return (dentist?.schedules || []).map((schedule) => {
    const [startRaw, endRaw] = String(schedule.time || "")
      .split("-")
      .map((part) => part.trim());

    return {
      days: [schedule.day],
      branch: schedule.branch,
      startTime: to24HourTimeString(startRaw),
      endTime: to24HourTimeString(endRaw),
    };
  });
};

const mapScheduleRequestRow = (row, dentistScheduleMap) => ({
  id: row.id,
  dentistId: row.dentist_id,
  dentistName: row.dentist_list?.name || "Unknown Dentist",
  submittedAt: row.created_at
    ? new Date(row.created_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "-",
  effectiveDate: row.effective_date,
  status: row.status,
  currentSchedules: dentistScheduleMap.get(String(row.dentist_id)) || [],
  requestedSchedules: (Array.isArray(row.requested_schedules)
    ? row.requested_schedules
    : []
  ).map((schedule) => ({
    days: (Array.isArray(schedule.days) ? schedule.days : []).map(
      (day) => DAY_NUMBER_LABELS[Number(day)] || String(day)
    ),
    branch: schedule.branch,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
  })),
  reason: row.reason,
  notes: row.notes || "",
  rejectionReason: row.rejection_reason || "",
});

function buildPolylinePoints(values, maxValue) {
  if (!values || values.length === 0 || maxValue === 0) {
    return "0,100";
  }

  return values
    .map((value, index) => {
      const x =
        values.length > 1 ? (index / (values.length - 1)) * 100 : 0;

      const y = 100 - (value / maxValue) * 100;

      return `${x},${y}`;
    })
    .join(" ");
}

function formatScheduleTime(time) {
  if (!time) return "--";

  const [hourString, minuteString] = time.split(":");

  let hour = Number(hourString);
  const minute = minuteString || "00";

  const period = hour >= 12 ? "PM" : "AM";

  hour %= 12;

  if (hour === 0) {
    hour = 12;
  }

  return `${hour}:${minute} ${period}`;
}

function formatScheduleDate(dateString) {
  if (!dateString) return "--";

  const [year, month, day] = dateString.split("-").map(Number);

  if (!year || !month || !day) {
    return dateString;
  }

  return new Date(year, month - 1, day).toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/* =========================================================
   SCHEDULE REQUEST REVIEW MODAL
========================================================= */

function ScheduleRequestReviewModal({
  request,
  onClose,
  onApprove,
  onReject,
}) {
  if (!request) return null;

  return (
    <div
      className="superadmin-request-overlay"
      onMouseDown={onClose}
    >
      <div
        className="superadmin-request-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="superadmin-request-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <div className="superadmin-request-modal-head">
          <div>
            <span className="superadmin-request-eyebrow">
              Schedule Change Request
            </span>

            <h2>{request.dentistName}</h2>

            <p>
              Compare the dentist&apos;s current schedule with the requested
              schedule before making a decision.
            </p>
          </div>

          <span
            className={`superadmin-request-status ${request.status.toLowerCase()}`}
          >
            {request.status}
          </span>
        </div>

        <div className="superadmin-request-meta-grid">
          <div>
            <span>Request ID</span>
            <strong>{request.id}</strong>
          </div>

          <div>
            <span>Submitted</span>
            <strong>{request.submittedAt}</strong>
          </div>

          <div>
            <span>Effective Date</span>
            <strong>{formatScheduleDate(request.effectiveDate)}</strong>
          </div>
        </div>

        <div className="superadmin-schedule-comparison">
          {/* CURRENT SCHEDULE */}

          <div className="superadmin-schedule-column current">
            <div className="superadmin-schedule-column-head">
              <div>
                <span className="superadmin-schedule-column-label">
                  CURRENT
                </span>

                <h3>Current Schedule</h3>
              </div>

              <span className="superadmin-schedule-count">
                {request.currentSchedules.length}
              </span>
            </div>

            <div className="superadmin-schedule-entry-list">
              {request.currentSchedules.map((schedule, index) => (
                <div
                  key={`${request.id}-current-${index}`}
                  className="superadmin-schedule-entry"
                >
                  <div className="superadmin-schedule-entry-number">
                    {index + 1}
                  </div>

                  <div className="superadmin-schedule-entry-content">
                    <strong>{schedule.days.join(", ")}</strong>

                    <span>{schedule.branch}</span>

                    <small>
                      {formatScheduleTime(schedule.startTime)} –{" "}
                      {formatScheduleTime(schedule.endTime)}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="superadmin-schedule-arrow">→</div>

          {/* REQUESTED SCHEDULE */}

          <div className="superadmin-schedule-column requested">
            <div className="superadmin-schedule-column-head">
              <div>
                <span className="superadmin-schedule-column-label">
                  REQUESTED
                </span>

                <h3>Requested Schedule</h3>
              </div>

              <span className="superadmin-schedule-count">
                {request.requestedSchedules.length}
              </span>
            </div>

            <div className="superadmin-schedule-entry-list">
              {request.requestedSchedules.map((schedule, index) => (
                <div
                  key={`${request.id}-requested-${index}`}
                  className="superadmin-schedule-entry"
                >
                  <div className="superadmin-schedule-entry-number">
                    {index + 1}
                  </div>

                  <div className="superadmin-schedule-entry-content">
                    <strong>{schedule.days.join(", ")}</strong>

                    <span>{schedule.branch}</span>

                    <small>
                      {formatScheduleTime(schedule.startTime)} –{" "}
                      {formatScheduleTime(schedule.endTime)}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="superadmin-request-detail-section">
          <h4>Reason</h4>

          <div className="superadmin-request-text-box">
            {request.reason || "No reason provided."}
          </div>
        </div>

        {request.notes ? (
          <div className="superadmin-request-detail-section">
            <h4>Additional Notes</h4>

            <div className="superadmin-request-text-box">
              {request.notes}
            </div>
          </div>
        ) : null}

        {request.status === "Pending" ? (
          <div className="superadmin-request-actions">
            <button
              type="button"
              className="superadmin-request-reject-btn"
              onClick={() => onReject(request)}
            >
              Reject
            </button>

            <button
              type="button"
              className="superadmin-request-approve-btn"
              onClick={() => onApprove(request)}
            >
              Approve Request
            </button>
          </div>
        ) : (
          <div className="superadmin-request-actions">
            <button
              type="button"
              className="superadmin-request-neutral-btn"
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

function ScheduleRejectModal({
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
      className="superadmin-request-overlay superadmin-reject-overlay"
      onMouseDown={onClose}
    >
      <div
        className="superadmin-reject-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="superadmin-request-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <div className="superadmin-reject-icon">!</div>

        <h2>Reject Schedule Request</h2>

        <p>
          Please provide a reason for rejecting{" "}
          <strong>{request.dentistName}</strong>&apos;s requested schedule
          change.
        </p>

        <label
          className="superadmin-reject-label"
          htmlFor="schedule-rejection-reason"
        >
          Rejection Reason
        </label>

        <textarea
          id="schedule-rejection-reason"
          className="superadmin-reject-textarea"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Enter the reason for rejecting this request..."
        />

        {error ? (
          <div className="superadmin-request-error">{error}</div>
        ) : null}

        <div className="superadmin-reject-actions">
          <button
            type="button"
            className="superadmin-reject-cancel"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="superadmin-reject-continue"
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

function ScheduleConfirmationModal({
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
      className="superadmin-request-overlay superadmin-confirm-overlay"
      onMouseDown={onClose}
    >
      <div
        className="superadmin-confirm-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="superadmin-request-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <div
          className={`superadmin-confirm-icon ${
            isApprove ? "approve" : "reject"
          }`}
        >
          {isApprove ? "✓" : "!"}
        </div>

        <h2>
          {isApprove
            ? "Approve Schedule Change?"
            : "Reject Schedule Change?"}
        </h2>

        <p>
          {isApprove
            ? `Please confirm that you want to approve ${request.dentistName}'s requested schedule change.`
            : `Please confirm that you want to reject ${request.dentistName}'s requested schedule change.`}
        </p>

        <div className="superadmin-confirm-details">
          <div>
            <span>Dentist</span>
            <strong>{request.dentistName}</strong>
          </div>

          <div>
            <span>Effective Date</span>
            <strong>{formatScheduleDate(request.effectiveDate)}</strong>
          </div>

          <div>
            <span>Schedule Entries</span>
            <strong>{request.requestedSchedules.length}</strong>
          </div>

          <div>
            <span>Request ID</span>
            <strong>{request.id}</strong>
          </div>
        </div>

        {!isApprove ? (
          <div className="superadmin-confirm-rejection-reason">
            <span>Rejection Reason</span>
            <p>{rejectionReason}</p>
          </div>
        ) : null}

        <div className="superadmin-confirm-actions">
          <button
            type="button"
            className="superadmin-confirm-cancel"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className={
              isApprove
                ? "superadmin-confirm-approve"
                : "superadmin-confirm-reject"
            }
            onClick={onConfirm}
          >
            {isApprove ? "Yes, Approve Request" : "Yes, Reject Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SUPER ADMIN DASHBOARD
========================================================= */

export default function SuperAdminDashboard() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [branchFilter, setBranchFilter] = useState("All Branches");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [analyticsData, setAnalyticsData] = useState(fallbackAnalyticsData);

  const [overallBranchTrends, setOverallBranchTrends] = useState([]);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Branch data updated",
      message: "All branch records were refreshed successfully.",
      time: "2 mins ago",
    },
  ]);

  /* =======================================================
     SCHEDULE REQUEST STATES
  ======================================================= */

  const [scheduleRequests, setScheduleRequests] = useState([]);

  const [selectedScheduleRequest, setSelectedScheduleRequest] =
    useState(null);

  const [scheduleRequestToReject, setScheduleRequestToReject] =
    useState(null);

  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState("");

  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    action: "",
    request: null,
  });

  const overallAnalyticsRef = useRef(null);
  const topServicesRef = useRef(null);
  const appointmentTrendsRef = useRef(null);

  /* =======================================================
     LOAD DASHBOARD
  ======================================================= */

  useEffect(() => {
    const fetchDashboard = async () => {
      const res = await getSuperAdminDashboard(fromDate, toDate);

      if (res?.success && res.data) {
        setAnalyticsData(
          res.data.analyticsData || fallbackAnalyticsData
        );

        setOverallBranchTrends(
          res.data.overallBranchTrends || []
        );
      }
    };

    fetchDashboard();
  }, [fromDate, toDate]);

  useEffect(() => {
    let mounted = true;

    const loadScheduleRequests = async () => {
      const [requestsRes, dentistsRes] = await Promise.all([
        getScheduleRequests(),
        getSuperAdminDentists(),
      ]);

      if (!mounted) return;

      const dentistScheduleMap = new Map();

      if (dentistsRes?.success && Array.isArray(dentistsRes.data)) {
        dentistsRes.data.forEach((dentist) => {
          dentistScheduleMap.set(
            String(dentist.id),
            buildCurrentSchedulesForDentist(dentist)
          );
        });
      }

      if (requestsRes?.success && Array.isArray(requestsRes.data)) {
        setScheduleRequests(
          requestsRes.data.map((row) =>
            mapScheduleRequestRow(row, dentistScheduleMap)
          )
        );
      }
    };

    loadScheduleRequests();

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
     SIDEBAR RESPONSIVE
  ======================================================= */

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () =>
      window.removeEventListener("resize", handleResize);
  }, []);

  /* =======================================================
     CURRENT ANALYTICS
  ======================================================= */

  const currentAnalytics = useMemo(() => {
    return (
      analyticsData.find(
        (item) => item.branch === branchFilter
      ) || analyticsData[0]
    );
  }, [branchFilter, analyticsData]);

  const pendingScheduleRequests = useMemo(
    () =>
      scheduleRequests.filter(
        (request) => request.status === "Pending"
      ),
    [scheduleRequests]
  );

  const overallMaxValue = Math.max(
    ...overallBranchTrends.flatMap(
      (branch) => branch.values || []
    ),
    1
  );

  const appointmentMaxValue = Math.max(
    ...(currentAnalytics?.monthlyAppointments || []).map(
      (item) => item.total || 0
    ),
    1
  );

  /* =======================================================
     NOTIFICATIONS
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
     SIDEBAR
  ======================================================= */

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  /* =======================================================
     SCHEDULE REQUEST HANDLERS
  ======================================================= */

  const handleOpenScheduleRequest = (request) => {
    setSelectedScheduleRequest(request);
  };

  const handleCloseScheduleRequest = () => {
    setSelectedScheduleRequest(null);
  };

  const handleOpenScheduleApprove = (request) => {
    setConfirmationModal({
      isOpen: true,
      action: "approve",
      request,
    });
  };

  const handleOpenScheduleReject = (request) => {
    setScheduleRequestToReject(request);
    setRejectionReason("");
    setRejectionError("");
  };

  const handleCloseScheduleReject = () => {
    setScheduleRequestToReject(null);
    setRejectionReason("");
    setRejectionError("");
  };

  const handleContinueScheduleReject = () => {
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
      request: scheduleRequestToReject,
    });

    setScheduleRequestToReject(null);
  };

  const handleCloseScheduleConfirmation = () => {
    setConfirmationModal({
      isOpen: false,
      action: "",
      request: null,
    });
  };

  const handleConfirmScheduleRequest = async () => {
    const request = confirmationModal.request;

    if (!request) return;

    const isApprove = confirmationModal.action === "approve";

    const newStatus = isApprove ? "Approved" : "Rejected";

    const result = await reviewScheduleRequest(
      request.id,
      newStatus,
      isApprove ? "" : rejectionReason.trim()
    );

    if (!result?.success) {
      alert(result?.message || "Failed to update the schedule request.");
      return;
    }

    setScheduleRequests((currentRequests) =>
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

    setNotifications((currentNotifications) => [
      {
        id: Date.now(),

        title: isApprove
          ? "Schedule Request Approved"
          : "Schedule Request Rejected",

        message: `${request.dentistName}'s schedule change request has been ${newStatus.toLowerCase()}.`,

        time: "Just now",
      },

      ...currentNotifications,
    ]);

    setSelectedScheduleRequest(null);
    setScheduleRequestToReject(null);
    setRejectionReason("");
    setRejectionError("");

    setConfirmationModal({
      isOpen: false,
      action: "",
      request: null,
    });
  };

  /* =======================================================
     EXPORT PDF
  ======================================================= */

  const handleExportPDF = async () => {
    const selectedBranch =
      currentAnalytics?.branch ||
      branchFilter ||
      "All Branches";

    const dateRangeLabel =
      fromDate && toDate
        ? `${fromDate} to ${toDate}`
        : fromDate
        ? `From ${fromDate}`
        : toDate
        ? `Until ${toDate}`
        : "All Dates";

    const completionRate =
      currentAnalytics.totalAppointments > 0
        ? Math.round(
            (currentAnalytics.completed /
              currentAnalytics.totalAppointments) *
              100
          )
        : 0;

    const cancellationRate =
      currentAnalytics.totalAppointments > 0
        ? Math.round(
            (currentAnalytics.cancelled /
              currentAnalytics.totalAppointments) *
              100
          )
        : 0;

    const walkInShare =
      currentAnalytics.totalAppointments > 0
        ? Math.round(
            (currentAnalytics.walkins /
              currentAnalytics.totalAppointments) *
              100
          )
        : 0;

    const captureSection = async (element) => {
      if (!element) return "";

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      return canvas.toDataURL("image/png");
    };

    const [
      overallChartImage,
      topServicesImage,
      appointmentTrendImage,
    ] = await Promise.all([
      captureSection(overallAnalyticsRef.current),
      captureSection(topServicesRef.current),
      captureSection(appointmentTrendsRef.current),
    ]);

    const logoUrl =
      typeof logo === "string"
        ? logo
        : new URL("../../assets/logo.png", import.meta.url).href;

    const printWindow = window.open(
      "",
      "_blank",
      "width=1200,height=900"
    );

    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Super Admin Dashboard Report</title>

          <style>
            * {
              box-sizing: border-box;
            }

            @page {
              size: A4 portrait;
              margin: 14mm;
            }

            body {
              margin: 0;
              padding: 0;
              font-family: Arial, Helvetica, sans-serif;
              background: #ffffff;
              color: #222;
              font-size: 13px;
              line-height: 1.35;
            }

            .report-container {
              width: 100%;
              max-width: 100%;
              margin: 0 auto;
            }

            .report-header {
              display: flex;
              align-items: center;
              gap: 14px;
              border-bottom: 2px solid #ef4b84;
              padding-bottom: 10px;
              margin-bottom: 14px;
            }

            .report-logo {
              width: 54px;
              height: 54px;
              object-fit: contain;
              flex-shrink: 0;
            }

            .report-title-wrap {
              flex: 1;
              min-width: 0;
            }

            .report-title {
              margin: 0;
              font-size: 24px;
              font-weight: 800;
              color: #a52d63;
              line-height: 1.1;
            }

            .report-subtitle {
              margin: 4px 0 0;
              font-size: 13px;
              color: #666;
            }

            .report-meta {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 14px;
            }

            .meta-card {
              border: 1px solid #f1d7e3;
              border-radius: 10px;
              padding: 10px 12px;
              background: #fffafb;
            }

            .meta-label {
              font-size: 11px;
              color: #888;
              margin-bottom: 4px;
              text-transform: uppercase;
              letter-spacing: 0.4px;
            }

            .meta-value {
              font-size: 13px;
              font-weight: 700;
              color: #333;
            }

            .section {
              margin-bottom: 14px;
              page-break-inside: avoid;
            }

            .section-title {
              margin: 0 0 8px;
              font-size: 13px;
              font-weight: 800;
              color: #a52d63;
              text-transform: uppercase;
              letter-spacing: 0.4px;
            }

            .stats-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 8px;
            }

            .stat-card {
              border: 1px solid #f1d7e3;
              border-radius: 10px;
              background: #ffffff;
              padding: 10px 12px;
              min-height: 72px;
            }

            .stat-label {
              font-size: 11px;
              color: #777;
              margin-bottom: 6px;
            }

            .stat-value {
              font-size: 24px;
              font-weight: 800;
              color: #ef4b84;
              line-height: 1;
            }

            .chart-grid {
              display: grid;
              grid-template-columns: 1.55fr 1fr;
              gap: 10px;
              align-items: stretch;
            }

            .chart-card,
            .single-chart {
              border: 1px solid #f1d7e3;
              border-radius: 12px;
              background: #ffffff;
              padding: 8px;
              page-break-inside: avoid;
            }

            .chart-card img,
            .single-chart img {
              width: 100%;
              height: auto;
              display: block;
              border-radius: 8px;
            }

            .chart-card img {
              max-height: 210px;
              object-fit: contain;
            }

            .single-chart img {
              max-height: 220px;
              object-fit: contain;
            }

            .kpi-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 8px;
            }

            .kpi-card {
              border: 1px solid #f1d7e3;
              border-radius: 10px;
              padding: 10px 12px;
              background: #fffafb;
              min-height: 76px;
            }

            .kpi-title {
              font-size: 11px;
              color: #666;
              margin-bottom: 5px;
            }

            .kpi-value {
              font-size: 24px;
              font-weight: 800;
              color: #d94180;
              margin-bottom: 2px;
              line-height: 1;
            }

            .kpi-note {
              font-size: 11px;
              color: #888;
            }

            .footer-note {
              margin-top: 12px;
              font-size: 10px;
              color: #888;
              text-align: right;
            }

            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>

        <body>
          <div class="report-container">
            <div class="report-header">
              <img
                src="${logoUrl}"
                alt="GC Dental Care Logo"
                class="report-logo"
              />

              <div class="report-title-wrap">
                <h1 class="report-title">
                  Super Admin Dashboard Report
                </h1>

                <p class="report-subtitle">
                  GC Dental Care • Powered by Intellident
                </p>
              </div>
            </div>

            <div class="report-meta">
              <div class="meta-card">
                <div class="meta-label">
                  Selected Branch
                </div>

                <div class="meta-value">
                  ${selectedBranch}
                </div>
              </div>

              <div class="meta-card">
                <div class="meta-label">
                  Date Range
                </div>

                <div class="meta-value">
                  ${dateRangeLabel}
                </div>
              </div>
            </div>

            <div class="section">
              <h2 class="section-title">
                Totals Summary
              </h2>

              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-label">Total Branches</div>
                  <div class="stat-value">
                    ${currentAnalytics.totalBranches}
                  </div>
                </div>

                <div class="stat-card">
                  <div class="stat-label">Total Admins</div>
                  <div class="stat-value">
                    ${currentAnalytics.totalAdmins}
                  </div>
                </div>

                <div class="stat-card">
                  <div class="stat-label">Total Dentists</div>
                  <div class="stat-value">
                    ${currentAnalytics.totalDentists}
                  </div>
                </div>

                <div class="stat-card">
                  <div class="stat-label">Total Patients</div>
                  <div class="stat-value">
                    ${currentAnalytics.totalPatients}
                  </div>
                </div>

                <div class="stat-card">
                  <div class="stat-label">Appointments</div>
                  <div class="stat-value">
                    ${currentAnalytics.totalAppointments}
                  </div>
                </div>

                <div class="stat-card">
                  <div class="stat-label">Completed</div>
                  <div class="stat-value">
                    ${currentAnalytics.completed}
                  </div>
                </div>

                <div class="stat-card">
                  <div class="stat-label">Cancelled</div>
                  <div class="stat-value">
                    ${currentAnalytics.cancelled}
                  </div>
                </div>

                <div class="stat-card">
                  <div class="stat-label">Walk-Ins</div>
                  <div class="stat-value">
                    ${currentAnalytics.walkins}
                  </div>
                </div>
              </div>
            </div>

            <div class="section">
              <h2 class="section-title">
                Analytics Overview
              </h2>

              <div class="chart-grid">
                <div class="chart-card">
                  <img
                    src="${overallChartImage}"
                    alt="Overall Branch Analytics"
                  />
                </div>

                <div class="chart-card">
                  <img
                    src="${topServicesImage}"
                    alt="Top Services"
                  />
                </div>
              </div>
            </div>

            <div class="section">
              <h2 class="section-title">
                Appointment Trends
              </h2>

              <div class="single-chart">
                <img
                  src="${appointmentTrendImage}"
                  alt="Appointment Trends"
                />
              </div>
            </div>

            <div class="section">
              <h2 class="section-title">
                Performance Rates
              </h2>

              <div class="kpi-grid">
                <div class="kpi-card">
                  <div class="kpi-title">
                    Completion Rate
                  </div>

                  <div class="kpi-value">
                    ${completionRate}%
                  </div>

                  <div class="kpi-note">
                    Based on total appointments
                  </div>
                </div>

                <div class="kpi-card">
                  <div class="kpi-title">
                    Cancellation Rate
                  </div>

                  <div class="kpi-value">
                    ${cancellationRate}%
                  </div>

                  <div class="kpi-note">
                    Based on total appointments
                  </div>
                </div>

                <div class="kpi-card">
                  <div class="kpi-title">
                    Walk-In Share
                  </div>

                  <div class="kpi-value">
                    ${walkInShare}%
                  </div>

                  <div class="kpi-note">
                    Share of walk-in records
                  </div>
                </div>
              </div>
            </div>

            <div class="footer-note">
              Generated on ${new Date().toLocaleString()}
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 700);
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="admin-dashboard-page superadmin-mobile-layout">
      <SuperAdminSidebar
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
      />

      <main className="admin-main-content">
        <SuperAdminTopbar
          notifications={notifications}
          isNotificationOpen={isNotificationOpen}
          onToggleNotifications={handleToggleNotifications}
          onCloseNotifications={handleCloseNotifications}
          onMarkAllRead={handleMarkAllRead}
          onToggleSidebar={handleToggleSidebar}
        />

        <div className="superadmin-dashboard-scroll">
          <div className="superadmin-dashboard-content">
            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <section className="superadmin-page-header">
              <div>
                <h2 className="superadmin-page-title">
                  System Overview
                </h2>

                <p className="superadmin-page-subtitle">
                  View all branches, compare results, and check overall clinic
                  performance.
                </p>
              </div>

              <button
                type="button"
                className="superadmin-export-btn"
                onClick={handleExportPDF}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M12 3V14"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />

                  <path
                    d="M8.5 10.5L12 14L15.5 10.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  <path
                    d="M5 16.5V18C5 19.1 5.9 20 7 20H17C18.1 20 19 19.1 19 18V16.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>

                <span>Export PDF</span>
              </button>
            </section>

            {/* =================================================
                FILTERS
            ================================================= */}

            <section className="superadmin-filter-grid">
              <div className="superadmin-filter-card superadmin-filter-card-wide">
                <label className="superadmin-filter-label">
                  Branch Filter
                </label>

                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="superadmin-filter-input"
                >
                  {analyticsData.map((item) => (
                    <option
                      key={item.branch}
                      value={item.branch}
                    >
                      {item.branch}
                    </option>
                  ))}
                </select>
              </div>

              <div className="superadmin-filter-card">
                <label className="superadmin-filter-label">
                  From
                </label>

                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="superadmin-filter-input"
                />
              </div>

              <div className="superadmin-filter-card">
                <label className="superadmin-filter-label">
                  To
                </label>

                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="superadmin-filter-input"
                />
              </div>
            </section>

            {/* =================================================
                STATISTICS
            ================================================= */}

            <section className="superadmin-stats-grid">
              <div className="superadmin-stat-card">
                <p className="superadmin-stat-label">
                  Total Branches
                </p>

                <h3 className="superadmin-stat-value">
                  {currentAnalytics.totalBranches}
                </h3>
              </div>

              <div className="superadmin-stat-card">
                <p className="superadmin-stat-label">
                  Total Admins
                </p>

                <h3 className="superadmin-stat-value">
                  {currentAnalytics.totalAdmins}
                </h3>
              </div>

              <div className="superadmin-stat-card">
                <p className="superadmin-stat-label">
                  Total Dentists
                </p>

                <h3 className="superadmin-stat-value">
                  {currentAnalytics.totalDentists}
                </h3>
              </div>

              <div className="superadmin-stat-card">
                <p className="superadmin-stat-label">
                  Total Patients
                </p>

                <h3 className="superadmin-stat-value">
                  {currentAnalytics.totalPatients}
                </h3>
              </div>

              <div className="superadmin-stat-card">
                <p className="superadmin-stat-label">
                  Appointments
                </p>

                <h3 className="superadmin-stat-value">
                  {currentAnalytics.totalAppointments}
                </h3>
              </div>

              <div className="superadmin-stat-card">
                <p className="superadmin-stat-label">
                  Completed
                </p>

                <h3 className="superadmin-stat-value">
                  {currentAnalytics.completed}
                </h3>
              </div>

              <div className="superadmin-stat-card">
                <p className="superadmin-stat-label">
                  Cancelled
                </p>

                <h3 className="superadmin-stat-value">
                  {currentAnalytics.cancelled}
                </h3>
              </div>

              <div className="superadmin-stat-card">
                <p className="superadmin-stat-label">
                  Walk-Ins
                </p>

                <h3 className="superadmin-stat-value">
                  {currentAnalytics.walkins}
                </h3>
              </div>
            </section>

            {/* =================================================
                ROW 1:
                OVERALL ANALYTICS + SCHEDULE REQUESTS
            ================================================= */}

            <section className="superadmin-main-grid">
              {/* OVERALL BRANCH ANALYTICS */}

              <div
                className="superadmin-panel superadmin-panel-large"
                ref={overallAnalyticsRef}
              >
                <div className="superadmin-panel-head">
                  <div>
                    <h3>Overall Branch Analytics</h3>

                    <p>
                      Monthly comparison of all three branches
                    </p>
                  </div>
                </div>

                <div className="superadmin-line-chart-wrapper">
                  <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="superadmin-line-chart"
                  >
                    {[0, 20, 40, 60, 80, 100].map((y) => (
                      <line
                        key={y}
                        x1="0"
                        y1={y}
                        x2="100"
                        y2={y}
                        className="superadmin-chart-grid-line"
                      />
                    ))}

                    {overallBranchTrends.map((branch) => (
                      <polyline
                        key={branch.name}
                        fill="none"
                        points={buildPolylinePoints(
                          branch.values || [],
                          overallMaxValue
                        )}
                        className={`superadmin-branch-line ${branch.lineClass}`}
                      />
                    ))}
                  </svg>

                  <div className="superadmin-line-chart-months">
                    {months.map((month) => (
                      <span key={month}>{month}</span>
                    ))}
                  </div>

                  <div className="superadmin-branch-legend">
                    {overallBranchTrends.map((branch, index) => (
                      <div
                        key={branch.name}
                        className="superadmin-branch-legend-item"
                      >
                        <span
                          className={`superadmin-dot dot-${index + 1}`}
                        />

                        <span>{branch.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SCHEDULE CHANGE REQUESTS */}

              <div className="superadmin-panel superadmin-schedule-request-panel">
                <div className="superadmin-panel-head">
                  <div style={{ width: "100%" }}>
                    <div className="superadmin-schedule-request-title-row">
                      <h3>Schedule Change Requests</h3>

                      <span className="superadmin-schedule-pending-count">
                        {pendingScheduleRequests.length} Pending
                      </span>
                    </div>

                    <p>Review schedule changes submitted by dentists.</p>
                  </div>
                </div>

                {pendingScheduleRequests.length > 0 ? (
                  <div className="superadmin-schedule-request-list">
                    {pendingScheduleRequests.map((request) => (
                      <div
                        key={request.id}
                        className="superadmin-schedule-request-item"
                      >
                        <div className="superadmin-schedule-request-avatar">
                          {request.dentistName
                            .replace("Dr. ", "")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="superadmin-schedule-request-info">
                          <strong>{request.dentistName}</strong>

                          <span>
                            Effective{" "}
                            {formatScheduleDate(request.effectiveDate)}
                          </span>

                          <small>
                            {request.requestedSchedules.length} requested{" "}
                            {request.requestedSchedules.length === 1
                              ? "schedule"
                              : "schedules"}{" "}
                            • Submitted {request.submittedAt}
                          </small>
                        </div>

                        <button
                          type="button"
                          className="superadmin-schedule-review-btn"
                          onClick={() =>
                            handleOpenScheduleRequest(request)
                          }
                        >
                          Review
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="superadmin-schedule-request-empty">
                    <div className="superadmin-schedule-empty-icon">
                      ✓
                    </div>

                    <div>
                      <strong>
                        No Pending Schedule Requests
                      </strong>

                      <p>
                        All dentist schedule change requests have been
                        reviewed.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* =================================================
                ROW 2:
                APPOINTMENT TREND + TOP SERVICES
            ================================================= */}

            <section className="superadmin-bottom-grid">
              {/* APPOINTMENTS TREND */}

              <div
                className="superadmin-panel"
                ref={appointmentTrendsRef}
              >
                <div className="superadmin-panel-head">
                  <div>
                    <h3>Appointments Trend</h3>

                    <p>
                      Monthly appointment records for the selected branch
                    </p>
                  </div>
                </div>

                <div className="superadmin-bar-chart-card">
                  <div className="superadmin-bar-chart-area">
                    {currentAnalytics.monthlyAppointments.map(
                      (item, idx) => (
                        <div
                          key={`${item.month}-${idx}`}
                          className="superadmin-bar-chart-item"
                        >
                          <div className="superadmin-bar-chart-column">
                            <div
                              className="superadmin-bar-chart-fill"
                              style={{
                                height: `${
                                  (item.total /
                                    appointmentMaxValue) *
                                  100
                                }%`,
                              }}
                            />
                          </div>

                          <span className="superadmin-bar-chart-label">
                            {item.month}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* TOP SERVICES */}

              <div
                className="superadmin-panel"
                ref={topServicesRef}
              >
                <div className="superadmin-panel-head">
                  <div>
                    <h3>Top Services</h3>
                    <p>Most used services</p>
                  </div>
                </div>

                <div className="superadmin-services-list">
                  {currentAnalytics.topServices.map(
                    (item, index) => (
                      <div
                        key={item.label}
                        className="superadmin-service-item"
                      >
                        <div className="superadmin-service-top">
                          <div className="superadmin-service-left">
                            <span
                              className={`superadmin-dot dot-${
                                index + 1
                              }`}
                            />

                            <span>{item.label}</span>
                          </div>

                          <strong>{item.value}%</strong>
                        </div>

                        <div className="superadmin-service-bar">
                          <div
                            className={`superadmin-service-bar-fill fill-${
                              index + 1
                            }`}
                            style={{
                              width: `${item.value}%`,
                            }}
                          />
                        </div>
                      </div>
                    )
                  )}

                  {currentAnalytics.topServices.length === 0 && (
                    <p
                      style={{
                        fontSize: 13,
                        color: "#888",
                        textAlign: "center",
                        marginTop: 20,
                      }}
                    >
                      No service data available.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* =================================================
                ROW 3: KPI
            ================================================= */}

            <section className="superadmin-kpi-row">
              <div className="superadmin-kpi-card">
                <p className="superadmin-kpi-title">
                  Completion Rate
                </p>

                <h3 className="superadmin-kpi-value">
                  {currentAnalytics.totalAppointments > 0
                    ? Math.round(
                        (currentAnalytics.completed /
                          currentAnalytics.totalAppointments) *
                          100
                      )
                    : 0}
                  %
                </h3>

                <span className="superadmin-kpi-subtext">
                  Based on total appointments
                </span>
              </div>

              <div className="superadmin-kpi-card">
                <p className="superadmin-kpi-title">
                  Cancellation Rate
                </p>

                <h3 className="superadmin-kpi-value">
                  {currentAnalytics.totalAppointments > 0
                    ? Math.round(
                        (currentAnalytics.cancelled /
                          currentAnalytics.totalAppointments) *
                          100
                      )
                    : 0}
                  %
                </h3>

                <span className="superadmin-kpi-subtext">
                  Based on total appointments
                </span>
              </div>

              <div className="superadmin-kpi-card">
                <p className="superadmin-kpi-title">
                  Walk-In Share
                </p>

                <h3 className="superadmin-kpi-value">
                  {currentAnalytics.totalAppointments > 0
                    ? Math.round(
                        (currentAnalytics.walkins /
                          currentAnalytics.totalAppointments) *
                          100
                      )
                    : 0}
                  %
                </h3>

                <span className="superadmin-kpi-subtext">
                  Share of walk-in records
                </span>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* =====================================================
          REQUEST MODALS
      ===================================================== */}

      <ScheduleRequestReviewModal
        request={selectedScheduleRequest}
        onClose={handleCloseScheduleRequest}
        onApprove={handleOpenScheduleApprove}
        onReject={handleOpenScheduleReject}
      />

      <ScheduleRejectModal
        request={scheduleRequestToReject}
        reason={rejectionReason}
        setReason={setRejectionReason}
        error={rejectionError}
        onClose={handleCloseScheduleReject}
        onContinue={handleContinueScheduleReject}
      />

      <ScheduleConfirmationModal
        confirmation={confirmationModal}
        rejectionReason={rejectionReason}
        onClose={handleCloseScheduleConfirmation}
        onConfirm={handleConfirmScheduleRequest}
      />
    </div>
  );
}