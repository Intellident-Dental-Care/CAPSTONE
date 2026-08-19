import { useEffect, useMemo, useState } from "react";
import logo from "../../assets/logo.png";
import SuperAdminSidebar from "../../components/superadmin/layout/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/layout/SuperAdminTopbar";
import {
  getSuperAdminAdmins,
  createSuperAdminAdmin,
  updateSuperAdminAdminStatus,
} from "../../services/superAdminService";

import "../../styles/admin/layout/admin-sidebar.css";
import "../../styles/admin/layout/admin-topbar.css";
import "../../styles/admin/notifications/admin-notification-popup.css";
import "../../styles/admin/shared/admin-responsive.css";

import "../../styles/superadmin/admins/superadmin-admins.css";
import "../../styles/superadmin/shared/superadmin-responsive.css";

const BRANCHES = ["All Branches", "Dasmarinas, Cavite", "General Trias, Cavite", "Bacoor, Cavite"];
const REGISTER_BRANCHES = ["Dasmarinas, Cavite", "General Trias, Cavite", "Bacoor, Cavite"];

export default function SuperAdminAdmins() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Admin Update",
      message: "A branch admin record was updated.",
      time: "5 mins ago",
    },
  ]);

  const [admins, setAdmins] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState("All Branches");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const [form, setForm] = useState({
    email: "",
    branches: [],
  });

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: "",
    ids: [],
    title: "",
    message: "",
    payload: null,
  });

  const fetchAdmins = async () => {
    const res = await getSuperAdminAdmins();
    if (res?.success) {
      setAdmins(res.data || []);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const filteredAdmins = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return admins.filter((admin) => {
      const matchesSearch =
        !keyword ||
        (admin.email || "").toLowerCase().includes(keyword) ||
        (admin.branch || "").toLowerCase().includes(keyword) ||
        (admin.name || "").toLowerCase().includes(keyword) ||
        (admin.contactNumber || "").toLowerCase().includes(keyword) ||
        (admin.sex || "").toLowerCase().includes(keyword);

      const matchesBranch =
        branchFilter === "All Branches" || (admin.branch || "").includes(branchFilter);

      return matchesSearch && matchesBranch;
    });
  }, [admins, searchTerm, branchFilter]);

  const totalAdmins = filteredAdmins.length;
  const activeAdmins = filteredAdmins.filter((admin) => admin.status === "Active").length;
  const inactiveAdmins = filteredAdmins.filter(
    (admin) => admin.status === "Disabled" || admin.status === "Inactive"
  ).length;

  const allVisibleSelected =
    filteredAdmins.length > 0 &&
    filteredAdmins.every((admin) => selectedIds.includes(admin.id));

  const handleMarkAllRead = () => {
    setNotifications([]);
    setIsNotificationOpen(false);
  };

  const openRegisterModal = () => {
    setIsRegisterModalOpen(true);
  };

  const closeRegisterModal = () => {
    if (isSubmitting) return;
    setIsRegisterModalOpen(false);
  };

  const openRegisterConfirmModal = (e) => {
    e.preventDefault();

    if (!form.email.trim() || form.branches.length === 0) {
      alert("Please enter an email and select at least one branch.");
      return;
    }

    setConfirmModal({
      open: true,
      type: "register-admin",
      ids: [],
      title: "Register Admin Account",
      message: `Are you sure you want to register ${form.email.trim()} for ${form.branches.join(
        ", "
      )}?`,
      payload: {
        email: form.email.trim(),
        branches: form.branches,
      },
    });
  };

  const openSingleStatusModal = (admin) => {
    const isActive = admin.status === "Active";

    setConfirmModal({
      open: true,
      type: isActive ? "disable-single" : "enable-single",
      ids: [admin.id],
      title: isActive ? "Disable Admin Account" : "Enable Admin Account",
      message: isActive
        ? `Are you sure you want to disable ${admin.email}?`
        : `Are you sure you want to enable ${admin.email}?`,
      payload: null,
    });
  };

  const openBulkDisableModal = () => {
    if (selectedIds.length === 0) return;

    setConfirmModal({
      open: true,
      type: "disable-multiple",
      ids: selectedIds,
      title: "Disable Selected Accounts",
      message: `Are you sure you want to disable ${selectedIds.length} selected account(s)?`,
      payload: null,
    });
  };

  const openBulkEnableModal = () => {
    if (selectedIds.length === 0) return;

    setConfirmModal({
      open: true,
      type: "enable-multiple",
      ids: selectedIds,
      title: "Enable Selected Accounts",
      message: `Are you sure you want to enable ${selectedIds.length} selected account(s)?`,
      payload: null,
    });
  };

  const closeConfirmModal = () => {
    if (isSubmitting) return;

    setConfirmModal({
      open: false,
      type: "",
      ids: [],
      title: "",
      message: "",
      payload: null,
    });
  };

  const handleConfirmAction = async () => {
    const { type, ids, payload } = confirmModal;

    if (type === "register-admin" && payload) {
      setIsSubmitting(true);

      const res = await createSuperAdminAdmin({
        email: payload.email,
        branches: payload.branches,
        name: "New Admin",
        contactNumber: "Not Set",
      });

      setIsSubmitting(false);

      if (res?.success) {
        await fetchAdmins();
        setForm({
          email: "",
          branches: [],
        });
        setIsRegisterModalOpen(false);
      } else {
        alert(res?.message || "Failed to create admin.");
      }
    }

    if (type === "disable-single" || type === "disable-multiple") {
      setIsSubmitting(true);

      const results = await Promise.all(
        ids.map((id) => updateSuperAdminAdminStatus(id, false))
      );

      setIsSubmitting(false);

      if (results.some((result) => !result?.success)) {
        alert(
          results.find((result) => !result?.success)?.message ||
            "Failed to disable one or more admin accounts."
        );
      }

      await fetchAdmins();
      setSelectedIds([]);
    }

    if (type === "enable-single" || type === "enable-multiple") {
      setIsSubmitting(true);

      const results = await Promise.all(
        ids.map((id) => updateSuperAdminAdminStatus(id, true))
      );

      setIsSubmitting(false);

      if (results.some((result) => !result?.success)) {
        alert(
          results.find((result) => !result?.success)?.message ||
            "Failed to enable one or more admin accounts."
        );
      }

      await fetchAdmins();
      setSelectedIds([]);
    }

    closeConfirmModal();
  };

  const handleBranchChange = (branch) => {
    setForm((prev) => {
      const isSelected = prev.branches.includes(branch);

      return {
        ...prev,
        branches: isSelected
          ? prev.branches.filter((item) => item !== branch)
          : [...prev.branches, branch],
      };
    });
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredAdmins.map((admin) => admin.id);

    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
      return;
    }

    setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const handleExportPDF = () => {
    const logoUrl =
      typeof logo === "string"
        ? logo
        : new URL("../../assets/logo.png", import.meta.url).href;

    const rowsHtml =
      filteredAdmins.length > 0
        ? filteredAdmins
            .map(
              (admin, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${admin.name || "Not set yet"}</td>
                  <td>${admin.dateOfBirth || "Not set yet"}</td>
                  <td>${admin.age || "Not set yet"}</td>
                  <td>${admin.sex || "Not set yet"}</td>
                  <td>${admin.contactNumber || "Not set yet"}</td>
                  <td>${admin.email || "-"}</td>
                  <td>${admin.branch || "-"}</td>
                  <td>${admin.status || "-"}</td>
                </tr>
              `
            )
            .join("")
        : `
          <tr>
            <td colspan="9" style="text-align:center; padding:18px; color:#8a90a2;">
              No admin records found.
            </td>
          </tr>
        `;

    const printWindow = window.open("", "_blank", "width=1200,height=900");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Admin Management Report</title>
          <style>
            * {
              box-sizing: border-box;
            }

            @page {
              size: A4 landscape;
              margin: 12mm;
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

            .report-filter-note {
              margin: 6px 0 0;
              font-size: 12px;
              color: #7a7a7a;
            }

            .section {
              margin-bottom: 14px;
            }

            .summary-section {
              page-break-inside: avoid;
            }

            .table-section {
              page-break-inside: auto;
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
              grid-template-columns: repeat(3, 1fr);
              gap: 10px;
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

            .table-wrap {
              border: 1px solid #f1d7e3;
              border-radius: 12px;
              overflow: visible;
              background: #ffffff;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
            }

            thead {
              display: table-header-group;
              background: #fff5f9;
            }

            tfoot {
              display: table-footer-group;
            }

            tr {
              page-break-inside: avoid;
              break-inside: avoid;
            }

            th,
            td {
              border-bottom: 1px solid #f3dbe5;
              padding: 10px 8px;
              text-align: left;
              vertical-align: top;
              font-size: 12px;
              word-break: break-word;
            }

            th {
              color: #7b4b61;
              font-weight: 700;
            }

            tbody tr:nth-child(even) {
              background: #fffdfd;
            }

            .col-no { width: 5%; }
            .col-name { width: 14%; }
            .col-dob { width: 11%; }
            .col-age { width: 6%; }
            .col-sex { width: 7%; }
            .col-contact { width: 13%; }
            .col-email { width: 18%; }
            .col-branch { width: 16%; }
            .col-status { width: 10%; }

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

              .summary-section {
                page-break-inside: avoid;
              }

              .table-section {
                page-break-before: auto;
                page-break-inside: auto;
              }

              table {
                page-break-inside: auto;
              }

              thead {
                display: table-header-group;
              }

              tr,
              td,
              th {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="report-header">
              <img src="${logoUrl}" alt="GC Dental Care Logo" class="report-logo" />
              <div class="report-title-wrap">
                <h1 class="report-title">Admin Management Report</h1>
                <p class="report-subtitle">GC Dental Care • Powered by Intellident</p>
                <p class="report-filter-note">Branch Filter: ${branchFilter}</p>
              </div>
            </div>

            <div class="section summary-section">
              <h2 class="section-title">Totals Summary</h2>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-label">Total Admin</div>
                  <div class="stat-value">${totalAdmins}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Active Admin</div>
                  <div class="stat-value">${activeAdmins}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Inactive Admin</div>
                  <div class="stat-value">${inactiveAdmins}</div>
                </div>
              </div>
            </div>

            <div class="section table-section">
              <h2 class="section-title">Admin List</h2>
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th class="col-no">No.</th>
                      <th class="col-name">Name</th>
                      <th class="col-dob">Date of Birth</th>
                      <th class="col-age">Age</th>
                      <th class="col-sex">Sex</th>
                      <th class="col-contact">Contact Number</th>
                      <th class="col-email">Email</th>
                      <th class="col-branch">Branch</th>
                      <th class="col-status">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rowsHtml}
                  </tbody>
                </table>
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
    <div className="admin-dashboard-page">
      <SuperAdminSidebar />

      <main className="admin-main-content">
        <SuperAdminTopbar
          notifications={notifications}
          isNotificationOpen={isNotificationOpen}
          onToggleNotifications={() => setIsNotificationOpen((prev) => !prev)}
          onCloseNotifications={() => setIsNotificationOpen(false)}
          onMarkAllRead={handleMarkAllRead}
        />

        <div className="superadmin-admins-fixed-page">
          <div className="superadmin-admins-content">
            <section className="superadmin-admins-header">
              <div className="superadmin-admins-header-top">
                <div>
                  <h2 className="superadmin-admins-title">Admin Management</h2>
                  <p className="superadmin-admins-subtitle">
                    Register, assign, and manage branch admin accounts.
                  </p>
                </div>

                <div className="superadmin-admins-header-actions">
                  <select
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className="superadmin-admins-branch-filter"
                  >
                    {BRANCHES.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="superadmin-admins-header-btn"
                    onClick={openRegisterModal}
                  >
                    Register Admin
                  </button>

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
                </div>
              </div>
            </section>

            <section className="superadmin-admins-stats">
              <div className="superadmin-admin-stat-card">
                <span>Total Admin</span>
                <h3>{totalAdmins}</h3>
              </div>

              <div className="superadmin-admin-stat-card">
                <span>Active Admin</span>
                <h3>{activeAdmins}</h3>
              </div>

              <div className="superadmin-admin-stat-card">
                <span>Inactive Admin</span>
                <h3>{inactiveAdmins}</h3>
              </div>
            </section>

            <section className="superadmin-admins-list-card superadmin-admins-list-flex">
              <div className="superadmin-admins-card-head superadmin-admins-card-head-wrap">
                <div>
                  <h3>Admin List</h3>
                  <p>Only the list area scrolls when there are many records.</p>
                </div>

                <div className="superadmin-admins-top-actions">
                  <input
                    type="text"
                    placeholder="Search name, email, branch..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="superadmin-admins-search"
                  />

                  {selectedIds.length > 0 && (
                    <div className="superadmin-admins-bulk-actions">
                      <button
                        type="button"
                        onClick={openBulkEnableModal}
                        className="superadmin-admins-secondary-btn enable-selected-btn"
                      >
                        Enable Selected
                      </button>

                      <button
                        type="button"
                        onClick={openBulkDisableModal}
                        className="superadmin-admins-secondary-btn"
                      >
                        Disable Selected
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="superadmin-admins-table-scroll">
                <div className="superadmin-admins-table-wrap">
                  <table className="superadmin-admins-table">
                    <thead>
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            checked={allVisibleSelected}
                            onChange={toggleSelectAllVisible}
                          />
                        </th>
                        <th>Name</th>
                        <th>Date of Birth</th>
                        <th>Age</th>
                        <th>Sex</th>
                        <th>Contact Number</th>
                        <th>Email</th>
                        <th>Branch</th>
                        <th>Status</th>
                        <th className="superadmin-admins-action-head">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredAdmins.map((admin) => (
                        <tr key={admin.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(admin.id)}
                              onChange={() => toggleSelectOne(admin.id)}
                            />
                          </td>

                          <td className="superadmin-admins-name-cell">
                            {admin.name || (
                              <span className="superadmin-admins-empty-text">Not set yet</span>
                            )}
                          </td>

                          <td>
                            {admin.dateOfBirth || (
                              <span className="superadmin-admins-empty-text">Not set yet</span>
                            )}
                          </td>

                          <td>
                            {admin.age || (
                              <span className="superadmin-admins-empty-text">Not set yet</span>
                            )}
                          </td>

                          <td>
                            {admin.sex || (
                              <span className="superadmin-admins-empty-text">Not set yet</span>
                            )}
                          </td>

                          <td>
                            {admin.contactNumber || (
                              <span className="superadmin-admins-empty-text">Not set yet</span>
                            )}
                          </td>

                          <td className="superadmin-admins-email-cell">{admin.email}</td>
                          <td>{admin.branch}</td>

                          <td>
                            <span
                              className={`superadmin-admins-status ${
                                admin.status === "Active" ? "is-active" : "is-disabled"
                              }`}
                            >
                              {admin.status}
                            </span>
                          </td>

                          <td className="superadmin-admins-action-cell">
                            <button
                              type="button"
                              onClick={() => openSingleStatusModal(admin)}
                              className={`superadmin-admins-action-btn ${
                                admin.status === "Active" ? "disable-btn" : "enable-btn"
                              }`}
                            >
                              {admin.status === "Active" ? "Disable" : "Enable"}
                            </button>
                          </td>
                        </tr>
                      ))}

                      {filteredAdmins.length === 0 && (
                        <tr>
                          <td colSpan="10">
                            <div className="superadmin-admins-empty-state">
                              No admin records found.
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {isRegisterModalOpen && (
        <div className="superadmin-admins-modal-overlay" onClick={closeRegisterModal}>
          <div
            className="superadmin-admins-modal superadmin-admins-register-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="superadmin-admins-card-head">
              <div>
                <h3>Register Admin</h3>
                <p>Only email and branch are required for registration.</p>
              </div>
            </div>

            <form onSubmit={openRegisterConfirmModal} className="superadmin-admins-form-grid">
              <div className="superadmin-admins-field">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="admin@email.com"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="superadmin-admins-field">
                <label>
                  Branch
                  <span className="superadmin-admins-required"> *</span>
                </label>

                <div className="superadmin-admins-branch-checkboxes">
                  {REGISTER_BRANCHES.map((branch) => (
                    <label
                      key={branch}
                      className={`superadmin-admins-branch-checkbox ${
                        form.branches.includes(branch) ? "is-selected" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.branches.includes(branch)}
                        onChange={() => handleBranchChange(branch)}
                      />

                      <span className="superadmin-admins-checkbox-custom">
                        {form.branches.includes(branch) && "✓"}
                      </span>

                      <span>{branch}</span>
                    </label>
                  ))}
                </div>

                <span className="superadmin-admins-field-hint">
                  You can select multiple branches.
                </span>
              </div>

              <div className="superadmin-admins-modal-actions superadmin-admins-register-actions">
                <button
                  type="button"
                  className="superadmin-admins-modal-cancel"
                  onClick={closeRegisterModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="superadmin-admins-modal-confirm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Registering..." : "Register Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmModal.open && (
        <div className="superadmin-admins-modal-overlay" onClick={closeConfirmModal}>
          <div className="superadmin-admins-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{confirmModal.title}</h3>
            <p>{confirmModal.message}</p>

            <div className="superadmin-admins-modal-actions">
              <button
                type="button"
                className="superadmin-admins-modal-cancel"
                onClick={closeConfirmModal}
              >
                Cancel
              </button>

              <button
                type="button"
                className="superadmin-admins-modal-confirm"
                onClick={handleConfirmAction}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}