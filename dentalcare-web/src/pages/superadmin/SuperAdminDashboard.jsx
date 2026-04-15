import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import logo from "../../assets/logo.png";
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
    monthlyAppointments: Array.from({ length: 12 }, (_, index) => ({
      month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][index],
      total: 0,
    })),
  },
];

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function buildPolylinePoints(values, maxValue) {
  if (!values || values.length === 0 || maxValue === 0) return "0,100";

  return values
    .map((value, index) => {
      const x = values.length > 1 ? (index / (values.length - 1)) * 100 : 0;
      const y = 100 - (value / maxValue) * 100;
      return `${x},${y}`;
    })
    .join(" ");
}

export default function SuperAdminDashboard() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    },
  ]);

  const overallAnalyticsRef = useRef(null);
  const topServicesRef = useRef(null);
  const appointmentTrendsRef = useRef(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      const res = await getSuperAdminDashboard(fromDate, toDate);
      if (res?.success && res.data) {
        setAnalyticsData(res.data.analyticsData || fallbackAnalyticsData);
        setOverallBranchTrends(res.data.overallBranchTrends || []);
        setRecentActivities(res.data.recentActivities || []);
      }
    };

    fetchDashboard();
  }, [fromDate, toDate]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const currentAnalytics = useMemo(() => {
    return analyticsData.find((item) => item.branch === branchFilter) || analyticsData[0];
  }, [branchFilter, analyticsData]);

  const overallMaxValue = Math.max(
    ...overallBranchTrends.flatMap((branch) => branch.values || []),
    1
  );

  const appointmentMaxValue = Math.max(
    ...(currentAnalytics?.monthlyAppointments || []).map((item) => item.total || 0),
    1
  );

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

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleExportPDF = async () => {
    const selectedBranch = currentAnalytics?.branch || branchFilter || "All Branches";

    const dateRangeLabel =
      fromDate && toDate
        ? `${fromDate} to ${toDate}`
        : fromDate
        ? `From ${fromDate}`
        : toDate
        ? `Until ${toDate}`
        : "All Dates";

    const completionRate =
      currentAnalytics.totalAppointments > 0
        ? Math.round((currentAnalytics.completed / currentAnalytics.totalAppointments) * 100)
        : 0;

    const cancellationRate =
      currentAnalytics.totalAppointments > 0
        ? Math.round((currentAnalytics.cancelled / currentAnalytics.totalAppointments) * 100)
        : 0;

    const walkInShare =
      currentAnalytics.totalAppointments > 0
        ? Math.round((currentAnalytics.walkins / currentAnalytics.totalAppointments) * 100)
        : 0;

    const captureSection = async (element) => {
      if (!element) return "";

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      return canvas.toDataURL("image/png");
    };

    const [overallChartImage, topServicesImage, appointmentTrendImage] = await Promise.all([
      captureSection(overallAnalyticsRef.current),
      captureSection(topServicesRef.current),
      captureSection(appointmentTrendsRef.current),
    ]);

    const logoUrl = typeof logo === "string" ? logo : new URL("../../assets/logo.png", import.meta.url).href;

    const printWindow = window.open("", "_blank", "width=1200,height=900");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Super Admin Dashboard Report</title>
          <style>
            * {
              box-sizing: border-box;
            }

            @page {
              size: A4 portrait;
              margin: 14mm;
            }

            body {
              margin: 0;
              padding: 0;
              font-family: Arial, Helvetica, sans-serif;
              background: #ffffff;
              color: #222;
              font-size: 13px;
              line-height: 1.35;
            }

            .report-container {
              width: 100%;
              max-width: 100%;
              margin: 0 auto;
            }

            .report-header {
              display: flex;
              align-items: center;
              gap: 14px;
              border-bottom: 2px solid #ef4b84;
              padding-bottom: 10px;
              margin-bottom: 14px;
            }

            .report-logo {
              width: 54px;
              height: 54px;
              object-fit: contain;
              flex-shrink: 0;
            }

            .report-title-wrap {
              flex: 1;
              min-width: 0;
            }

            .report-title {
              margin: 0;
              font-size: 24px;
              font-weight: 800;
              color: #a52d63;
              line-height: 1.1;
            }

            .report-subtitle {
              margin: 4px 0 0;
              font-size: 13px;
              color: #666;
            }

            .report-meta {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 14px;
            }

            .meta-card {
              border: 1px solid #f1d7e3;
              border-radius: 10px;
              padding: 10px 12px;
              background: #fffafb;
            }

            .meta-label {
              font-size: 11px;
              color: #888;
              margin-bottom: 4px;
              text-transform: uppercase;
              letter-spacing: 0.4px;
            }

            .meta-value {
              font-size: 13px;
              font-weight: 700;
              color: #333;
            }

            .section {
              margin-bottom: 14px;
              page-break-inside: avoid;
            }

            .section-title {
              margin: 0 0 8px;
              font-size: 13px;
              font-weight: 800;
              color: #a52d63;
              text-transform: uppercase;
              letter-spacing: 0.4px;
            }

            .stats-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 8px;
            }

            .stat-card {
              border: 1px solid #f1d7e3;
              border-radius: 10px;
              background: #ffffff;
              padding: 10px 12px;
              min-height: 72px;
            }

            .stat-label {
              font-size: 11px;
              color: #777;
              margin-bottom: 6px;
            }

            .stat-value {
              font-size: 24px;
              font-weight: 800;
              color: #ef4b84;
              line-height: 1;
            }

            .chart-grid {
              display: grid;
              grid-template-columns: 1.55fr 1fr;
              gap: 10px;
              align-items: stretch;
            }

            .chart-card,
            .single-chart {
              border: 1px solid #f1d7e3;
              border-radius: 12px;
              background: #ffffff;
              padding: 8px;
              page-break-inside: avoid;
            }

            .chart-card img,
            .single-chart img {
              width: 100%;
              height: auto;
              display: block;
              border-radius: 8px;
            }

            .chart-card img {
              max-height: 210px;
              object-fit: contain;
            }

            .single-chart img {
              max-height: 220px;
              object-fit: contain;
            }

            .kpi-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 8px;
            }

            .kpi-card {
              border: 1px solid #f1d7e3;
              border-radius: 10px;
              padding: 10px 12px;
              background: #fffafb;
              min-height: 76px;
            }

            .kpi-title {
              font-size: 11px;
              color: #666;
              margin-bottom: 5px;
            }

            .kpi-value {
              font-size: 24px;
              font-weight: 800;
              color: #d94180;
              margin-bottom: 2px;
              line-height: 1;
            }

            .kpi-note {
              font-size: 11px;
              color: #888;
            }

            .footer-note {
              margin-top: 12px;
              font-size: 10px;
              color: #888;
              text-align: right;
            }

            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="report-header">
              <img src="${logoUrl}" alt="GC Dental Care Logo" class="report-logo" />
              <div class="report-title-wrap">
                <h1 class="report-title">Super Admin Dashboard Report</h1>
                <p class="report-subtitle">GC Dental Care • Powered by Intellident</p>
              </div>
            </div>

            <div class="report-meta">
              <div class="meta-card">
                <div class="meta-label">Selected Branch</div>
                <div class="meta-value">${selectedBranch}</div>
              </div>
              <div class="meta-card">
                <div class="meta-label">Date Range</div>
                <div class="meta-value">${dateRangeLabel}</div>
              </div>
            </div>

            <div class="section">
              <h2 class="section-title">Totals Summary</h2>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-label">Total Branches</div>
                  <div class="stat-value">${currentAnalytics.totalBranches}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Total Admins</div>
                  <div class="stat-value">${currentAnalytics.totalAdmins}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Total Dentists</div>
                  <div class="stat-value">${currentAnalytics.totalDentists}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Total Patients</div>
                  <div class="stat-value">${currentAnalytics.totalPatients}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Appointments</div>
                  <div class="stat-value">${currentAnalytics.totalAppointments}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Completed</div>
                  <div class="stat-value">${currentAnalytics.completed}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Cancelled</div>
                  <div class="stat-value">${currentAnalytics.cancelled}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Walk-Ins</div>
                  <div class="stat-value">${currentAnalytics.walkins}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <h2 class="section-title">Analytics Overview</h2>
              <div class="chart-grid">
                <div class="chart-card">
                  <img src="${overallChartImage}" alt="Overall Branch Analytics" />
                </div>
                <div class="chart-card">
                  <img src="${topServicesImage}" alt="Top Services" />
                </div>
              </div>
            </div>

            <div class="section">
              <h2 class="section-title">Appointment Trends</h2>
              <div class="single-chart">
                <img src="${appointmentTrendImage}" alt="Appointment Trends" />
              </div>
            </div>

            <div class="section">
              <h2 class="section-title">Performance Rates</h2>
              <div class="kpi-grid">
                <div class="kpi-card">
                  <div class="kpi-title">Completion Rate</div>
                  <div class="kpi-value">${completionRate}%</div>
                  <div class="kpi-note">Based on total appointments</div>
                </div>
                <div class="kpi-card">
                  <div class="kpi-title">Cancellation Rate</div>
                  <div class="kpi-value">${cancellationRate}%</div>
                  <div class="kpi-note">Based on total appointments</div>
                </div>
                <div class="kpi-card">
                  <div class="kpi-title">Walk-In Share</div>
                  <div class="kpi-value">${walkInShare}%</div>
                  <div class="kpi-note">Share of walk-in records</div>
                </div>
              </div>
            </div>

            <div class="footer-note">
              Generated on ${new Date().toLocaleString()}
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 700);
  };

  return (
    <div className="admin-dashboard-page superadmin-mobile-layout">
      <SuperAdminSidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />

      <main className="admin-main-content">
        <SuperAdminTopbar
          notifications={notifications}
          isNotificationOpen={isNotificationOpen}
          onToggleNotifications={handleToggleNotifications}
          onCloseNotifications={handleCloseNotifications}
          onMarkAllRead={handleMarkAllRead}
          onToggleSidebar={handleToggleSidebar}
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

              <button
                type="button"
                className="superadmin-export-btn"
                onClick={handleExportPDF}
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M12 3V14"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M8.5 10.5L12 14L15.5 10.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5 16.5V18C5 19.1 5.9 20 7 20H17C18.1 20 19 19.1 19 18V16.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
                <span>Export PDF</span>
              </button>
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
              <div className="superadmin-panel superadmin-panel-large" ref={overallAnalyticsRef}>
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
                        points={buildPolylinePoints(branch.values || [], overallMaxValue)}
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

              <div className="superadmin-panel" ref={topServicesRef}>
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
              <div className="superadmin-panel" ref={appointmentTrendsRef}>
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
                        <p className="superadmin-activity-description">{activity.description}</p>
                      </div>

                      <span className="superadmin-activity-time">{activity.time}</span>
                    </div>
                  ))}

                  {recentActivities.length === 0 && (
                    <p style={{ fontSize: 13, color: "#888", textAlign: "center", marginTop: 20 }}>
                      No recent activity available.
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="superadmin-kpi-row">
              <div className="superadmin-kpi-card">
                <p className="superadmin-kpi-title">Completion Rate</p>
                <h3 className="superadmin-kpi-value">
                  {currentAnalytics.totalAppointments > 0
                    ? Math.round(
                        (currentAnalytics.completed / currentAnalytics.totalAppointments) * 100
                      )
                    : 0}
                  %
                </h3>
                <span className="superadmin-kpi-subtext">Based on total appointments</span>
              </div>

              <div className="superadmin-kpi-card">
                <p className="superadmin-kpi-title">Cancellation Rate</p>
                <h3 className="superadmin-kpi-value">
                  {currentAnalytics.totalAppointments > 0
                    ? Math.round(
                        (currentAnalytics.cancelled / currentAnalytics.totalAppointments) * 100
                      )
                    : 0}
                  %
                </h3>
                <span className="superadmin-kpi-subtext">Based on total appointments</span>
              </div>

              <div className="superadmin-kpi-card">
                <p className="superadmin-kpi-title">Walk-In Share</p>
                <h3 className="superadmin-kpi-value">
                  {currentAnalytics.totalAppointments > 0
                    ? Math.round(
                        (currentAnalytics.walkins / currentAnalytics.totalAppointments) * 100
                      )
                    : 0}
                  %
                </h3>
                <span className="superadmin-kpi-subtext">Share of walk-in records</span>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}