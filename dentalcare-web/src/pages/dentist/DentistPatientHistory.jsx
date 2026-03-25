import { useMemo, useState } from "react";
import Sidebar from "../../components/dentist/layout/Sidebar";
import Topbar from "../../components/dentist/layout/Topbar";
import ProcedureModal from "../../components/dentist/patients/ProcedureModal";
import PreAssessmentModal from "../../components/dentist/patients/PreAssessmentModal";
import toothModel from "../../assets/tooth_model.png";

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

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedProcedure, setSelectedProcedure] = useState(null);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New Appointment Requests:",
      message: "John Doe for Consultation",
      time: "2 mins ago",
    },
    {
      id: 2,
      title: "Pre-Assessment Completed:",
      message: "Jane Smith for Tooth Extraction",
      time: "10 mins ago",
    },
    {
      id: 3,
      title: "Pre-Assessment Completed:",
      message: "Jane Smith for Tooth Extraction",
      time: "10 mins ago",
    },
  ]);

  const patients = [
    {
      id: 1,
      name: "Sarah Kim",
      gender: "Female",
      age: 25,
      phone: "09123456789",
      branch: "Dasmariñas Branch",
      dateOfVisit: "Feb. 05, 2026",
      currentDentalRecordLabel: "Current Dental Record",
      preAssessment: {
        tooth: "Tooth (#18) 3rd Molar",
        uploadedPhotos: [],
        questions: [
          {
            question: "What discomfort are you feeling?",
            answer: "Pain while chewing on the lower right side.",
          },
          {
            question: "How long have you experienced it?",
            answer: "For around 3 days already.",
          },
          {
            question: "Is there swelling or bleeding?",
            answer: "Slight swelling, no bleeding.",
          },
        ],
        suggestedTreatment: "Restoration",
        suggestedPrice: "₱1,500",
      },
      procedures: [
        {
          id: 101,
          date: "Feb. 05, 2026",
          procedure: "Restoration",
          tooth: "Tooth (#18) 3rd Molar",
          dentist: "Dr. Nicole Hernandezz",
          remarks:
            "Patient presented with cavity on the 3rd molar. Restoration was completed successfully.",
          beforePhoto: null,
          afterPhoto: null,
        },
        {
          id: 102,
          date: "Feb. 05, 2026",
          procedure: "Restoration",
          tooth: "Tooth (#18) 3rd Molar",
          dentist: "Dr. Nicole Hernandezz",
          remarks:
            "Follow-up record for restoration and occlusion checking.",
          beforePhoto: null,
          afterPhoto: null,
        },
        {
          id: 103,
          date: "Feb. 05, 2026",
          procedure: "Restoration",
          tooth: "Tooth (#18) 3rd Molar",
          dentist: "Dr. Nicole Hernandezz",
          remarks:
            "Follow-up record for restoration and occlusion checking.",
          beforePhoto: null,
          afterPhoto: null,
        },
        {
          id: 104,
          date: "Feb. 05, 2026",
          procedure: "Restoration",
          tooth: "Tooth (#18) 3rd Molar",
          dentist: "Dr. Nicole Hernandezz",
          remarks:
            "Follow-up record for restoration and occlusion checking.",
          beforePhoto: null,
          afterPhoto: null,
        },
        {
          id: 105,
          date: "Feb. 05, 2026",
          procedure: "Restoration",
          tooth: "Tooth (#18) 3rd Molar",
          dentist: "Dr. Nicole Hernandezz",
          remarks:
            "Follow-up record for restoration and occlusion checking.",
          beforePhoto: null,
          afterPhoto: null,
        },
        {
          id: 106,
          date: "Feb. 05, 2026",
          procedure: "Restoration",
          tooth: "Tooth (#18) 3rd Molar",
          dentist: "Dr. Nicole Hernandezz",
          remarks:
            "Follow-up record for restoration and occlusion checking.",
          beforePhoto: null,
          afterPhoto: null,
        },
        {
          id: 107,
          date: "Feb. 05, 2026",
          procedure: "Restoration",
          tooth: "Tooth (#18) 3rd Molar",
          dentist: "Dr. Nicole Hernandezz",
          remarks:
            "Follow-up record for restoration and occlusion checking.",
          beforePhoto: null,
          afterPhoto: null,
        },
        {
          id: 108,
          date: "Feb. 05, 2026",
          procedure: "Restoration",
          tooth: "Tooth (#18) 3rd Molar",
          dentist: "Dr. Nicole Hernandezz",
          remarks:
            "Follow-up record for restoration and occlusion checking.",
          beforePhoto: null,
          afterPhoto: null,
        },
        {
          id: 109,
          date: "Feb. 05, 2026",
          procedure: "Restoration",
          tooth: "Tooth (#18) 3rd Molar",
          dentist: "Dr. Nicole Hernandezz",
          remarks:
            "Follow-up record for restoration and occlusion checking.",
          beforePhoto: null,
          afterPhoto: null,
        },
        {
          id: 110,
          date: "Feb. 05, 2026",
          procedure: "Restoration",
          tooth: "Tooth (#18) 3rd Molar",
          dentist: "Dr. Nicole Hernandezz",
          remarks:
            "Patient presented with cavity on the 3rd molar. Restoration was completed successfully.",
          beforePhoto: null,
          afterPhoto: null,
        },
        {
          id: 111,
          date: "Feb. 05, 2026",
          procedure: "Restoration",
          tooth: "Tooth (#18) 3rd Molar",
          dentist: "Dr. Nicole Hernandezz",
          remarks:
            "Follow-up record for restoration and occlusion checking.",
          beforePhoto: null,
          afterPhoto: null,
        },
        {
          id: 112,
          date: "Feb. 05, 2026",
          procedure: "Restoration",
          tooth: "Tooth (#18) 3rd Molar",
          dentist: "Dr. Nicole Hernandezz",
          remarks:
            "Follow-up record for restoration and occlusion checking.",
          beforePhoto: null,
          afterPhoto: null,
        },
        {
          id: 113,
          date: "Feb. 05, 2026",
          procedure: "Restoration",
          tooth: "Tooth (#18) 3rd Molar",
          dentist: "Dr. Nicole Hernandezz",
          remarks:
            "Follow-up record for restoration and occlusion checking.",
          beforePhoto: null,
          afterPhoto: null,
        },
        {
          id: 114,
          date: "Feb. 05, 2026",
          procedure: "Restoration",
          tooth: "Tooth (#18) 3rd Molar",
          dentist: "Dr. Nicole Hernandezz",
          remarks:
            "Follow-up record for restoration and occlusion checking.",
          beforePhoto: null,
          afterPhoto: null,
        },
        {
          id: 115,
          date: "Feb. 05, 2026",
          procedure: "Restoration",
          tooth: "Tooth (#18) 3rd Molar",
          dentist: "Dr. Nicole Hernandezz",
          remarks:
            "Follow-up record for restoration and occlusion checking.",
          beforePhoto: null,
          afterPhoto: null,
        },
        {
          id: 116,
          date: "Feb. 05, 2026",
          procedure: "Restoration",
          tooth: "Tooth (#18) 3rd Molar",
          dentist: "Dr. Nicole Hernandezz",
          remarks:
            "Follow-up record for restoration and occlusion checking.",
          beforePhoto: null,
          afterPhoto: null,
        },
        {
          id: 117,
          date: "Feb. 05, 2026",
          procedure: "Restoration",
          tooth: "Tooth (#18) 3rd Molar",
          dentist: "Dr. Nicole Hernandezz",
          remarks:
            "Follow-up record for restoration and occlusion checking.",
          beforePhoto: null,
          afterPhoto: null,
        },
        {
          id: 118,
          date: "Feb. 05, 2026",
          procedure: "Restoration",
          tooth: "Tooth (#18) 3rd Molar",
          dentist: "Dr. Nicole Hernandezz",
          remarks:
            "Follow-up record for restoration and occlusion checking.",
          beforePhoto: null,
          afterPhoto: null,
        },
      ],
    },
    {
      id: 2,
      name: "John Cruz",
      gender: "Male",
      age: 31,
      phone: "09987654321",
      branch: "Imus Branch",
      dateOfVisit: "Feb. 03, 2026",
      currentDentalRecordLabel: "Current Dental Record",
      preAssessment: null,
      procedures: [
        {
          id: 201,
          date: "Feb. 03, 2026",
          procedure: "Tooth Extraction",
          tooth: "Tooth (#28) Premolar",
          dentist: "Dr. Edward Crizzie Amparo",
          remarks:
            "Extraction completed. Patient advised on post-extraction care.",
          beforePhoto: null,
          afterPhoto: null,
        },
      ],
    },
    {
      id: 3,
      name: "John Cruz",
      gender: "Male",
      age: 31,
      phone: "09987654321",
      branch: "Imus Branch",
      dateOfVisit: "Feb. 03, 2026",
      currentDentalRecordLabel: "Current Dental Record",
      preAssessment: null,
      procedures: [
        {
          id: 201,
          date: "Feb. 03, 2026",
          procedure: "Tooth Extraction",
          tooth: "Tooth (#28) Premolar",
          dentist: "Dr. Edward Crizzie Amparo",
          remarks:
            "Extraction completed. Patient advised on post-extraction care.",
          beforePhoto: null,
          afterPhoto: null,
        },
      ],
    },
    {
      id: 4,
      name: "John Cruz",
      gender: "Male",
      age: 31,
      phone: "09987654321",
      branch: "Imus Branch",
      dateOfVisit: "Feb. 03, 2026",
      currentDentalRecordLabel: "Current Dental Record",
      preAssessment: null,
      procedures: [
        {
          id: 201,
          date: "Feb. 03, 2026",
          procedure: "Tooth Extraction",
          tooth: "Tooth (#28) Premolar",
          dentist: "Dr. Edward Crizzie Amparo",
          remarks:
            "Extraction completed. Patient advised on post-extraction care.",
          beforePhoto: null,
          afterPhoto: null,
        },
      ],
    },
    {
      id: 5,
      name: "John Cruz",
      gender: "Male",
      age: 31,
      phone: "09987654321",
      branch: "Imus Branch",
      dateOfVisit: "Feb. 03, 2026",
      currentDentalRecordLabel: "Current Dental Record",
      preAssessment: null,
      procedures: [
        {
          id: 201,
          date: "Feb. 03, 2026",
          procedure: "Tooth Extraction",
          tooth: "Tooth (#28) Premolar",
          dentist: "Dr. Edward Crizzie Amparo",
          remarks:
            "Extraction completed. Patient advised on post-extraction care.",
          beforePhoto: null,
          afterPhoto: null,
        },
      ],
    },
    {
      id: 6,
      name: "John Cruz",
      gender: "Male",
      age: 31,
      phone: "09987654321",
      branch: "Imus Branch",
      dateOfVisit: "Feb. 03, 2026",
      currentDentalRecordLabel: "Current Dental Record",
      preAssessment: null,
      procedures: [
        {
          id: 201,
          date: "Feb. 03, 2026",
          procedure: "Tooth Extraction",
          tooth: "Tooth (#28) Premolar",
          dentist: "Dr. Edward Crizzie Amparo",
          remarks:
            "Extraction completed. Patient advised on post-extraction care.",
          beforePhoto: null,
          afterPhoto: null,
        },
      ],
    },
    {
      id: 7,
      name: "John Cruz",
      gender: "Male",
      age: 31,
      phone: "09987654321",
      branch: "Imus Branch",
      dateOfVisit: "Feb. 03, 2026",
      currentDentalRecordLabel: "Current Dental Record",
      preAssessment: null,
      procedures: [
        {
          id: 201,
          date: "Feb. 03, 2026",
          procedure: "Tooth Extraction",
          tooth: "Tooth (#28) Premolar",
          dentist: "Dr. Edward Crizzie Amparo",
          remarks:
            "Extraction completed. Patient advised on post-extraction care.",
          beforePhoto: null,
          afterPhoto: null,
        },
      ],
    },
    {
      id: 8,
      name: "John Cruz",
      gender: "Male",
      age: 31,
      phone: "09987654321",
      branch: "Imus Branch",
      dateOfVisit: "Feb. 03, 2026",
      currentDentalRecordLabel: "Current Dental Record",
      preAssessment: null,
      procedures: [
        {
          id: 201,
          date: "Feb. 03, 2026",
          procedure: "Tooth Extraction",
          tooth: "Tooth (#28) Premolar",
          dentist: "Dr. Edward Crizzie Amparo",
          remarks:
            "Extraction completed. Patient advised on post-extraction care.",
          beforePhoto: null,
          afterPhoto: null,
        },
      ],
    },
    {
      id: 9,
      name: "John Cruz",
      gender: "Male",
      age: 31,
      phone: "09987654321",
      branch: "Imus Branch",
      dateOfVisit: "Feb. 03, 2026",
      currentDentalRecordLabel: "Current Dental Record",
      preAssessment: null,
      procedures: [
        {
          id: 201,
          date: "Feb. 03, 2026",
          procedure: "Tooth Extraction",
          tooth: "Tooth (#28) Premolar",
          dentist: "Dr. Edward Crizzie Amparo",
          remarks:
            "Extraction completed. Patient advised on post-extraction care.",
          beforePhoto: null,
          afterPhoto: null,
        },
      ],
    },
    {
      id: 10,
      name: "John Cruz",
      gender: "Male",
      age: 31,
      phone: "09987654321",
      branch: "Imus Branch",
      dateOfVisit: "Feb. 03, 2026",
      currentDentalRecordLabel: "Current Dental Record",
      preAssessment: null,
      procedures: [
        {
          id: 201,
          date: "Feb. 03, 2026",
          procedure: "Tooth Extraction",
          tooth: "Tooth (#28) Premolar",
          dentist: "Dr. Edward Crizzie Amparo",
          remarks:
            "Extraction completed. Patient advised on post-extraction care.",
          beforePhoto: null,
          afterPhoto: null,
        },
      ],
    },
    {
      id: 11,
      name: "John Cruz",
      gender: "Male",
      age: 31,
      phone: "09987654321",
      branch: "Imus Branch",
      dateOfVisit: "Feb. 03, 2026",
      currentDentalRecordLabel: "Current Dental Record",
      preAssessment: null,
      procedures: [
        {
          id: 201,
          date: "Feb. 03, 2026",
          procedure: "Tooth Extraction",
          tooth: "Tooth (#28) Premolar",
          dentist: "Dr. Edward Crizzie Amparo",
          remarks:
            "Extraction completed. Patient advised on post-extraction care.",
          beforePhoto: null,
          afterPhoto: null,
        },
      ],
    },
    {
      id: 12,
      name: "John Cruz",
      gender: "Male",
      age: 31,
      phone: "09987654321",
      branch: "Imus Branch",
      dateOfVisit: "Feb. 03, 2026",
      currentDentalRecordLabel: "Current Dental Record",
      preAssessment: null,
      procedures: [
        {
          id: 201,
          date: "Feb. 03, 2026",
          procedure: "Tooth Extraction",
          tooth: "Tooth (#28) Premolar",
          dentist: "Dr. Edward Crizzie Amparo",
          remarks:
            "Extraction completed. Patient advised on post-extraction care.",
          beforePhoto: null,
          afterPhoto: null,
        },
      ],
    },
    {
      id: 13,
      name: "John Cruz",
      gender: "Male",
      age: 31,
      phone: "09987654321",
      branch: "Imus Branch",
      dateOfVisit: "Feb. 03, 2026",
      currentDentalRecordLabel: "Current Dental Record",
      preAssessment: null,
      procedures: [
        {
          id: 201,
          date: "Feb. 03, 2026",
          procedure: "Tooth Extraction",
          tooth: "Tooth (#28) Premolar",
          dentist: "Dr. Edward Crizzie Amparo",
          remarks:
            "Extraction completed. Patient advised on post-extraction care.",
          beforePhoto: null,
          afterPhoto: null,
        },
      ],
    },
  ];

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const matchesSearch =
        patient.name.toLowerCase().includes(search.toLowerCase()) ||
        patient.phone.includes(search);

      const matchesBranch =
        selectedBranch === "All Branch" || patient.branch === selectedBranch;

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

  const handleSaveProcedure = (savedData) => {
    console.log("Saved procedure:", savedData);
    setProcedureModalOpen(false);
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
          profileImage="/src/assets/profile_sample.jpg"
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
                <span className="patient-history-search-icon">⌕</span>
              </div>

              <select
                className="patient-history-branch-filter"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <option>All Branch</option>
                <option>Dasmariñas Branch</option>
                <option>Bacoor Branch</option>
                <option>General Trias Branch</option>
              </select>
            </div>

            <div className="patient-history-table-wrap">
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
        <div
          className="history-modal-overlay"
          onClick={() => setHistoryModalOpen(false)}
        >
          <div
            className="history-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="history-modal-header">
              <h2 className="history-modal-title">Patient History</h2>
              <button
                type="button"
                className="history-modal-close"
                onClick={() => setHistoryModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="history-modal-body">
              <div className="history-modal-left">
                <div className="history-modal-image-wrap">
                  <img
                    src={toothModel}
                    alt="Dental Record"
                    className="history-modal-image"
                  />
                </div>
                <p className="history-modal-record-label">
                  {selectedPatient.currentDentalRecordLabel}
                </p>
              </div>

              <div className="history-modal-right">
                <h3 className="history-timeline-title">Procedure Timeline</h3>

                <div className="history-timeline-list">
                  {selectedPatient.procedures?.length > 0 ? (
                    selectedPatient.procedures.map((procedure) => (
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
                    <div className="history-timeline-empty">
                      No procedure history found.
                    </div>
                  )}
                </div>

                <div className="history-modal-actions">
                  <button
                    type="button"
                    className="history-close-btn"
                    onClick={() => setHistoryModalOpen(false)}
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    className="history-add-btn"
                    onClick={handleOpenProcedureModal}
                  >
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
                ✕
              </button>
            </div>

            <div className="history-detail-content">
              <div className="history-detail-section">
                <h3 className="history-detail-section-title">
                  Pre-Assessment
                </h3>
                <div className="history-detail-empty-box">
                  No pre-assessment done for this patient.
                </div>
              </div>

              <div className="history-detail-section">
                <h3 className="history-detail-section-title">
                  Procedure Details
                </h3>

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
          selectedProcedure?.tooth ||
          selectedPatient?.preAssessment?.tooth ||
          "Not specified"
        }
      />
    </div>
  );
}