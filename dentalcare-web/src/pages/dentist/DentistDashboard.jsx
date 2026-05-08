import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/dentist/layout/Sidebar";
import Topbar from "../../components/dentist/layout/Topbar";
import SummaryCard from "../../components/dentist/dashboard/SummaryCard";
import CalendarCard from "../../components/dentist/dashboard/CalendarCard";
import PatientCard from "../../components/dentist/patients/PatientCard";
import PreAssessmentModal from "../../components/dentist/patients/PreAssessmentModal";
import ProcedureModal from "../../components/dentist/patients/ProcedureModal";
import profileImage from "../../assets/profile_sample.jpg";
import {
  createDentistProcedure,
  getDentistDashboardSnapshot,
  getDentistPatientHistory,
} from "../../services/dentistService";
import "../../styles/dentist/dashboard/dashboard.css";
import "../../styles/dentist/dashboard/layout.css";
import "../../styles/dentist/patients/patient-card.css";
import "../../styles/dentist/dashboard/summary-card.css";
import "../../styles/dentist/dashboard/calendar.css";
import "../../styles/dentist/dashboard/right-panel.css";
import "../../styles/dentist/patients/preassessment-modal.css";
import "../../styles/dentist/shared/responsive.css";
import "../../styles/admin/layout/admin-topbar.css";
import "../../styles/dentist/layout/topbar.css";
import "../../styles/dentist/layout/sidebar.css";
import "../../styles/dentist/patients/procedure-modal.css";
import "../../styles/dentist/notifications/notification-popup.css";

const normalizeDate = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const parseDateValue = (value) => {
  if (!value) return null;

  // Treat YYYY-MM-DD as a local calendar date (not UTC) to avoid off-by-one filtering.
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const withinSelectedRange = (appointmentDate, selectedDateRange) => {
  if (!appointmentDate) return true;
  const parsedAppointmentDate = parseDateValue(appointmentDate);
  if (!parsedAppointmentDate) return true;
  const date = normalizeDate(parsedAppointmentDate);

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
  const [isProcedureSaving, setIsProcedureSaving] = useState(false);
  const [procedureTarget, setProcedureTarget] = useState(null);
  const [procedurePatientContext, setProcedurePatientContext] = useState(null);
  const [showSaveToast, setShowSaveToast] = useState(false);

  const [dentistName, setDentistName] = useState("Dentist");
  const [branches, setBranches] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [patients, setPatients] = useState([]);
  const [quickStats, setQuickStats] = useState([]);
  const [treatmentCompletion, setTreatmentCompletion] = useState([]);
  const [weeklyFlow, setWeeklyFlow] = useState([]);
  const [summary, setSummary] = useState({ totalClients: 0, pendingPreAssessments: 0 });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    let refreshTimer;

    const mapHistoryPatientsToDashboard = (historyPatients = []) => {
      return (historyPatients || []).map((item) => ({
        id: item.id,
        bookingId: item.procedures?.find((entry) => entry.source === "booking")?.bookingId || null,
        patientId: item.patientId || null,
        status: "Waiting",
        type: "waiting",
        name: item.name || "Unknown Patient",
        time: item.dateOfVisit || "-",
        note: item.procedures?.[0]?.procedure ? `Service: ${item.procedures[0].procedure}` : "Dental appointment",
        branch: item.branch || "-",
        appointmentDate: item.rawDateOfVisit || item.dateOfVisit || null,
        preAssessment: item.preAssessment || null,
      }));
    };

    const withPatientFallback = async (payload = {}) => {
      if ((payload.patients || []).length > 0) return payload;

      const historyResult = await getDentistPatientHistory({ forceRefresh: true });
      if (!historyResult?.success) return payload;

      const historyData = historyResult.data || {};
      return {
        ...payload,
        patients: mapHistoryPatientsToDashboard(historyData.patients || []),
        branchOptions:
          (payload.branchOptions || []).length > 0
            ? payload.branchOptions
            : (historyData.branches || []),
      };
    };

    const applySnapshot = (payload = {}) => {
      setDentistName(payload.dentist?.name || "Dentist");
      setBranches(payload.branchOptions || []);
      setNotifications(payload.notifications || []);
      setPatients(payload.patients || []);
      setQuickStats(payload.quickStats || []);
      setTreatmentCompletion(payload.treatmentCompletion || []);
      setWeeklyFlow(payload.weeklyFlow || []);
      setSummary(payload.summary || { totalClients: 0, pendingPreAssessments: 0 });
    };

    const loadSnapshot = async () => {
      setError("");

      const cached = await getDentistDashboardSnapshot();
      if (!mounted) return;

      if (cached?.success) {
        applySnapshot(cached.data || {});
        setIsLoading(false);
      }

      const fresh = await getDentistDashboardSnapshot({ forceRefresh: true });
      if (!mounted) return;

      if (fresh?.success) {
        const mergedPayload = await withPatientFallback(fresh.data || {});
        if (!mounted) return;
        applySnapshot(mergedPayload);
        setError("");
      } else if (!cached?.success) {
        setError(fresh?.message || "Failed to load dentist dashboard data.");
      }

      setIsLoading(false);
    };

    loadSnapshot();

    refreshTimer = setInterval(async () => {
      const fresh = await getDentistDashboardSnapshot({ forceRefresh: true });
      if (!mounted || !fresh?.success) return;
      const payload = await withPatientFallback(fresh.data || {});
      if (!mounted) return;
      setDentistName(payload.dentist?.name || "Dentist");
      setBranches(payload.branchOptions || []);
      setNotifications(payload.notifications || []);
      setPatients(payload.patients || []);
      setQuickStats(payload.quickStats || []);
      setTreatmentCompletion(payload.treatmentCompletion || []);
      setWeeklyFlow(payload.weeklyFlow || []);
      setSummary(payload.summary || { totalClients: 0, pendingPreAssessments: 0 });
    }, 15000);

    return () => {
      mounted = false;
      if (refreshTimer) clearInterval(refreshTimer);
    };
  }, []);

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      if (selectedBranch === "All Branches") {
        return true;
      }

      const branchMatch = patient.branch === selectedBranch;
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
    setProcedurePatientContext({
      patientId: patient.patientId || null,
      bookingId: patient.bookingId || patient.id || null,
    });

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

  const handleSaveProcedure = async (payload) => {
    setIsProcedureSaving(true);

    const patientId = procedurePatientContext?.patientId;

    if (!patientId) {
      setError("Unable to save procedure: patient UUID is missing.");
      setIsProcedureSaving(false);
      return;
    }

    const result = await createDentistProcedure({
      patientId,
      bookingId: procedurePatientContext?.bookingId || null,
      tooth: payload?.tooth || null,
      procedure: payload?.service || "",
      remarks: payload?.remarks || "",
      // File upload to storage is not wired yet; keep DB fields nullable for now.
      beforeImageUrl: null,
      afterImageUrl: null,
    });

    if (!result?.success) {
      setError(result?.message || "Failed to save procedure.");
      setIsProcedureSaving(false);
      return;
    }

    // Refresh snapshot so newly saved procedure context is reflected as soon as possible.
    const fresh = await getDentistDashboardSnapshot({ forceRefresh: true });
    if (fresh?.success) {
      const payloadData = fresh.data || {};
      setDentistName(payloadData.dentist?.name || "Dentist");
      setBranches(payloadData.branchOptions || []);
      setNotifications(payloadData.notifications || []);
      setPatients(payloadData.patients || []);
      setQuickStats(payloadData.quickStats || []);
      setTreatmentCompletion(payloadData.treatmentCompletion || []);
      setWeeklyFlow(payloadData.weeklyFlow || []);
      setSummary(payloadData.summary || { totalClients: 0, pendingPreAssessments: 0 });
    }

    setError("");
    setIsModalOpen(false);
    setSelectedPreAssessment(null);
    setIsProcedureModalOpen(false);
    setProcedureTarget(null);
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 1800);
    setIsProcedureSaving(false);
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
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="main-content">
          <Topbar
            title="Dashboard"
            notifications={notifications}
            isNotificationOpen={isNotificationOpen}
            onToggleNotifications={handleToggleNotifications}
            onCloseNotifications={handleCloseNotifications}
            onMarkAllRead={handleMarkAllRead}
            profileImage={profileImage}
            onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
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
                    <div className="empty-patient-message">
                      No patients found for the selected filters.
                    </div>
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
        isSaving={isProcedureSaving}
      />
      {showSaveToast ? <div className="save-toast">Procedure saved successfully</div> : null}
    </>
  );
}
