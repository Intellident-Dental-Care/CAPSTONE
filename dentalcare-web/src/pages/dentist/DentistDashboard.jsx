import { useMemo, useState } from "react";
import Sidebar from "../../components/dentist/layout/Sidebar";
import Topbar from "../../components/dentist/layout/Topbar";
import SummaryCard from "../../components/dentist/dashboard/SummaryCard";
import CalendarCard from "../../components/dentist/dashboard/CalendarCard";
import PatientCard from "../../components/dentist/patients/PatientCard";
import PreAssessmentModal from "../../components/dentist/patients/PreAssessmentModal";
import ProcedureModal from "../../components/dentist/patients/ProcedureModal";
import "../../styles/dentist/dashboard/dashboard.css";
import "../../styles/dentist/dashboard/layout.css";
import "../../styles/dentist/patients/patient-card.css";
import "../../styles/dentist/dashboard/summary-card.css";
import "../../styles/dentist/dashboard/calendar.css";
import "../../styles/dentist/dashboard/right-panel.css";
import "../../styles/dentist/patients/preassessment-modal.css";
import "../../styles/dentist/shared/responsive.css";
import "../../styles/dentist/layout/topbar.css";
import "../../styles/dentist/layout/sidebar.css";
import "../../styles/dentist/patients/procedure-modal.css";
import "../../styles/dentist/notifications/notification-popup.css";

export default function DentistDashboard() {
  const [selectedBranch, setSelectedBranch] = useState("All Branches");
  const [selectedDateRange, setSelectedDateRange] = useState(new Date());
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const [selectedPreAssessment, setSelectedPreAssessment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isProcedureModalOpen, setIsProcedureModalOpen] = useState(false);
  const [procedureTarget, setProcedureTarget] = useState(null);

  const handleClosePreAssessment = () => {
    setSelectedPreAssessment(null);
    setIsModalOpen(false);
  };

  const handleAddProcedure = (data) => {
  setProcedureTarget(data);
  setIsProcedureModalOpen(true);
};

  const handleCloseProcedureModal = () => {
    setIsProcedureModalOpen(false);
  };

  const handleSaveProcedure = (procedureData) => {
    console.log("Saved procedure:", procedureData);

    setIsProcedureModalOpen(false);

  };

  const handleCloseNotifications = () => {
    setIsNotificationOpen(false);
  }

  const handleMarkAllRead = () => {
    setNotifications([]);
    setIsNotificationOpen(false);
  }

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
    {
      id: 4,
      title: "Pre-Assessment Completed:",
      message: "Jane Smith for Tooth Extraction",
      time: "10 mins ago",
    },
    {
      id: 5,
      title: "Pre-Assessment Completed:",
      message: "Jane Smith for Tooth Extraction",
      time: "10 mins ago",
    },
    {
      id: 6,
      title: "New Appointment Requests:",
      message: "John Doe for Consultation",
      time: "2 mins ago",
    },
  ]);


  const patients = [
    {
      id: 1,
      status: "Next Client",
      name: "Maria Rodriguez",
      time: "11:00 AM",
      note: "Pre-assessment completed",
      type: "next",
      branch: "Bacoor Cavite",
         preAssessment: {
        tooth: "3rd Molar",
        uploadedPhotos: [
          "https://example.com/photo1.jpg",
          "https://example.com/photo2.jpg",
        ],
        questions: [
          { question: "Do you feel pain?", answer: "Yes" },
          { question: "Is there swelling?", answer: "No" },
          { question: "Do you have sensitivity?", answer: "Yes" },
          { question: "Any bleeding?", answer: "Sometimes" },
          { question: "Bad breath?", answer: "Yes" },
          { question: "Pain while chewing?", answer: "Yes" },
          { question: "Pain constant?", answer: "No" },
          { question: "Visible cavity?", answer: "Yes" },
          { question: "Loose tooth?", answer: "No" },
          { question: "Taken medicine?", answer: "Pain reliever" },
        ],
        suggestedTreatment: "Tooth Extraction",
        suggestedPrice: 1500,
      }
    },
    {
      id: 2,
      status: "In Progress",
      name: "James Alvarez",
      time: "11:30 AM",
      note: "Ongoing dental consultation",
      type: "progress",
      branch: "Dasmarinas Cavite",
       preAssessment: {
        tooth: "3rd Molar",
        uploadedPhotos: [
          "https://example.com/photo1.jpg",
          "https://example.com/photo2.jpg",
        ],
        questions: [
          { question: "Do you feel pain?", answer: "Yes" },
          { question: "Is there swelling?", answer: "No" },
          { question: "Do you have sensitivity?", answer: "Yes" },
          { question: "Any bleeding?", answer: "Sometimes" },
          { question: "Bad breath?", answer: "Yes" },
          { question: "Pain while chewing?", answer: "Yes" },
          { question: "Pain constant?", answer: "No" },
          { question: "Visible cavity?", answer: "Yes" },
          { question: "Loose tooth?", answer: "No" },
          { question: "Taken medicine?", answer: "Pain reliever" },
        ],
        suggestedTreatment: "Tooth Extraction",
        suggestedPrice: 1500,
      }
    },
    {
      id: 3,
      status: "Waiting",
      name: "Sofia Reyes",
      time: "12:00 PM",
      note: "Waiting for examination",
      type: "waiting",
      branch: "General Trias Cavite",
       preAssessment: {
        tooth: "3rd Molar",
        uploadedPhotos: [
          "https://example.com/photo1.jpg",
          "https://example.com/photo2.jpg",
        ],
        questions: [
          { question: "Do you feel pain?", answer: "Yes" },
          { question: "Is there swelling?", answer: "No" },
          { question: "Do you have sensitivity?", answer: "Yes" },
          { question: "Any bleeding?", answer: "Sometimes" },
          { question: "Bad breath?", answer: "Yes" },
          { question: "Pain while chewing?", answer: "Yes" },
          { question: "Pain constant?", answer: "No" },
          { question: "Visible cavity?", answer: "Yes" },
          { question: "Loose tooth?", answer: "No" },
          { question: "Taken medicine?", answer: "Pain reliever" },
        ],
        suggestedTreatment: "Tooth Extraction",
        suggestedPrice: 1500,
      }
    },
    {
      id: 4,
      status: "Waiting",
      name: "Angela Cruz",
      time: "12:30 PM",
      note: "Waiting for vital signs",
      type: "waiting",
      branch: "Bacoor Cavite",
       preAssessment: {
        tooth: "3rd Molar",
        uploadedPhotos: [
          "https://example.com/photo1.jpg",
          "https://example.com/photo2.jpg",
        ],
        questions: [
          { question: "Do you feel pain?", answer: "Yes" },
          { question: "Is there swelling?", answer: "No" },
          { question: "Do you have sensitivity?", answer: "Yes" },
          { question: "Any bleeding?", answer: "Sometimes" },
          { question: "Bad breath?", answer: "Yes" },
          { question: "Pain while chewing?", answer: "Yes" },
          { question: "Pain constant?", answer: "No" },
          { question: "Visible cavity?", answer: "Yes" },
          { question: "Loose tooth?", answer: "No" },
          { question: "Taken medicine?", answer: "Pain reliever" },
        ],
        suggestedTreatment: "Tooth Extraction",
        suggestedPrice: 1500,
      }
    },
    {
      id: 5,
      status: "Next Client",
      name: "Patricia Gomez",
      time: "1:30 PM",
      note: "Pre-assessment completed",
      type: "next",
      branch: "General Trias Cavite",
       preAssessment: {
        tooth: "3rd Molar",
        uploadedPhotos: [
          "https://example.com/photo1.jpg",
          "https://example.com/photo2.jpg",
        ],
        questions: [
          { question: "Do you feel pain?", answer: "Yes" },
          { question: "Is there swelling?", answer: "No" },
          { question: "Do you have sensitivity?", answer: "Yes" },
          { question: "Any bleeding?", answer: "Sometimes" },
          { question: "Bad breath?", answer: "Yes" },
          { question: "Pain while chewing?", answer: "Yes" },
          { question: "Pain constant?", answer: "No" },
          { question: "Visible cavity?", answer: "Yes" },
          { question: "Loose tooth?", answer: "No" },
          { question: "Taken medicine?", answer: "Pain reliever" },
        ],
        suggestedTreatment: "Tooth Extraction",
        suggestedPrice: 1500,
      }
    },
    {
      id: 6,
      status: "In Progress",
      name: "Daniel Ramos",
      time: "1:00 PM",
      note: "Ongoing oral examination",
      type: "progress",
      branch: "Dasmarinas Cavite",
       preAssessment: {
        tooth: "3rd Molar",
        uploadedPhotos: [
          "https://example.com/photo1.jpg",
          "https://example.com/photo2.jpg",
        ],
        questions: [
          { question: "Do you feel pain?", answer: "Yes" },
          { question: "Is there swelling?", answer: "No" },
          { question: "Do you have sensitivity?", answer: "Yes" },
          { question: "Any bleeding?", answer: "Sometimes" },
          { question: "Bad breath?", answer: "Yes" },
          { question: "Pain while chewing?", answer: "Yes" },
          { question: "Pain constant?", answer: "No" },
          { question: "Visible cavity?", answer: "Yes" },
          { question: "Loose tooth?", answer: "No" },
          { question: "Taken medicine?", answer: "Pain reliever" },
        ],
        suggestedTreatment: "Tooth Extraction",
        suggestedPrice: 1500,
      }
    },
    {
      id: 7,
      status: "Waiting",
      name: "Carla Mendoza",
      time: "2:00 PM",
      note: "Awaiting consultation",
      type: "waiting",
      branch: "Bacoor Cavite",
       preAssessment: {
        tooth: "3rd Molar",
        uploadedPhotos: [
          "https://example.com/photo1.jpg",
          "https://example.com/photo2.jpg",
        ],
        questions: [
          { question: "Do you feel pain?", answer: "Yes" },
          { question: "Is there swelling?", answer: "No" },
          { question: "Do you have sensitivity?", answer: "Yes" },
          { question: "Any bleeding?", answer: "Sometimes" },
          { question: "Bad breath?", answer: "Yes" },
          { question: "Pain while chewing?", answer: "Yes" },
          { question: "Pain constant?", answer: "No" },
          { question: "Visible cavity?", answer: "Yes" },
          { question: "Loose tooth?", answer: "No" },
          { question: "Taken medicine?", answer: "Pain reliever" },
        ],
        suggestedTreatment: "Tooth Extraction",
        suggestedPrice: 1500,
      }
    },
    {
      id: 8,
      status: "Next Client",
      name: "John Perez",
      time: "2:30 PM",
      note: "Pre-assessment completed",
      type: "next",
      branch: "General Trias Cavite",
      preAssessment: {
        tooth: "3rd Molar",
        uploadedPhotos: [
          "https://example.com/photo1.jpg",
          "https://example.com/photo2.jpg",
        ],
        questions: [
          { question: "Do you feel pain?", answer: "Yes" },
          { question: "Is there swelling?", answer: "No" },
          { question: "Do you have sensitivity?", answer: "Yes" },
          { question: "Any bleeding?", answer: "Sometimes" },
          { question: "Bad breath?", answer: "Yes" },
          { question: "Pain while chewing?", answer: "Yes" },
          { question: "Pain constant?", answer: "No" },
          { question: "Visible cavity?", answer: "Yes" },
          { question: "Loose tooth?", answer: "No" },
          { question: "Taken medicine?", answer: "Pain reliever" },
        ],
        suggestedTreatment: "Tooth Extraction",
        suggestedPrice: 1500,
      }
    },
  ];

  const filteredPatients = useMemo(() => {
    if (selectedBranch === "All Branches") return patients;
    return patients.filter((patient) => patient.branch === selectedBranch);
  }, [selectedBranch]);

  const handleOpenPreAssessment = (patient) => {
    console.log("clicked patient:", patient);
    setSelectedPreAssessment(patient.preAssessment);
    setIsModalOpen(true);
  };

  const patientSectionLabel = useMemo(() => {
    const today = new Date();

    const normalize = (date) =>
      new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

    if (Array.isArray(selectedDateRange)) {
      const [start, end] = selectedDateRange;
      if (!start || !end) return "Selected Range";

      const isTodayOnly =
        normalize(start) === normalize(today) &&
        normalize(end) === normalize(today);

      if (isTodayOnly) return "Today";

      const startText = start.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
      });
      const endText = end.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
      });

      return `${startText} - ${endText}`;
    }

    if (selectedDateRange instanceof Date && !Number.isNaN(selectedDateRange)) {
      const isToday = normalize(selectedDateRange) === normalize(today);
      if (isToday) return "Today";

      return selectedDateRange.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
      });
    }

    return "Today";
  }, [selectedDateRange]);

  const quickStats = [
    { title: "Appointments Completed", value: "18", note: "Today" },
    { title: "Average Waiting Time", value: "14 min", note: "Faster today" },
    { title: "Top Branch", value: "Bacoor", note: "Most patients" },
    { title: "Top Service", value: "Cleaning", note: "Most requested" },
  ];

  const treatmentCompletion = [
    { label: "Completed", value: 78 },
    { label: "In Progress", value: 14 },
    { label: "Waiting", value: 8 },
  ];

  const weeklyFlow = [
    { day: "Mon", value: 9 },
    { day: "Tue", value: 12 },
    { day: "Wed", value: 10 },
    { day: "Thu", value: 15 },
    { day: "Fri", value: 13 },
  ];

  const maxWeeklyValue = Math.max(...weeklyFlow.map((item) => item.value));

  const handleToggleNotifications = () => {
    setIsNotificationOpen((prev) => !prev);
  }
  return (
    <>
      <div className="dentist-dashboard">
        <Sidebar />

        <main className="main-content">
          <Topbar
            title="Dashboard"
            notifications={notifications}
            isNotificationOpen={isNotificationOpen}
            onToggleNotifications={handleToggleNotifications}
            onCloseNotifications={handleCloseNotifications}
            onMarkAllRead={handleMarkAllRead}
            profileImage="/src/assets/profile_sample.jpg"
          />

          <div className="dashboard-grid">
            <section className="left-section">
              <div className="welcome-card">
                <p className="welcome-label">Dentist Overview</p>
                <h2>Welcome back, Dr. Amparo</h2>
                <p className="welcome-description">
                  Review patient flow, monitor branch queues, and manage pending
                  pre-assessments in one clean dashboard view.
                </p>
              </div>

              <div className="patients-card">
                <div className="section-title">
                  <div>
                    <h3>List of Patients</h3>
                    <p className="section-subtitle">
                      Queue and progress by branch
                    </p>
                  </div>

                  <div className="section-actions">
                    <select
                      className="branch-select"
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                    >
                      <option>All Branches</option>
                      <option>Bacoor Cavite</option>
                      <option>Dasmarinas Cavite</option>
                      <option>General Trias Cavite</option>
                    </select>

                    <span className="date-badge">{patientSectionLabel}</span>
                  </div>
                </div>

                <div className="patient-list patient-list-scroll">
                  {filteredPatients.map((patient) => (
                    <PatientCard
                      key={patient.id}
                      status={patient.status}
                      name={patient.name}
                      time={patient.time}
                      note={patient.note}
                      type={patient.type}
                      branch={patient.branch}
                      onViewDetails={() => handleOpenPreAssessment(patient)}
                    />
                  ))}
                </div>

                <div className="left-mini-stats-grid">
                  {quickStats.map((item) => (
                    <div className="mini-stat-card" key={item.title}>
                      <p className="mini-stat-title">{item.title}</p>
                      <h4>{item.value}</h4>
                      <span>{item.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <aside className="right-section">
              <div className="summary-row">
                <SummaryCard
                  title="Total Clients"
                  subtitle={patientSectionLabel}
                  value="34"
                  variant="pink"
                />
                <SummaryCard
                  title="Pending Pre-Assessments"
                  subtitle="For Review"
                  value="12"
                  variant="rose"
                />
              </div>

              <div className="calendar-wrapper">
                <CalendarCard
                  value={selectedDateRange}
                  onDateChange={setSelectedDateRange}
                />
              </div>

              <div className="right-extra-grid">
                <div className="right-info-card">
                  <div className="card-head">
                    <p className="right-info-label">Treatment Status Overview</p>
                    <span className="card-head-badge">Today</span>
                  </div>

                  <div className="donut-layout">
                    <div className="donut-chart">
                      <div className="donut-inner">
                        <strong>78%</strong>
                        <span>Completed</span>
                      </div>
                    </div>

                    <div className="donut-legend">
                      {treatmentCompletion.map((item) => (
                        <div className="legend-item" key={item.label}>
                          <div className="legend-left">
                            <span
                              className={`legend-dot ${
                                item.label === "Completed"
                                  ? "completed"
                                  : item.label === "In Progress"
                                  ? "progress"
                                  : "waiting"
                              }`}
                            ></span>
                            <span className="legend-text">{item.label}</span>
                          </div>
                          <strong>{item.value}%</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="right-info-card">
                  <div className="card-head">
                    <p className="right-info-label">Weekly Patient Flow</p>
                    <span className="card-head-badge">This Week</span>
                  </div>

                  <div className="bar-chart">
                    {weeklyFlow.map((item) => (
                      <div className="bar-item" key={item.day}>
                        <span className="bar-value">{item.value}</span>
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{
                              height: `${(item.value / maxWeeklyValue) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <p className="bar-label">{item.day}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </aside>
          </div>
        </main>
      </div>
      <PreAssessmentModal
        open={isModalOpen}
        onClose={handleClosePreAssessment}
        data={selectedPreAssessment}
        onAddProcedure={handleAddProcedure}
      />
      <ProcedureModal
        open={isProcedureModalOpen}
        onClose={handleCloseProcedureModal}
        onSave={handleSaveProcedure}
        tooth={procedureTarget?.tooth}
      />
    </>
  );
}