import { useEffect, useMemo, useState } from "react";
import SuperAdminSidebar from "../../components/superadmin/layout/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/layout/SuperAdminTopbar";
import { getSuperAdminDashboard } from "../../services/superAdminService";

import "../../styles/admin/layout/admin-sidebar.css";
import "../../styles/admin/layout/admin-topbar.css";
import "../../styles/admin/notifications/admin-notification-popup.css";
import "../../styles/admin/shared/admin-responsive.css";

import "../../styles/superadmin/dashboard/superadmin-dashboard.css";
import "../../styles/superadmin/shared/superadmin-responsive.css";

const fallbackAnalyticsData = [
  {
    branch: "All Branches",
    totalBranches: 0,
    totalAdmins: 0,
    totalDentists: 0,
    totalPatients: 0,
    totalAppointments: 0,
    completed: 0,
    cancelled: 0,
    walkins: 0,
    topServices: [],
    branchPerformance: [],
    monthlyAppointments: Array(12).fill({ month: "", total: 0 }),
  }
];

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function buildPolylinePoints(values, maxValue) {
  if (!values || values.length === 0 || maxValue === 0) return "0,100";
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

  const [analyticsData, setAnalyticsData] = useState(fallbackAnalyticsData);
  const [overallBranchTrends, setOverallBranchTrends] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Branch data updated",
      message: "All branch records were refreshed successfully.",
      time: "2 mins ago",
    }
  ]);

  // UPDATED: Now passes fromDate and toDate, and re-runs when they change
  useEffect(() => {
    const fetchDashboard = async () => {
      const res = await getSuperAdminDashboard(fromDate, toDate);
      if (res?.success && res.data) {
        setAnalyticsData(res.data.analyticsData);
        setOverallBranchTrends(res.data.overallBranchTrends);
        setRecentActivities(res.data.recentActivities);
      }
    };
    fetchDashboard();
  }, [fromDate, toDate]); 

  const currentAnalytics = useMemo(() => {
    return analyticsData.find((item) => item.branch === branchFilter) || analyticsData[0];
  }, [branchFilter, analyticsData]);

  const overallMaxValue = Math.max(...overallBranchTrends.flatMap((branch) => branch.values), 1);
  const appointmentMaxValue = Math.max(...currentAnalytics.monthlyAppointments.map((item) => item.total), 1);

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

                  {currentAnalytics.topServices.length === 0 && (
                    <p style={{ fontSize: 13, color: "#888", textAlign: "center", marginTop: 20 }}>
                      No service data available.
                    </p>
                  )}
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
                    {currentAnalytics.monthlyAppointments.map((item, idx) => (
                      <div key={`${item.month}-${idx}`} className="superadmin-bar-chart-item">
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
                  {currentAnalytics.totalAppointments > 0 ? Math.round((currentAnalytics.completed / currentAnalytics.totalAppointments) * 100) : 0}%
                </h3>
                <span className="superadmin-kpi-subtext">
                  Based on total appointments
                </span>
              </div>

              <div className="superadmin-kpi-card">
                <p className="superadmin-kpi-title">Cancellation Rate</p>
                <h3 className="superadmin-kpi-value">
                  {currentAnalytics.totalAppointments > 0 ? Math.round((currentAnalytics.cancelled / currentAnalytics.totalAppointments) * 100) : 0}%
                </h3>
                <span className="superadmin-kpi-subtext">
                  Based on total appointments
                </span>
              </div>

              <div className="superadmin-kpi-card">
                <p className="superadmin-kpi-title">Walk-In Share</p>
                <h3 className="superadmin-kpi-value">
                  {currentAnalytics.totalAppointments > 0 ? Math.round((currentAnalytics.walkins / currentAnalytics.totalAppointments) * 100) : 0}%
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