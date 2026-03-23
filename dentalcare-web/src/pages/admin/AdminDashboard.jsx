import { useState } from "react";
import AdminSidebar from "../../components/admin/layout/AdminSidebar";
import AdminTopbar from "../../components/admin/layout/AdminTopbar";
import AdminSummaryCard from "../../components/admin/dashboard/AdminSummaryCard";
import "../../styles/admin/dashboard/admin-dashboard.css";
import "../../styles/admin/dashboard/admin-layout.css";
import "../../styles/admin/dashboard/admin-summary-card.css";
import "../../styles/admin/layout/admin-sidebar.css";
import "../../styles/admin/layout/admin-topbar.css";
import "../../styles/admin/notifications/admin-notification-popup.css";
import "../../styles/admin/shared/admin-responsive.css";

export default function AdminDashboard() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

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

  const attendingDentists = [
    {
      id: 1,
      name: "Dr. Shin Tamura",
      status: "On-Duty",
      patients: "3 Patients",
      statusClass: "green",
    },
    {
      id: 2,
      name: "Dr. Angela Cruz",
      status: "Tomorrow",
      patients: "2 Patients",
      statusClass: "yellow",
    },
    {
      id: 3,
      name: "Dr. Shin Tamura",
      status: "On-Duty",
      patients: "3 Patients",
      statusClass: "green",
    },
    {
      id: 4,
      name: "Dr. Angela Cruz",
      status: "Tomorrow",
      patients: "2 Patients",
      statusClass: "yellow",
    },
  ];

  const topTreatments = [
    { label: "Restoration", value: "45%" },
    { label: "Root Canal", value: "22%" },
    { label: "Cleaning", value: "18%" },
    { label: "Consultation", value: "15%" },
  ];

  const recentActivities = [
    {
      id: 1,
      title: "Patient checked in",
      description: "Sarah Kim arrived for Root Canal Treatment",
      time: "5 mins ago",
    },
    {
      id: 2,
      title: "Treatment completed",
      description: "Cleaning procedure finished by Dr. Shin Tamura",
      time: "18 mins ago",
    },
    {
      id: 3,
      title: "New booking confirmed",
      description: "2:00 PM consultation appointment added",
      time: "32 mins ago",
    },
  ];

  const monthlyAppointments = [
    { month: "Jan", scheduled: 5, walkin: 0 },
    { month: "Feb", scheduled: 8, walkin: 8 },
    { month: "Mar", scheduled: 15, walkin: 10 },
    { month: "Apr", scheduled: 18, walkin: 14 },
    { month: "May", scheduled: 22, walkin: 21 },
    { month: "Jun", scheduled: 19, walkin: 23 },
    { month: "Jul", scheduled: 15, walkin: 13 },
    { month: "Aug", scheduled: 19, walkin: 16 },
    { month: "Sep", scheduled: 20, walkin: 19 },
    { month: "Oct", scheduled: 19, walkin: 25 },
    { month: "Nov", scheduled: 16, walkin: 22 },
    { month: "Dec", scheduled: 18, walkin: 0 },
  ];

  const maxChartValue = Math.max(
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
                <div className="admin-live-queue-number">#2</div>
                <p className="admin-live-queue-status">In-Treatment</p>

                <div className="admin-live-queue-extra">
                  <div className="admin-live-queue-extra-item">
                    <span className="admin-live-queue-extra-label">
                      Next Patient
                    </span>
                    <span className="admin-live-queue-extra-value">
                      Sarah Kim
                    </span>
                  </div>

                  <div className="admin-live-queue-extra-item">
                    <span className="admin-live-queue-extra-label">
                      Treatment / Procedure
                    </span>
                    <span className="admin-live-queue-extra-value">
                      Root Canal Treatment
                    </span>
                  </div>

                  <div className="admin-live-queue-extra-item">
                    <span className="admin-live-queue-extra-label">
                      Assigned Dentist
                    </span>
                    <span className="admin-live-queue-extra-value">
                      Dr. Shin Tamura
                    </span>
                  </div>
                </div>

                <div className="admin-live-queue-progress">
                  <div className="admin-live-queue-progress-fill"></div>
                </div>

                <p className="admin-live-queue-wait">
                  Estimated wait for the next patient: <strong>25 minutes</strong>
                </p>
              </div>
            </div>

            <div className="admin-left-bottom-grid">
              <div className="admin-mini-stat-card admin-patient-card">
                <p className="admin-mini-stat-title">Next Patient Details</p>

                <div className="admin-patient-content">
                  <div className="admin-patient-top">
                    <h4 className="admin-patient-name">Sarah Kim</h4>
                    <p className="admin-patient-treatment">
                      Root Canal Treatment
                    </p>
                    <p className="admin-patient-schedule">
                      9:30 AM - January 28, 2026
                    </p>
                  </div>

                  <div className="admin-patient-bottom">
                    <span className="admin-assigned-label">
                      Assigned Dentist
                    </span>
                    <span className="admin-assigned-value">
                      Dr. Shin Tamura
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
                value="5"
                variant="pink"
              />
              <AdminSummaryCard
                title="Queue"
                subtitle="+12% today"
                value="5"
                variant="rose"
              />
            </div>

            <div className="admin-kpi-grid">
              <div className="admin-kpi-card">
                <p className="admin-kpi-title">Confirmed Today</p>
                <h3 className="admin-kpi-value">12</h3>
                <span className="admin-kpi-subtext">
                  Scheduled patients for today
                </span>
              </div>

              <div className="admin-kpi-card">
                <p className="admin-kpi-title">Walk-In Patients</p>
                <h3 className="admin-kpi-value">04</h3>
                <span className="admin-kpi-subtext">
                  Added to today’s queue
                </span>
              </div>

              <div className="admin-kpi-card">
                <p className="admin-kpi-title">Available Dentists</p>
                <h3 className="admin-kpi-value">02</h3>
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
                <div className="admin-treatments-chart"></div>

                <div className="admin-treatments-legend">
                  {topTreatments.map((item, index) => (
                    <div key={item.label} className="admin-treatment-item">
                      <div className="admin-treatment-left">
                        <span
                          className={`admin-treatment-dot dot-${index + 1}`}
                        ></span>
                        <span>{item.label}</span>
                      </div>
                      <span>{item.value}</span>
                    </div>
                  ))}
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