import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/dentist/layout/Sidebar";
import Topbar from "../../components/dentist/layout/Topbar";
import SummaryCard from "../../components/dentist/dashboard/SummaryCard";
import CalendarCard from "../../components/dentist/dashboard/CalendarCard";
import PatientCard from "../../components/dentist/patients/PatientCard";
import PreAssessmentModal from "../../components/dentist/patients/PreAssessmentModal";
import ProcedureModal from "../../components/dentist/patients/ProcedureModal";
import profileImage from "../../assets/profile_sample.jpg";
import { getDentistDashboardSnapshot } from "../../services/dentistService";
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

const normalizeDate = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const withinSelectedRange = (appointmentDate, selectedDateRange) => {
  if (!appointmentDate) return true;
  const date = normalizeDate(new Date(appointmentDate));

  if (Array.isArray(selectedDateRange)) {
    const [start, end] = selectedDateRange;
    if (!start || !end) return true;
    const normalizedStart = normalizeDate(new Date(start));
    const normalizedEnd = normalizeDate(new Date(end));
    return date >= normalizedStart && date <= normalizedEnd;
  }

  if (selectedDateRange instanceof Date && !Number.isNaN(selectedDateRange.getTime())) {
    return date.getTime() === normalizeDate(selectedDateRange).getTime();
  }

  return true;
};

export default function DentistDashboard() {
  const [selectedBranch, setSelectedBranch] = useState("All Branches");
  const [selectedDateRange, setSelectedDateRange] = useState(new Date());
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedPreAssessment, setSelectedPreAssessment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcedureModalOpen, setIsProcedureModalOpen] = useState(false);
  const [procedureTarget, setProcedureTarget] = useState(null);

  const [dentistName, setDentistName] = useState("Dentist");
  const [branches, setBranches] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [patients, setPatients] = useState([]);
  const [quickStats, setQuickStats] = useState([]);
  const [treatmentCompletion, setTreatmentCompletion] = useState([]);
  const [weeklyFlow, setWeeklyFlow] = useState([]);
  const [summary, setSummary] = useState({ totalClients: 0, pendingPreAssessments: 0 });

  useEffect(() => {
    let mounted = true;

    const loadSnapshot = async () => {
      setIsLoading(true);
      setError("");

      const result = await getDentistDashboardSnapshot({ forceRefresh: true });
      if (!mounted) return;

      if (!result?.success) {
        setError(result?.message || "Failed to load dentist dashboard data.");
        setIsLoading(false);
        return;
      }

      const payload = result.data || {};
      setDentistName(payload.dentist?.name || "Dentist");
      setBranches(payload.branchOptions || []);
      setNotifications(payload.notifications || []);
      setPatients(payload.patients || []);
      setQuickStats(payload.quickStats || []);
      setTreatmentCompletion(payload.treatmentCompletion || []);
      setWeeklyFlow(payload.weeklyFlow || []);
      setSummary(payload.summary || { totalClients: 0, pendingPreAssessments: 0 });
      setIsLoading(false);
    };

    loadSnapshot();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const branchMatch =
        selectedBranch === "All Branches" || patient.branch === selectedBranch;
      const dateMatch = withinSelectedRange(patient.appointmentDate, selectedDateRange);
      return branchMatch && dateMatch;
    });
  }, [patients, selectedBranch, selectedDateRange]);

  const patientSectionLabel = useMemo(() => {
    const today = normalizeDate(new Date());

    if (Array.isArray(selectedDateRange)) {
      const [start, end] = selectedDateRange;
      if (!start || !end) return "Selected Range";

      const normalizedStart = normalizeDate(new Date(start));
      const normalizedEnd = normalizeDate(new Date(end));
      if (normalizedStart.getTime() === today.getTime() && normalizedEnd.getTime() === today.getTime()) {
        return "Today";
      }

      const startText = normalizedStart.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
      const endText = normalizedEnd.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
      return `${startText} - ${endText}`;
    }

    if (selectedDateRange instanceof Date && !Number.isNaN(selectedDateRange.getTime())) {
      const normalized = normalizeDate(selectedDateRange);
      if (normalized.getTime() === today.getTime()) return "Today";
      return normalized.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
    }

    return "Today";
  }, [selectedDateRange]);

  const maxWeeklyValue = Math.max(1, ...weeklyFlow.map((item) => item.value || 0));

  const handleOpenPreAssessment = (patient) => {
    setSelectedPreAssessment(patient.preAssessment || {
      tooth: "Not specified",
      uploadedPhotos: [],
      questions: [],
      suggestedTreatment: "Dental Appointment",
      suggestedPrice: "-",
    });
    setIsModalOpen(true);
  };

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

  const handleSaveProcedure = () => {
    setIsProcedureModalOpen(false);
  };

  const handleCloseNotifications = () => {
    setIsNotificationOpen(false);
  };

  const handleMarkAllRead = () => {
    setNotifications([]);
    setIsNotificationOpen(false);
  };

  const handleToggleNotifications = () => {
    setIsNotificationOpen((prev) => !prev);
  };

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
            profileImage={profileImage}
          />

          <div className="dashboard-grid">
            <section className="left-section">
              <div className="welcome-card">
                <p className="welcome-label">Dentist Overview</p>
                <h2>Welcome back, {dentistName}</h2>
                <p className="welcome-description">
                  Review patient flow, monitor branch queues, and manage pending pre-assessments in one clean dashboard view.
                </p>
              </div>

              <div className="patients-card">
                <div className="section-title">
                  <div>
                    <h3>List of Patients</h3>
                    <p className="section-subtitle">Queue and progress by branch</p>
                  </div>

                  <div className="section-actions">
                    <select
                      className="branch-select"
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                    >
                      <option>All Branches</option>
                      {branches.map((branch) => (
                        <option key={branch} value={branch}>
                          {branch}
                        </option>
                      ))}
                    </select>

                    <span className="date-badge">{patientSectionLabel}</span>
                  </div>
                </div>

                {error ? <div className="section-subtitle">{error}</div> : null}

                <div className="patient-list patient-list-scroll">
                  {!isLoading && filteredPatients.length === 0 ? (
                    <div className="section-subtitle">No patients found for the selected filters.</div>
                  ) : null}

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
                  value={String(summary.totalClients || 0)}
                  variant="pink"
                />
                <SummaryCard
                  title="Pending Pre-Assessments"
                  subtitle="For Review"
                  value={String(summary.pendingPreAssessments || 0)}
                  variant="rose"
                />
              </div>

              <div className="calendar-wrapper">
                <CalendarCard value={selectedDateRange} onDateChange={setSelectedDateRange} />
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
                        <strong>{treatmentCompletion[0]?.value || 0}%</strong>
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
                            style={{ height: `${(item.value / maxWeeklyValue) * 100}%` }}
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
