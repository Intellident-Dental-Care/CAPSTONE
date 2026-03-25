import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/dentist/layout/Sidebar";
import Topbar from "../../components/dentist/layout/Topbar";
import ProcedureModal from "../../components/dentist/patients/ProcedureModal";
import PreAssessmentModal from "../../components/dentist/patients/PreAssessmentModal";
import toothModel from "../../assets/tooth_model.png";
import profileImage from "../../assets/profile_sample.jpg";
import { createDentistProcedure, getDentistPatientHistory } from "../../services/dentistService";

import "../../styles/dentist/layout/sidebar.css";
import "../../styles/dentist/layout/topbar.css";
import "../../styles/dentist/notifications/notification-popup.css";
import "../../styles/dentist/profile/profile-page.css";
import "../../styles/dentist/shared/responsive.css";
import "../../styles/dentist/patient-history/patient-history.css";

export default function DentistPatientHistory() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("All Branch");

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [preAssessmentOpen, setPreAssessmentOpen] = useState(false);
  const [procedureModalOpen, setProcedureModalOpen] = useState(false);
  const [isProcedureSaving, setIsProcedureSaving] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedProcedure, setSelectedProcedure] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [patients, setPatients] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSaveToast, setShowSaveToast] = useState(false);

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
        const cachedPayload = cached.data || {};
        applyHistoryPayload(cachedPayload);
      }

      const fresh = await getDentistPatientHistory({ forceRefresh: true });
      if (!mounted || !fresh?.success) return;

      const payload = fresh.data || {};
      applyHistoryPayload(payload);
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

      const matchesBranch = selectedBranch === "All Branch" || patient.branch === selectedBranch;
      return matchesSearch && matchesBranch;
    });
  }, [patients, search, selectedBranch]);

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

  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
    setSelectedProcedure(null);
    setHistoryModalOpen(true);
  };

  const handleViewDetails = (procedure) => {
    setSelectedProcedure(procedure);

    if (selectedPatient?.preAssessment) {
      setPreAssessmentOpen(true);
    } else {
      setDetailsModalOpen(true);
    }
  };

  const handleOpenProcedureModal = () => {
    setProcedureModalOpen(true);
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

    // Close layered modals after successful save.
    setPreAssessmentOpen(false);
    setDetailsModalOpen(false);
    setHistoryModalOpen(false);
    setProcedureModalOpen(false);
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 1800);
    setIsProcedureSaving(false);
  };

  return (
    <div className="dentist-dashboard">
      <Sidebar />

      <main className="main-content">
        <Topbar
          title="Patient History"
          notifications={notifications}
          isNotificationOpen={isNotificationOpen}
          onToggleNotifications={handleToggleNotifications}
          onCloseNotifications={handleCloseNotifications}
          onMarkAllRead={handleMarkAllRead}
          profileImage={profileImage}
        />

        <section className="patient-history-page">
          <div className="patient-history-card">
            <div className="patient-history-toolbar">
              <div className="patient-history-search-wrap">
                <input
                  type="text"
                  placeholder="Search"
                  className="patient-history-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <span className="patient-history-search-icon">S</span>
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
              {errorMessage ? <div className="section-subtitle">{errorMessage}</div> : null}
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
                            VIEW
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
        <div className="history-modal-overlay" onClick={() => setHistoryModalOpen(false)}>
          <div className="history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="history-modal-header">
              <h2 className="history-modal-title">Patient History</h2>
              <button
                type="button"
                className="history-modal-close"
                onClick={() => setHistoryModalOpen(false)}
              >
                X
              </button>
            </div>

            <div className="history-modal-body">
              <div className="history-modal-left">
                <div className="history-modal-image-wrap">
                  <img src={toothModel} alt="Dental Record" className="history-modal-image" />
                </div>
                <p className="history-modal-record-label">{selectedPatient.currentDentalRecordLabel}</p>
              </div>

              <div className="history-modal-right">
                <h3 className="history-timeline-title">Procedure Timeline</h3>

                <div className="history-timeline-list">
                  {selectedPatient.procedures?.length > 0 ? (
                    selectedPatient.procedures.map((procedure) => (
                      <div className="history-timeline-card" key={procedure.id}>
                        <div className="history-timeline-card-top">
                          <span className="history-timeline-date">{procedure.date}</span>

                          <button
                            type="button"
                            className="history-view-details-btn"
                            onClick={() => handleViewDetails(procedure)}
                          >
                            View details
                          </button>
                        </div>

                        <p className="history-timeline-text">
                          <span>Procedure:</span> {procedure.procedure}
                        </p>
                        <p className="history-timeline-text">
                          <span>Tooth:</span> {procedure.tooth}
                        </p>
                        <p className="history-timeline-text">
                          <span>Dentist:</span> {procedure.dentist}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="history-timeline-empty">No procedure history found.</div>
                  )}
                </div>

                <div className="history-modal-actions">
                  <button type="button" className="history-close-btn" onClick={() => setHistoryModalOpen(false)}>
                    Close
                  </button>

                  <button type="button" className="history-add-btn" onClick={handleOpenProcedureModal}>
                    Add Procedure
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedPatient?.preAssessment && (
        <PreAssessmentModal
          open={preAssessmentOpen}
          onClose={() => setPreAssessmentOpen(false)}
          data={selectedPatient.preAssessment}
          showAddProcedure={false}
        />
      )}

      {detailsModalOpen && selectedProcedure && (
        <div className="history-detail-overlay" onClick={() => setDetailsModalOpen(false)}>
          <div className="history-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="history-detail-header">
              <h2 className="history-detail-title">Patient History Details</h2>
              <button
                type="button"
                className="history-detail-close"
                onClick={() => setDetailsModalOpen(false)}
              >
                X
              </button>
            </div>

            <div className="history-detail-content">
              <div className="history-detail-section">
                <h3 className="history-detail-section-title">Pre-Assessment</h3>
                <div className="history-detail-empty-box">No pre-assessment done for this patient.</div>
              </div>

              <div className="history-detail-section">
                <h3 className="history-detail-section-title">Procedure Details</h3>

                <div className="history-detail-info-card">
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
                <button type="button" className="history-detail-close-btn" onClick={() => setDetailsModalOpen(false)}>
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
        tooth={selectedProcedure?.tooth || selectedPatient?.preAssessment?.tooth || "Not specified"}
        isSaving={isProcedureSaving}
      />
      {showSaveToast ? <div className="save-toast">Procedure saved successfully</div> : null}
    </div>
  );
}
