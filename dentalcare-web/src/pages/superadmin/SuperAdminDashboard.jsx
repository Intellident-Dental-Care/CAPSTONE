import { useMemo, useState } from "react";
import SuperAdminSidebar from "../../components/superadmin/layout/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/layout/SuperAdminTopbar";

import "../../styles/admin/layout/admin-sidebar.css";
import "../../styles/admin/layout/admin-topbar.css";
import "../../styles/admin/notifications/admin-notification-popup.css";
import "../../styles/admin/shared/admin-responsive.css";

import "../../styles/superadmin/dashboard/superadmin-dashboard.css";
import "../../styles/superadmin/shared/superadmin-responsive.css";

const analyticsData = [
  {
    branch: "All Branches",
    totalBranches: 3,
    totalAdmins: 3,
    totalDentists: 14,
    totalPatients: 320,
    totalAppointments: 180,
    completed: 129,
    cancelled: 20,
    walkins: 31,
    topServices: [
      { label: "Cleaning", value: 32 },
      { label: "Consultation", value: 24 },
      { label: "Root Canal", value: 21 },
      { label: "Extraction", value: 23 },
    ],
    branchPerformance: [
      { name: "Dasmarinas", appointments: 67, patients: 116 },
      { name: "General Trias", appointments: 53, patients: 94 },
      { name: "Bacoor", appointments: 60, patients: 110 },
    ],
    monthlyAppointments: [
      { month: "Jan", total: 15 },
      { month: "Feb", total: 22 },
      { month: "Mar", total: 30 },
      { month: "Apr", total: 28 },
      { month: "May", total: 34 },
      { month: "Jun", total: 40 },
      { month: "Jul", total: 37 },
      { month: "Aug", total: 42 },
      { month: "Sep", total: 39 },
      { month: "Oct", total: 46 },
      { month: "Nov", total: 43 },
      { month: "Dec", total: 48 },
    ],
  },
  {
    branch: "Dasmarinas",
    totalBranches: 1,
    totalAdmins: 1,
    totalDentists: 5,
    totalPatients: 116,
    totalAppointments: 67,
    completed: 48,
    cancelled: 7,
    walkins: 12,
    topServices: [
      { label: "Cleaning", value: 35 },
      { label: "Consultation", value: 20 },
      { label: "Root Canal", value: 28 },
      { label: "Extraction", value: 17 },
    ],
    branchPerformance: [{ name: "Dasmarinas", appointments: 67, patients: 116 }],
    monthlyAppointments: [
      { month: "Jan", total: 5 },
      { month: "Feb", total: 7 },
      { month: "Mar", total: 8 },
      { month: "Apr", total: 6 },
      { month: "May", total: 9 },
      { month: "Jun", total: 10 },
      { month: "Jul", total: 8 },
      { month: "Aug", total: 11 },
      { month: "Sep", total: 9 },
      { month: "Oct", total: 12 },
      { month: "Nov", total: 10 },
      { month: "Dec", total: 13 },
    ],
  },
  {
    branch: "General Trias",
    totalBranches: 1,
    totalAdmins: 1,
    totalDentists: 4,
    totalPatients: 94,
    totalAppointments: 53,
    completed: 39,
    cancelled: 5,
    walkins: 9,
    topServices: [
      { label: "Consultation", value: 30 },
      { label: "Cleaning", value: 22 },
      { label: "Braces", value: 26 },
      { label: "Extraction", value: 22 },
    ],
    branchPerformance: [{ name: "General Trias", appointments: 53, patients: 94 }],
    monthlyAppointments: [
      { month: "Jan", total: 4 },
      { month: "Feb", total: 5 },
      { month: "Mar", total: 6 },
      { month: "Apr", total: 4 },
      { month: "May", total: 7 },
      { month: "Jun", total: 8 },
      { month: "Jul", total: 6 },
      { month: "Aug", total: 7 },
      { month: "Sep", total: 8 },
      { month: "Oct", total: 9 },
      { month: "Nov", total: 8 },
      { month: "Dec", total: 10 },
    ],
  },
  {
    branch: "Bacoor",
    totalBranches: 1,
    totalAdmins: 1,
    totalDentists: 5,
    totalPatients: 110,
    totalAppointments: 60,
    completed: 42,
    cancelled: 8,
    walkins: 10,
    topServices: [
      { label: "Cleaning", value: 30 },
      { label: "Consultation", value: 26 },
      { label: "Whitening", value: 18 },
      { label: "Root Canal", value: 26 },
    ],
    branchPerformance: [{ name: "Bacoor", appointments: 60, patients: 110 }],
    monthlyAppointments: [
      { month: "Jan", total: 6 },
      { month: "Feb", total: 7 },
      { month: "Mar", total: 9 },
      { month: "Apr", total: 8 },
      { month: "May", total: 10 },
      { month: "Jun", total: 11 },
      { month: "Jul", total: 9 },
      { month: "Aug", total: 10 },
      { month: "Sep", total: 9 },
      { month: "Oct", total: 11 },
      { month: "Nov", total: 10 },
      { month: "Dec", total: 12 },
    ],
  },
];

const overallBranchTrends = [
  {
    name: "Dasmarinas",
    values: [5, 7, 8, 6, 9, 10, 8, 11, 9, 12, 10, 13],
    lineClass: "branch-line-1",
  },
  {
    name: "General Trias",
    values: [4, 5, 6, 4, 7, 8, 6, 7, 8, 9, 8, 10],
    lineClass: "branch-line-2",
  },
  {
    name: "Bacoor",
    values: [6, 7, 9, 8, 10, 11, 9, 10, 9, 11, 10, 12],
    lineClass: "branch-line-3",
  },
];

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const recentActivities = [
  {
    id: 1,
    title: "New admin account added",
    description: "A new admin was assigned to the Bacoor branch.",
    time: "5 mins ago",
  },
  {
    id: 2,
    title: "Dentist schedule updated",
    description: "Schedule changes were saved for Dr. Andrea Lopez.",
    time: "12 mins ago",
  },
  {
    id: 3,
    title: "Service list updated",
    description: "Dental Cleaning details were modified.",
    time: "25 mins ago",
  },
  {
    id: 4,
    title: "FAQ updated",
    description: "Appointment policy answer was edited.",
    time: "40 mins ago",
  },
];

function buildPolylinePoints(values, maxValue) {
  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 100 - (value / maxValue) * 100;
      return `${x},${y}`;
    })
    .join(" ");
}

export default function SuperAdminDashboard() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [branchFilter, setBranchFilter] = useState("All Branches");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Branch data updated",
      message: "All branch records were refreshed successfully.",
      time: "2 mins ago",
    },
    {
      id: 2,
      title: "Admin registered",
      message: "A new admin account was added.",
      time: "9 mins ago",
    },
    {
      id: 3,
      title: "Schedule updated",
      message: "A dentist schedule was changed.",
      time: "15 mins ago",
    },
  ]);

  const currentAnalytics = useMemo(() => {
    return analyticsData.find((item) => item.branch === branchFilter) || analyticsData[0];
  }, [branchFilter]);

  const overallMaxValue = Math.max(...overallBranchTrends.flatMap((branch) => branch.values));
  const appointmentMaxValue = Math.max(...currentAnalytics.monthlyAppointments.map((item) => item.total));

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

  return (
    <div className="admin-dashboard-page">
      <SuperAdminSidebar />

      <main className="admin-main-content">
        <SuperAdminTopbar
          title="Super Admin Dashboard"
          notifications={notifications}
          isNotificationOpen={isNotificationOpen}
          onToggleNotifications={handleToggleNotifications}
          onCloseNotifications={handleCloseNotifications}
          onMarkAllRead={handleMarkAllRead}
        />

        <div className="superadmin-dashboard-scroll">
          <div className="superadmin-dashboard-content">
            <section className="superadmin-page-header">
              <div>
                <h2 className="superadmin-page-title">System Overview</h2>
                <p className="superadmin-page-subtitle">
                  View all branches, compare results, and check overall clinic performance.
                </p>
              </div>
            </section>

            <section className="superadmin-filter-grid">
              <div className="superadmin-filter-card superadmin-filter-card-wide">
                <label className="superadmin-filter-label">Branch Filter</label>
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="superadmin-filter-input"
                >
                  {analyticsData.map((item) => (
                    <option key={item.branch} value={item.branch}>
                      {item.branch}
                    </option>
                  ))}
                </select>
              </div>

              <div className="superadmin-filter-card">
                <label className="superadmin-filter-label">From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="superadmin-filter-input"
                />
              </div>

              <div className="superadmin-filter-card">
                <label className="superadmin-filter-label">To</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="superadmin-filter-input"
                />
              </div>
            </section>

            <section className="superadmin-stats-grid">
              <div className="superadmin-stat-card">
                <p className="superadmin-stat-label">Total Branches</p>
                <h3 className="superadmin-stat-value">{currentAnalytics.totalBranches}</h3>
              </div>

              <div className="superadmin-stat-card">
                <p className="superadmin-stat-label">Total Admins</p>
                <h3 className="superadmin-stat-value">{currentAnalytics.totalAdmins}</h3>
              </div>

              <div className="superadmin-stat-card">
                <p className="superadmin-stat-label">Total Dentists</p>
                <h3 className="superadmin-stat-value">{currentAnalytics.totalDentists}</h3>
              </div>

              <div className="superadmin-stat-card">
                <p className="superadmin-stat-label">Total Patients</p>
                <h3 className="superadmin-stat-value">{currentAnalytics.totalPatients}</h3>
              </div>

              <div className="superadmin-stat-card">
                <p className="superadmin-stat-label">Appointments</p>
                <h3 className="superadmin-stat-value">{currentAnalytics.totalAppointments}</h3>
              </div>

              <div className="superadmin-stat-card">
                <p className="superadmin-stat-label">Completed</p>
                <h3 className="superadmin-stat-value">{currentAnalytics.completed}</h3>
              </div>

              <div className="superadmin-stat-card">
                <p className="superadmin-stat-label">Cancelled</p>
                <h3 className="superadmin-stat-value">{currentAnalytics.cancelled}</h3>
              </div>

              <div className="superadmin-stat-card">
                <p className="superadmin-stat-label">Walk-Ins</p>
                <h3 className="superadmin-stat-value">{currentAnalytics.walkins}</h3>
              </div>
            </section>

            <section className="superadmin-main-grid">
              <div className="superadmin-panel superadmin-panel-large">
                <div className="superadmin-panel-head">
                  <div>
                    <h3>Overall Branch Analytics</h3>
                    <p>Monthly comparison of all three branches</p>
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
                        points={buildPolylinePoints(branch.values, overallMaxValue)}
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
                      <div key={branch.name} className="superadmin-branch-legend-item">
                        <span className={`superadmin-dot dot-${index + 1}`}></span>
                        <span>{branch.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="superadmin-panel">
                <div className="superadmin-panel-head">
                  <div>
                    <h3>Top Services</h3>
                    <p>Most used services</p>
                  </div>
                </div>

                <div className="superadmin-services-list">
                  {currentAnalytics.topServices.map((item, index) => (
                    <div key={item.label} className="superadmin-service-item">
                      <div className="superadmin-service-top">
                        <div className="superadmin-service-left">
                          <span className={`superadmin-dot dot-${index + 1}`}></span>
                          <span>{item.label}</span>
                        </div>
                        <strong>{item.value}%</strong>
                      </div>

                      <div className="superadmin-service-bar">
                        <div
                          className={`superadmin-service-bar-fill fill-${index + 1}`}
                          style={{ width: `${item.value}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="superadmin-bottom-grid">
              <div className="superadmin-panel">
                <div className="superadmin-panel-head">
                  <div>
                    <h3>Appointments Trend</h3>
                    <p>Monthly appointment records for the selected branch</p>
                  </div>
                </div>

                <div className="superadmin-bar-chart-card">
                  <div className="superadmin-bar-chart-area">
                    {currentAnalytics.monthlyAppointments.map((item) => (
                      <div key={item.month} className="superadmin-bar-chart-item">
                        <div className="superadmin-bar-chart-column">
                          <div
                            className="superadmin-bar-chart-fill"
                            style={{
                              height: `${(item.total / appointmentMaxValue) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <span className="superadmin-bar-chart-label">{item.month}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="superadmin-panel">
                <div className="superadmin-panel-head">
                  <div>
                    <h3>Recent Activity</h3>
                    <p>Latest system updates</p>
                  </div>
                </div>

                <div className="superadmin-activity-list">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="superadmin-activity-item">
                      <div className="superadmin-activity-dot"></div>

                      <div className="superadmin-activity-content">
                        <p className="superadmin-activity-title">{activity.title}</p>
                        <p className="superadmin-activity-description">
                          {activity.description}
                        </p>
                      </div>

                      <span className="superadmin-activity-time">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="superadmin-kpi-row">
              <div className="superadmin-kpi-card">
                <p className="superadmin-kpi-title">Completion Rate</p>
                <h3 className="superadmin-kpi-value">
                  {Math.round((currentAnalytics.completed / currentAnalytics.totalAppointments) * 100)}%
                </h3>
                <span className="superadmin-kpi-subtext">
                  Based on total appointments
                </span>
              </div>

              <div className="superadmin-kpi-card">
                <p className="superadmin-kpi-title">Cancellation Rate</p>
                <h3 className="superadmin-kpi-value">
                  {Math.round((currentAnalytics.cancelled / currentAnalytics.totalAppointments) * 100)}%
                </h3>
                <span className="superadmin-kpi-subtext">
                  Based on total appointments
                </span>
              </div>

              <div className="superadmin-kpi-card">
                <p className="superadmin-kpi-title">Walk-In Share</p>
                <h3 className="superadmin-kpi-value">
                  {Math.round((currentAnalytics.walkins / currentAnalytics.totalAppointments) * 100)}%
                </h3>
                <span className="superadmin-kpi-subtext">
                  Share of walk-in records
                </span>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}