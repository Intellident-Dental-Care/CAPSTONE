import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/dentist/layout/Sidebar";
import Topbar from "../../components/dentist/layout/Topbar";
import ProcedureModal from "../../components/dentist/patients/ProcedureModal";
import profileImage from "../../assets/profile_sample.jpg";
import {
  createDentistProcedure,
  getDentistPatientHistory,
} from "../../services/dentistService";

import "../../styles/dentist/layout/sidebar.css";
import "../../styles/admin/layout/admin-topbar.css";
import "../../styles/dentist/layout/topbar.css";
import "../../styles/dentist/notifications/notification-popup.css";
import "../../styles/dentist/profile/profile-page.css";
import "../../styles/dentist/shared/responsive.css";
import "../../styles/dentist/patient-history/patient-history.css";

const formatStatus = (status) => {
  if (!status) return "Pending";

  const normalized = String(status).toLowerCase().replace(/_/g, " ");

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const getRecordStatus = (record) => {
  return formatStatus(
    record?.status ||
      record?.bookingStatus ||
      record?.appointmentStatus ||
      record?.booking_status ||
      record?.appointment_status
  );
};

const getStatusClass = (status) => {
  return String(status || "pending")
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-");
};

export default function DentistPatientHistory() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("All Branch");

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [procedureModalOpen, setProcedureModalOpen] = useState(false);
  const [isProcedureSaving, setIsProcedureSaving] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedProcedure, setSelectedProcedure] = useState(null);
  const [selectedTooth, setSelectedTooth] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [patients, setPatients] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSaveToast, setShowSaveToast] = useState(false);

  useEffect(() => {
    const handleIframeMessage = (event) => {
      if (event.data?.type === "TOOTH_SELECTED") {
        setSelectedTooth(event.data.tooth);
      } else if (event.data?.type === "SELECTION_CLEARED") {
        setSelectedTooth(null);
      }
    };

    window.addEventListener("message", handleIframeMessage);
    return () => window.removeEventListener("message", handleIframeMessage);
  }, []);

  const applyHistoryPayload = (payload = {}) => {
    setPatients(payload.patients || []);
    setNotifications(payload.notifications || []);
    setBranchOptions(payload.branches || []);
  };

  useEffect(() => {
    let mounted = true;

    const loadHistory = async () => {
      const cached = await getDentistPatientHistory();

      if (!mounted) return;

      if (cached?.success) {
        applyHistoryPayload(cached.data || {});
      }

      const fresh = await getDentistPatientHistory({ forceRefresh: true });

      if (!mounted || !fresh?.success) return;

      applyHistoryPayload(fresh.data || {});
    };

    loadHistory();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const matchesSearch =
        patient.name.toLowerCase().includes(search.toLowerCase()) ||
        String(patient.phone || "").includes(search);

      const matchesBranch =
        selectedBranch === "All Branch" || patient.branch === selectedBranch;

      return matchesSearch && matchesBranch;
    });
  }, [patients, search, selectedBranch]);

  const filteredTimeline = useMemo(() => {
    if (!selectedPatient?.procedures) return [];

    if (!selectedTooth) return selectedPatient.procedures;

    return selectedPatient.procedures.filter(
      (proc) => proc.tooth && proc.tooth.includes(selectedTooth)
    );
  }, [selectedPatient, selectedTooth]);

  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
    setSelectedProcedure(null);
    setSelectedTooth(null);
    setHistoryModalOpen(true);
  };

  const handleViewDetails = (procedure) => {
    setSelectedProcedure(procedure);
    setDetailsModalOpen(true);
  };

  const handleSaveProcedure = async (payload) => {
    setIsProcedureSaving(true);
    setErrorMessage("");

    const patientId = selectedPatient?.patientId;

    if (!patientId) {
      setErrorMessage("Unable to save procedure: patient UUID is missing.");
      setIsProcedureSaving(false);
      return;
    }

    const result = await createDentistProcedure({
      patientId,
      bookingId: selectedProcedure?.bookingId || null,
      tooth: payload?.tooth || null,
      procedure: payload?.service || "",
      remarks: payload?.remarks || "",
      beforeImageUrl: null,
      afterImageUrl: null,
    });

    if (!result?.success) {
      setErrorMessage(result?.message || "Failed to save procedure.");
      setIsProcedureSaving(false);
      return;
    }

    const refreshed = await getDentistPatientHistory({ forceRefresh: true });

    if (refreshed?.success) {
      applyHistoryPayload(refreshed.data || {});
    }

    setDetailsModalOpen(false);
    setHistoryModalOpen(false);
    setProcedureModalOpen(false);
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 1800);
    setIsProcedureSaving(false);
  };

  return (
    <div className="dentist-dashboard">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="main-content">
        <Topbar
          title="Patient History"
          notifications={notifications}
          isNotificationOpen={isNotificationOpen}
          onToggleNotifications={() => setIsNotificationOpen((prev) => !prev)}
          onCloseNotifications={() => setIsNotificationOpen(false)}
          onMarkAllRead={() => {
            setNotifications([]);
            setIsNotificationOpen(false);
          }}
          profileImage={profileImage}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />

        <section className="patient-history-page">
          <div className="patient-history-card">
            <div className="patient-history-toolbar">
              <div className="patient-history-search-wrap">
                <input
                  type="text"
                  placeholder="Search patient name or phone number"
                  className="patient-history-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <span className="patient-history-search-icon">⌕</span>
              </div>

              <select
                className="patient-history-branch-filter"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <option>All Branch</option>
                {branchOptions.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>

            <div className="patient-history-table-wrap">
              {errorMessage ? (
                <div className="section-subtitle">{errorMessage}</div>
              ) : null}

              <table className="patient-history-table">
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>Gender</th>
                    <th>Age</th>
                    <th>Phone Number</th>
                    <th>Date of Visit</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPatients.length > 0 ? (
                    filteredPatients.map((patient) => (
                      <tr key={patient.id}>
                        <td className="patient-name-cell">{patient.name}</td>
                        <td>{patient.gender}</td>
                        <td>{patient.age}</td>
                        <td>{patient.phone}</td>
                        <td>{patient.dateOfVisit}</td>
                        <td>
                          <button
                            type="button"
                            className="patient-history-view-btn"
                            onClick={() => handleViewPatient(patient)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="patient-history-empty">
                        No patient history found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {historyModalOpen && selectedPatient && (
        <div
          className="history-modal-overlay"
          onClick={() => setHistoryModalOpen(false)}
        >
          <div className="history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="history-modal-header">
              <h2 className="history-modal-title">Booking History Overview</h2>

              <button
                type="button"
                className="history-modal-close"
                onClick={() => setHistoryModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="history-modal-body">
              <div className="history-modal-left">
                <div className="history-modal-image-wrap">
                  <iframe
                    src="https://intellident-3d-viewer.vercel.app/"
                    title="IntelliDent 3D Viewer"
                    style={{
                      width: "100%",
                      height: "350px",
                      border: "none",
                    }}
                  />
                </div>

                <h3 className="history-modal-record-label">
                  Patient Dental Record
                </h3>

                <p className="history-modal-record-subtext">
                  Select a booking history from the timeline to view complete
                  details and pre-assessment information.
                </p>
              </div>

              <div className="history-modal-right">
                <h2 className="history-timeline-title">
                  {selectedTooth
                    ? `Booking History • ${selectedTooth}`
                    : "Booking History"}
                </h2>

                <p className="history-timeline-subtitle">
                  Complete appointment and procedure history of the patient.
                </p>

                <div className="history-timeline-list">
                  {filteredTimeline.length > 0 ? (
                    filteredTimeline.map((procedure) => {
                      const status = getRecordStatus(procedure);

                      return (
                        <div
                          className="history-timeline-card"
                          key={procedure.id}
                        >
                          <div className="history-timeline-card-top">
                            <span className="history-timeline-date">
                              {procedure.date}
                            </span>

                            <button
                              type="button"
                              className="history-view-details-btn"
                              onClick={() => handleViewDetails(procedure)}
                            >
                              View Details
                            </button>
                          </div>

                          <div className="history-timeline-grid">
                            <p>
                              <span>Appointment:</span>{" "}
                              <strong
                                className={`history-status-badge ${getStatusClass(
                                  status
                                )}`}
                              >
                                {status}
                              </strong>
                            </p>

                            <p>
                              <span>Procedure:</span> {procedure.procedure}
                            </p>

                            <p>
                              <span>Tooth:</span> {procedure.tooth}
                            </p>

                            <p>
                              <span>Dentist:</span> {procedure.dentist}
                            </p>

                            <p>
                              <span>Pre-Assessment:</span>{" "}
                              {procedure.preAssessment
                                ? "Available"
                                : "No Pre-Assessment"}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="history-timeline-empty">
                      {selectedTooth
                        ? `No booking history found for ${selectedTooth}.`
                        : "No booking history found."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {detailsModalOpen && selectedProcedure && (
        <div
          className="history-detail-overlay"
          onClick={() => setDetailsModalOpen(false)}
        >
          <div
            className="history-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="history-detail-header">
              <h2 className="history-detail-title">Patient History Details</h2>

              <button
                type="button"
                className="history-detail-close"
                onClick={() => setDetailsModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="history-detail-content">
              <div className="history-detail-section">
                <div className="history-detail-section-header">
                  <h3 className="history-detail-section-title">
                    Pre-Assessment Review
                  </h3>

                  <span className="history-detail-status">
                    {selectedProcedure.preAssessment
                      ? "Available"
                      : "No Assessment"}
                  </span>
                </div>

                {selectedProcedure.preAssessment ? (
                  <div className="history-detail-info-card history-preassessment-scroll">
                    {selectedProcedure.preAssessment.questions?.map(
                      (item, idx) => (
                        <div key={idx} className="history-preassessment-item">
                          <p>
                            <span>Question {idx + 1}:</span> {item.question}
                          </p>

                          <p>
                            <span>Answer:</span> {item.answer}
                          </p>
                        </div>
                      )
                    )}

                    {selectedProcedure.preAssessment.suggestedTreatment && (
                      <div className="history-suggested-treatment">
                        <p>
                          <span>Suggested Treatment / Procedure:</span>{" "}
                          {selectedProcedure.preAssessment.suggestedTreatment}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="history-no-assessment">
                    <div className="history-no-assessment-icon">🦷</div>

                    <div>
                      <h4>No Pre-Assessment Submitted</h4>

                      <p>
                        The patient proceeded directly to booking without
                        submitting a pre-assessment form.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="history-detail-section">
                <h3 className="history-detail-section-title">
                  Procedure Details
                </h3>

                <div className="history-detail-info-card">
                  <p>
                    <span>Status:</span> {getRecordStatus(selectedProcedure)}
                  </p>

                  <p>
                    <span>Date:</span> {selectedProcedure.date}
                  </p>

                  <p>
                    <span>Procedure:</span> {selectedProcedure.procedure}
                  </p>

                  <p>
                    <span>Tooth:</span> {selectedProcedure.tooth}
                  </p>

                  <p>
                    <span>Dentist:</span> {selectedProcedure.dentist}
                  </p>

                  <p>
                    <span>Remarks:</span> {selectedProcedure.remarks}
                  </p>
                </div>
              </div>

              <div className="history-detail-actions">
                <button
                  type="button"
                  className="history-detail-close-btn"
                  onClick={() => setDetailsModalOpen(false)}
                >
                  Close
                </button>

                <button
                  type="button"
                  className="history-detail-add-btn"
                  onClick={() => {
                    setDetailsModalOpen(false);
                    setProcedureModalOpen(true);
                  }}
                >
                  Add Procedure
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ProcedureModal
        open={procedureModalOpen}
        onClose={() => setProcedureModalOpen(false)}
        onSave={handleSaveProcedure}
        tooth={
          selectedTooth ||
          selectedProcedure?.tooth ||
          selectedPatient?.preAssessment?.tooth ||
          "Not specified"
        }
        isSaving={isProcedureSaving}
      />

      {showSaveToast ? (
        <div className="save-toast">Procedure saved successfully</div>
      ) : null}
    </div>
  );
}