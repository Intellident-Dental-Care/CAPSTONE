import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/admin/layout/AdminSidebar";
import AdminTopbar from "../../components/admin/layout/AdminTopbar";
import {
  getAdminDentists,
  getLeaveRequests,
  reviewLeaveRequest,
} from "../../services/adminService";
import { useBranch } from "../../context/BranchContext";

import "../../styles/admin/dentist/admin-dentist.css";
import "../../styles/admin/dashboard/admin-layout.css";
import "../../styles/admin/layout/admin-sidebar.css";
import "../../styles/admin/layout/admin-topbar.css";
import "../../styles/admin/notifications/admin-notification-popup.css";
import "../../styles/admin/shared/admin-responsive.css";

function formatDate(dateString) {
  if (!dateString) return "N/A";

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatShortDate(dateString) {
  if (!dateString) return "";

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getDentistOnLeaveInfo(dentist) {
  if (
    !dentist?.leave ||
    !Array.isArray(dentist.leave) ||
    dentist.leave.length === 0
  ) {
    return {
      isOnLeave: false,
      leaveData: null,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const leave of dentist.leave) {
    const startDate = new Date(leave.start_date);
    const endDate = new Date(leave.end_date);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    if (today >= startDate && today <= endDate) {
      return {
        isOnLeave: true,
        leaveData: leave,
      };
    }
  }

  return {
    isOnLeave: false,
    leaveData: null,
  };
}

const mapLeaveRequestRow = (row) => ({
  id: row.id,
  dentistId: row.dentist_id,
  dentistName: row.dentist_list?.name || "Unknown Dentist",
  specialty: row.dentist_list?.specialization || "",
  leaveType: row.leave_type,
  dates: Array.isArray(row.leave_dates) ? row.leave_dates : [],
  reason: row.reason,
  notes: row.notes || "",
  submittedAt: row.created_at ? String(row.created_at).slice(0, 10) : "",
  status: row.status,
  rejectionReason: row.rejection_reason || "",
});

/* =========================================================
   LEAVE REQUEST DETAILS MODAL
========================================================= */

function LeaveRequestModal({
  request,
  onClose,
  onApprove,
  onReject,
}) {
  if (!request) return null;

  return (
    <div
      className="dentist-details-overlay"
      onMouseDown={onClose}
    >
      <div
        className="leave-request-modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="dentist-details-close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="leave-request-modal-header">
          <div>
            <span className="leave-request-eyebrow">
              Dentist Leave Request
            </span>

            <h2>{request.dentistName}</h2>

            <p>
              Review the dentist's requested leave dates before
              approving or rejecting the request.
            </p>
          </div>

          <span
            className={`leave-request-status ${request.status.toLowerCase()}`}
          >
            {request.status}
          </span>
        </div>

        <div className="leave-request-summary-grid">
          <div className="leave-request-summary-card">
            <span>Leave Type</span>
            <strong>{request.leaveType}</strong>
          </div>

          <div className="leave-request-summary-card">
            <span>Branch</span>
            <strong>{request.branch}</strong>
          </div>

          <div className="leave-request-summary-card">
            <span>Submitted</span>
            <strong>{formatDate(request.submittedAt)}</strong>
          </div>
        </div>

        <div className="leave-request-section">
          <h4>Requested Leave Dates</h4>

          <div className="leave-request-date-list">
            {request.dates.map((date) => (
              <div
                className="leave-request-date-chip"
                key={date}
              >
                {formatDate(date)}
              </div>
            ))}
          </div>
        </div>

        <div className="leave-request-section">
          <h4>Reason</h4>

          <div className="leave-request-text-box">
            {request.reason}
          </div>
        </div>

        {request.notes && (
          <div className="leave-request-section">
            <h4>Additional Notes</h4>

            <div className="leave-request-text-box">
              {request.notes}
            </div>
          </div>
        )}

        {request.status === "Rejected" &&
          request.rejectionReason && (
            <div className="leave-request-section">
              <h4>Reason for Rejection</h4>

              <div className="leave-request-text-box rejected-box">
                {request.rejectionReason}
              </div>
            </div>
          )}

        {request.status === "Pending" ? (
          <div className="leave-request-modal-actions">
            <button
              type="button"
              className="leave-request-reject-btn"
              onClick={() => onReject(request)}
            >
              Reject
            </button>

            <button
              type="button"
              className="leave-request-approve-btn"
              onClick={() => onApprove(request)}
            >
              Approve Request
            </button>
          </div>
        ) : (
          <div className="leave-request-modal-actions">
            <button
              type="button"
              className="leave-request-close-btn"
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

function RejectLeaveRequestModal({
  request,
  rejectionReason,
  setRejectionReason,
  errorMessage,
  onClose,
  onContinue,
}) {
  if (!request) return null;

  return (
    <div
      className="dentist-details-overlay leave-reject-overlay"
      onMouseDown={onClose}
    >
      <div
        className="reject-leave-modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="dentist-details-close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="reject-leave-icon">!</div>

        <h2>Reject Leave Request</h2>

        <p>
          Please provide a reason for rejecting{" "}
          <strong>{request.dentistName}</strong>'s leave request.
        </p>

        <div className="reject-leave-field">
          <label>Reason for Rejection</label>

          <textarea
            rows="5"
            placeholder="Enter the reason why this leave request is being rejected..."
            value={rejectionReason}
            onChange={(e) => {
              setRejectionReason(e.target.value);
            }}
          />
        </div>

        {errorMessage && (
          <div className="leave-request-error">
            {errorMessage}
          </div>
        )}

        <div className="reject-leave-actions">
          <button
            type="button"
            className="reject-cancel-btn"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="reject-confirm-btn"
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

function RequestConfirmationModal({
  request,
  action,
  rejectionReason,
  onClose,
  onConfirm,
}) {
  if (!request || !action) return null;

  const isApprove = action === "approve";

  return (
    <div
      className="dentist-details-overlay request-confirm-overlay"
      onMouseDown={onClose}
    >
      <div
        className="request-confirm-modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="request-confirm-close"
          onClick={onClose}
        >
          ×
        </button>

        <div
          className={`request-confirm-icon ${
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
            ? "Are you sure you want to approve this leave request? The request will be marked as approved after confirmation."
            : "Are you sure you want to reject this leave request? The dentist will be able to see the reason for rejection."}
        </p>

        <div className="request-confirm-summary">
          <div>
            <span>Dentist</span>
            <strong>{request.dentistName}</strong>
          </div>

          <div>
            <span>Leave Type</span>
            <strong>{request.leaveType}</strong>
          </div>

          <div>
            <span>Branch</span>
            <strong>{request.branch}</strong>
          </div>

          <div>
            <span>Leave Date(s)</span>
            <strong>
              {request.dates
                .map((date) => formatShortDate(date))
                .join(", ")}
            </strong>
          </div>
        </div>

        {!isApprove && rejectionReason && (
          <div className="request-confirm-reason">
            <span>Reason for Rejection</span>

            <p>{rejectionReason}</p>
          </div>
        )}

        <div className="request-confirm-actions">
          <button
            type="button"
            className="request-confirm-cancel"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className={
              isApprove
                ? "request-confirm-approve"
                : "request-confirm-reject"
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
   DENTIST DETAILS MODAL
========================================================= */

function DentistDetailsModal({
  dentist,
  onClose,
  selectedBranch,
  leaveRequests,
  onViewRequest,
}) {
  if (!dentist) return null;

  const { isOnLeave } = getDentistOnLeaveInfo(dentist);

  const displayStatus = isOnLeave
    ? "On Leave"
    : dentist.status;

  const dentistRequests = leaveRequests.filter(
    (request) =>
      String(request.dentistId) === String(dentist.id)
  );

  return (
    <div
      className="dentist-details-overlay"
      onMouseDown={onClose}
    >
      <div
        className="dentist-details-modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="dentist-details-close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="dentist-details-header">
          <div className="dentist-details-avatar">
            {dentist.name
              .replace("Dr. ", "")
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="dentist-details-header-text">
            <h2>{dentist.name}</h2>
            <p>{dentist.specialty}</p>

            <span
              className={`dentist-badge ${String(
                displayStatus || ""
              )
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

            <div className="dentist-info-row">
              <span>Assigned Branch View</span>
              <strong>
                {dentist.currentBranchToday ||
                  selectedBranch}
              </strong>
            </div>

            <div className="dentist-info-row">
              <span>Today's Schedule</span>
              <strong>
                {dentist.currentScheduleToday ||
                  "No Schedule Today"}
              </strong>
            </div>
          </div>

          <div className="dentist-info-card dentist-schedule-card">
            <h4>Schedule in All Branches</h4>

            <div className="dentist-schedule-list">
              {Array.isArray(dentist.schedules) &&
              dentist.schedules.length > 0 ? (
                dentist.schedules.map((schedule, index) => (
                  <div
                    className="dentist-schedule-item"
                    key={index}
                  >
                    <div className="dentist-schedule-top">
                      <strong>{schedule.branch}</strong>
                    </div>

                    <p>{schedule.days}</p>
                    <span>{schedule.time}</span>
                  </div>
                ))
              ) : (
                <div className="dentist-request-empty">
                  No schedule information available.
                </div>
              )}
            </div>
          </div>

          <div className="dentist-info-card dentist-leave-request-card">
            <div className="dentist-request-card-heading">
              <div>
                <h4>Leave Requests</h4>
                <p>
                  Leave requests submitted by this dentist.
                </p>
              </div>

              {dentistRequests.some(
                (request) => request.status === "Pending"
              ) && (
                <span className="dentist-pending-count">
                  {
                    dentistRequests.filter(
                      (request) =>
                        request.status === "Pending"
                    ).length
                  }{" "}
                  Pending
                </span>
              )}
            </div>

            {dentistRequests.length > 0 ? (
              <div className="dentist-request-history">
                {dentistRequests.map((request) => (
                  <div
                    className="dentist-request-history-item"
                    key={request.id}
                  >
                    <div className="dentist-request-history-main">
                      <div className="dentist-request-history-top">
                        <strong>{request.leaveType}</strong>

                        <span
                          className={`leave-request-status small ${request.status.toLowerCase()}`}
                        >
                          {request.status}
                        </span>
                      </div>

                      <p>
                        {request.dates
                          .map((date) =>
                            formatShortDate(date)
                          )
                          .join(", ")}
                      </p>

                      <span>
                        Submitted{" "}
                        {formatDate(request.submittedAt)}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="dentist-request-view-btn"
                      onClick={() =>
                        onViewRequest(request)
                      }
                    >
                      View Request
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dentist-request-empty">
                No leave requests submitted by this dentist.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function AdminDentist() {
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedDentist, setSelectedDentist] =
    useState(null);

  const [selectedRequest, setSelectedRequest] =
    useState(null);

  const [requestToReject, setRequestToReject] =
    useState(null);

  const [rejectionReason, setRejectionReason] =
    useState("");

  const [rejectionError, setRejectionError] =
    useState("");

  const [confirmationModal, setConfirmationModal] =
    useState({
      isOpen: false,
      action: "",
      request: null,
    });

  const [dentists, setDentists] = useState([]);

  const { selectedBranch } = useBranch();

  const [rawLeaveRequests, setRawLeaveRequests] = useState([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const dentistsResult = await getAdminDentists();

      if (
        active &&
        dentistsResult?.success &&
        Array.isArray(dentistsResult.data)
      ) {
        setDentists(dentistsResult.data);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const branchDentists = useMemo(() => {
    return dentists.filter((dentist) =>
      Array.isArray(dentist.schedules)
        ? dentist.schedules.some(
            (schedule) =>
              !selectedBranch ||
              selectedBranch === "All" ||
              String(schedule.branch || "")
                .trim()
                .toLowerCase() ===
                selectedBranch.trim().toLowerCase()
          )
        : false
    );
  }, [selectedBranch, dentists]);

  useEffect(() => {
    let active = true;

    const loadLeaveRequests = async () => {
      const response = await getLeaveRequests();

      if (active && response?.success && Array.isArray(response.data)) {
        setRawLeaveRequests(response.data.map(mapLeaveRequestRow));
      }
    };

    loadLeaveRequests();

    return () => {
      active = false;
    };
  }, []);

  const leaveRequests = useMemo(() => {
    return rawLeaveRequests.map((request) => {
      const dentist = branchDentists.find(
        (item) => String(item.id) === String(request.dentistId)
      );

      return {
        ...request,
        branch:
          dentist?.currentBranchToday ||
          dentist?.schedules?.[0]?.branch ||
          selectedBranch,
      };
    });
  }, [rawLeaveRequests, branchDentists, selectedBranch]);

  const filteredDentists = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return branchDentists;
    }

    return branchDentists.filter((dentist) => {
      return (
        String(dentist.name || "")
          .toLowerCase()
          .includes(search) ||
        String(dentist.specialty || "")
          .toLowerCase()
          .includes(search) ||
        String(dentist.status || "")
          .toLowerCase()
          .includes(search) ||
        String(dentist.phone || "")
          .toLowerCase()
          .includes(search)
      );
    });
  }, [branchDentists, searchTerm]);

  const totalDentists = branchDentists.length;

  const activeDentists = branchDentists.filter(
    (dentist) =>
      dentist.status === "Available" ||
      dentist.status === "On Duty"
  ).length;

  const pendingLeaveRequests = leaveRequests.filter(
    (request) => request.status === "Pending"
  );

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
  };

  /* =======================================================
     APPROVE FLOW
  ======================================================= */

  const handleOpenApproveConfirmation = (request) => {
    setConfirmationModal({
      isOpen: true,
      action: "approve",
      request,
    });
  };

  /* =======================================================
     REJECT FLOW
  ======================================================= */

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
        "Please provide a reason for rejecting this request."
      );
      return;
    }

    const request = requestToReject;

    setRejectionError("");
    setRequestToReject(null);

    setConfirmationModal({
      isOpen: true,
      action: "reject",
      request,
    });
  };

  /* =======================================================
     CONFIRMATION
  ======================================================= */

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

    const requestId = request.id;
    const isApprove = confirmationModal.action === "approve";
    const newStatus = isApprove ? "Approved" : "Rejected";
    const finalReason = isApprove ? "" : rejectionReason.trim();

    const result = await reviewLeaveRequest(
      requestId,
      newStatus,
      finalReason
    );

    if (!result?.success) {
      alert(result?.message || "Failed to update the leave request.");
      return;
    }

    setRawLeaveRequests((prev) =>
      prev.map((item) =>
        item.id === requestId
          ? {
              ...item,
              status: newStatus,
              rejectionReason: finalReason,
            }
          : item
      )
    );

    setSelectedRequest((prev) =>
      prev?.id === requestId
        ? {
            ...prev,
            status: newStatus,
            rejectionReason: finalReason,
          }
        : prev
    );

    setConfirmationModal({
      isOpen: false,
      action: "",
      request: null,
    });

    setRequestToReject(null);
    setRejectionReason("");
    setRejectionError("");
  };

  return (
    <div className="admin-dentist-page">
      <AdminSidebar />

      <div className="admin-dentist-main">
        <AdminTopbar title="Dentist" />

        <div className="admin-dentist-content">
          <div className="admin-dentist-heading">
            <div>
              <h1>Dentists</h1>

              <p>
                Manage and view dentist records assigned to{" "}
                {selectedBranch}.
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

            <div className="dentist-stat-card pending-request-stat">
              <div className="pending-stat-heading">
                <span>
                  Pending Leave Requests
                </span>

                {pendingLeaveRequests.length > 0 && (
                  <div className="pending-stat-dot" />
                )}
              </div>

              <h3>
                {pendingLeaveRequests.length}
              </h3>

              <p>Waiting for Admin review</p>
            </div>
          </div>

          <div className="admin-pending-leave-card">
            <div className="admin-pending-leave-header">
              <div>
                <h3>Dentist Leave Requests</h3>

                <p>
                  Review pending requests submitted by dentists
                  assigned to your branch.
                </p>
              </div>

              <span className="admin-pending-leave-count">
                {pendingLeaveRequests.length} Pending
              </span>
            </div>

            {pendingLeaveRequests.length > 0 ? (
              <div className="admin-pending-leave-list">
                {pendingLeaveRequests.map((request) => (
                  <div
                    className="admin-pending-leave-item"
                    key={request.id}
                  >
                    <div className="admin-pending-leave-avatar">
                      {request.dentistName
                        .replace("Dr. ", "")
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="admin-pending-leave-info">
                      <strong>
                        {request.dentistName}
                      </strong>

                      <span>
                        {request.leaveType} •{" "}
                        {request.dates
                          .map((date) =>
                            formatShortDate(date)
                          )
                          .join(", ")}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="admin-review-request-btn"
                      onClick={() =>
                        handleViewRequest(request)
                      }
                    >
                      Review
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="admin-pending-empty">
                No pending leave requests.
              </div>
            )}
          </div>

          <div className="admin-dentist-table-card">
            <div className="admin-dentist-table-top">
              <div>
                <h3>Dentist List</h3>

                <p>
                  {filteredDentists.length} dentist(s) found
                </p>
              </div>

              <div className="admin-dentist-search">
                <input
                  type="text"
                  placeholder="Search dentist, specialty, phone..."
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(e.target.value)
                  }
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
                    <th>Leave Request</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredDentists.length > 0 ? (
                    filteredDentists.map((dentist) => {
                      const { isOnLeave } =
                        getDentistOnLeaveInfo(dentist);

                      const displayStatus = isOnLeave
                        ? "On Leave"
                        : dentist.status;

                      const visibleBranch =
                        dentist.currentBranchToday ||
                        selectedBranch;

                      const dentistPendingRequests =
                        leaveRequests.filter(
                          (request) =>
                            String(request.dentistId) ===
                              String(dentist.id) &&
                            request.status === "Pending"
                        );

                      return (
                        <tr key={dentist.id}>
                          <td>{dentist.name}</td>

                          <td>{dentist.specialty}</td>

                          <td>{visibleBranch}</td>

                          <td>{dentist.phone}</td>

                          <td>
                            <span
                              className={`dentist-badge ${String(
                                displayStatus || ""
                              )
                                .toLowerCase()
                                .replace(/\s+/g, "-")}`}
                            >
                              {displayStatus}
                            </span>
                          </td>

                          <td>
                            {dentistPendingRequests.length >
                            0 ? (
                              <span className="table-pending-request">
                                {
                                  dentistPendingRequests.length
                                }{" "}
                                Pending
                              </span>
                            ) : (
                              <span className="table-no-request">
                                None
                              </span>
                            )}
                          </td>

                          <td>
                            <button
                              type="button"
                              className="dentist-view-btn"
                              onClick={() =>
                                setSelectedDentist(
                                  dentist
                                )
                              }
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan="7"
                        className="dentist-empty-state"
                      >
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
        onClose={() =>
          setSelectedDentist(null)
        }
        selectedBranch={
          selectedBranch
        }
        leaveRequests={leaveRequests}
        onViewRequest={handleViewRequest}
      />

      <LeaveRequestModal
        request={selectedRequest}
        onClose={() =>
          setSelectedRequest(null)
        }
        onApprove={
          handleOpenApproveConfirmation
        }
        onReject={handleOpenRejectModal}
      />

      <RejectLeaveRequestModal
        request={requestToReject}
        rejectionReason={rejectionReason}
        setRejectionReason={
          setRejectionReason
        }
        errorMessage={rejectionError}
        onClose={handleCloseRejectModal}
        onContinue={handleContinueReject}
      />

      <RequestConfirmationModal
        request={confirmationModal.request}
        action={confirmationModal.action}
        rejectionReason={rejectionReason}
        onClose={handleCloseConfirmation}
        onConfirm={handleConfirmRequestAction}
      />
    </div>
  );
}