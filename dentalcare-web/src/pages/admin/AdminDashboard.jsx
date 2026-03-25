import { useEffect, useState } from "react";
import AdminSidebar from "../../components/admin/layout/AdminSidebar";
import AdminTopbar from "../../components/admin/layout/AdminTopbar";
import AdminSummaryCard from "../../components/admin/dashboard/AdminSummaryCard";
import { getDashboardSnapshot } from "../../services/adminService";
import "../../styles/admin/dashboard/admin-dashboard.css";
import "../../styles/admin/dashboard/admin-layout.css";
import "../../styles/admin/dashboard/admin-summary-card.css";
import "../../styles/admin/layout/admin-sidebar.css";
import "../../styles/admin/layout/admin-topbar.css";
import "../../styles/admin/notifications/admin-notification-popup.css";
import "../../styles/admin/shared/admin-responsive.css";

export default function AdminDashboard() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadSnapshot = async () => {
      const response = await getDashboardSnapshot();
      if (mounted && response?.success) {
        setSnapshot(response.data);
      }
    };

    loadSnapshot();

    return () => {
      mounted = false;
    };
  }, []);

  const currentQueue = snapshot?.liveQueue || null;
  const nextPatientFromApi = snapshot?.nextPatient || null;
  const attendingDentists = snapshot?.attendingDentists || [];
  const recentActivities = snapshot?.recentActivity || [];
  const topTreatments = (snapshot?.topTreatments || []).slice(0, 4);
  const monthlyAppointments = snapshot?.monthlyAppointments || [];

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

  const maxChartValue = Math.max(
    1,
    ...monthlyAppointments.flatMap((item) => [item.scheduled, item.walkin])
  );

  const scheduledPoints = monthlyAppointments
    .map((item, index) => {
      const x = (index / (monthlyAppointments.length - 1)) * 100;
      const y = 100 - (item.scheduled / maxChartValue) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  const walkinPoints = monthlyAppointments
    .map((item, index) => {
      const x = (index / (monthlyAppointments.length - 1)) * 100;
      const y = 100 - (item.walkin / maxChartValue) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  const pieGradient = (() => {
    if (!topTreatments.length) {
      return "conic-gradient(#f3d9e4 0% 100%)";
    }

    let cursor = 0;
    const parts = topTreatments.map((item, index) => {
      const pct = Number.parseFloat(String(item.value || "0").replace("%", "")) || 0;
      const start = cursor;
      cursor += pct;
      const end = index === topTreatments.length - 1 ? 100 : cursor;
      return `${item.color} ${start}% ${end}%`;
    });

    return `conic-gradient(${parts.join(", ")})`;
  })();

  return (
    <div className="admin-dashboard-page">
      <AdminSidebar />

      <main className="admin-main-content">
        <AdminTopbar
          title="Dashboard"
          notifications={notifications}
          isNotificationOpen={isNotificationOpen}
          onToggleNotifications={handleToggleNotifications}
          onCloseNotifications={handleCloseNotifications}
          onMarkAllRead={handleMarkAllRead}
        />

        <div className="admin-dashboard-grid">
          <section className="admin-left-section">
            <div className="admin-live-queue-card">
              <div className="admin-card-header-row">
                <h3 className="admin-live-queue-title">Live Queue</h3>
                <span className="admin-soft-badge">Active</span>
              </div>

              <div className="admin-live-queue-content">
                <div className="admin-live-queue-number">
                  {currentQueue ? `#${currentQueue.queueNumber}` : "--"}
                </div>
                <p className="admin-live-queue-status">{currentQueue?.status || "No Queue"}</p>

                <div className="admin-live-queue-extra">
                  <div className="admin-live-queue-extra-item">
                    <span className="admin-live-queue-extra-label">
                      Next Patient
                    </span>
                    <span className="admin-live-queue-extra-value">
                      {nextPatientFromApi?.patientName || "None"}
                    </span>
                  </div>

                  <div className="admin-live-queue-extra-item">
                    <span className="admin-live-queue-extra-label">
                      Treatment / Procedure
                    </span>
                    <span className="admin-live-queue-extra-value">
                      {currentQueue?.procedure || "--"}
                    </span>
                  </div>

                  <div className="admin-live-queue-extra-item">
                    <span className="admin-live-queue-extra-label">
                      Assigned Dentist
                    </span>
                    <span className="admin-live-queue-extra-value">
                      {currentQueue?.dentist || "Unassigned"}
                    </span>
                  </div>
                </div>

                <div className="admin-live-queue-progress">
                  <div className="admin-live-queue-progress-fill"></div>
                </div>

                <p className="admin-live-queue-wait">
                  Estimated wait for the next patient: <strong>{nextPatientFromApi ? "15 minutes" : "N/A"}</strong>
                </p>
              </div>
            </div>

            <div className="admin-left-bottom-grid">
              <div className="admin-mini-stat-card admin-patient-card">
                <p className="admin-mini-stat-title">Next Patient Details</p>

                <div className="admin-patient-content">
                  <div className="admin-patient-top">
                    <h4 className="admin-patient-name">{nextPatientFromApi?.patientName || "No next patient"}</h4>
                    <p className="admin-patient-treatment">
                      {nextPatientFromApi?.procedure || "--"}
                    </p>
                    <p className="admin-patient-schedule">
                      {nextPatientFromApi ? `${nextPatientFromApi.time} - ${nextPatientFromApi.date}` : "--"}
                    </p>
                  </div>

                  <div className="admin-patient-bottom">
                    <span className="admin-assigned-label">
                      Assigned Dentist
                    </span>
                    <span className="admin-assigned-value">
                      {nextPatientFromApi?.dentist || "Unassigned"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="admin-mini-stat-card admin-dentists-card">
                <p className="admin-mini-stat-title">Attending Dentists</p>

                <div className="admin-dentists-list">
                  {attendingDentists.map((dentist) => (
                    <div key={dentist.id} className="admin-dentist-item">
                      <div className="admin-dentist-meta">
                        <p className="admin-dentist-name">{dentist.name}</p>
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
                  ))}
                </div>
              </div>

              <div className="admin-mini-stat-card admin-activity-card">
                <p className="admin-mini-stat-title">Recent Activity</p>

                <div className="admin-activity-list">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="admin-activity-item">
                      <div className="admin-activity-dot"></div>

                      <div className="admin-activity-content">
                        <p className="admin-activity-title">{activity.title}</p>
                        <p className="admin-activity-description">
                          {activity.description}
                        </p>
                      </div>

                      <span className="admin-activity-time">
                        {activity.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <aside className="admin-right-section">
            <div className="admin-summary-row">
              <AdminSummaryCard
                title="Appointments"
                subtitle="+12% today"
                value={String(snapshot?.totals?.appointments || 0)}
                variant="pink"
              />
              <AdminSummaryCard
                title="Queue"
                subtitle="+12% today"
                value={String(snapshot?.totals?.waiting || 0)}
                variant="rose"
              />
            </div>

            <div className="admin-kpi-grid">
              <div className="admin-kpi-card">
                <p className="admin-kpi-title">Confirmed Today</p>
                <h3 className="admin-kpi-value">{String(snapshot?.totals?.confirmed || 0)}</h3>
                <span className="admin-kpi-subtext">
                  Scheduled patients for today
                </span>
              </div>

              <div className="admin-kpi-card">
                <p className="admin-kpi-title">Walk-In Patients</p>
                <h3 className="admin-kpi-value">{String(snapshot?.totals?.walkins || 0)}</h3>
                <span className="admin-kpi-subtext">
                  Added to today’s queue
                </span>
              </div>

              <div className="admin-kpi-card">
                <p className="admin-kpi-title">Available Dentists</p>
                <h3 className="admin-kpi-value">{String(snapshot?.totals?.availableDentists || 0)}</h3>
                <span className="admin-kpi-subtext">
                  Ready for consultations
                </span>
              </div>
            </div>

            <div className="admin-right-info-card">
              <div className="admin-card-head">
                <p className="admin-right-info-label">Top Treatments</p>
              </div>

              <div className="admin-treatments-layout">
                <div className="admin-treatments-chart" style={{ background: pieGradient }}></div>

                <div className="admin-treatments-legend">
                  {topTreatments.map((item, index) => (
                    <div key={item.label} className="admin-treatment-item">
                      <div className="admin-treatment-left">
                        <span
                          className={`admin-treatment-dot dot-${index + 1}`}
                          style={item.color ? { background: item.color } : undefined}
                        ></span>
                        <span>{item.label}</span>
                      </div>
                      <span>{item.value}</span>
                    </div>
                  ))}
                  {topTreatments.length === 0 ? <div className="admin-treatment-item">No treatment data yet</div> : null}
                </div>
              </div>
            </div>

            <div className="admin-right-info-card admin-appointments-card">
              <div className="admin-card-head admin-appointments-head">
                <p className="admin-right-info-label">Appointments</p>

                <div className="admin-chart-legend">
                  <span className="admin-chart-legend-item">
                    <span className="admin-chart-dot scheduled"></span>
                    Scheduled Appointments
                  </span>

                  <span className="admin-chart-legend-item">
                    <span className="admin-chart-dot walkin"></span>
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
                  {[0, 20, 40, 60, 80, 100].map((y) => (
                    <line
                      key={y}
                      x1="0"
                      y1={y}
                      x2="100"
                      y2={y}
                      className="admin-chart-grid-line"
                    />
                  ))}

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
                    <span key={item.month}>{item.month}</span>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}