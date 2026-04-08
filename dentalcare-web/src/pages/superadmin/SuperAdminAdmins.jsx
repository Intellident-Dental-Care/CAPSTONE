import { useEffect, useMemo, useState } from "react";
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

// Updated branches to match database strings found in your bookings table
const BRANCHES = ["Dasmarinas, Cavite", "General Trias, Cavite", "Bacoor, Cavite"];

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    email: "",
    branch: BRANCHES[0], // Defaults to Dasmarinas, Cavite
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
      setAdmins(res.data);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const filteredAdmins = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return admins;

    return admins.filter((admin) => {
      return (
        (admin.email || "").toLowerCase().includes(keyword) ||
        (admin.branch || "").toLowerCase().includes(keyword) ||
        (admin.name || "").toLowerCase().includes(keyword) ||
        (admin.contactNumber || "").toLowerCase().includes(keyword) ||
        (admin.sex || "").toLowerCase().includes(keyword)
      );
    });
  }, [admins, searchTerm]);

  const totalAdmins = filteredAdmins.length;
  const activeAdmins = filteredAdmins.filter(
    (admin) => admin.status === "Active"
  ).length;
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

  const openRegisterModal = (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.branch.trim()) return;

    setConfirmModal({
      open: true,
      type: "register-admin",
      ids: [],
      title: "Register Admin Account",
      message: `Are you sure you want to register ${form.email.trim()} for ${form.branch}?`,
      payload: {
        email: form.email.trim(),
        branch: form.branch,
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
        branch: payload.branch,
        name: "New Admin", 
        contactNumber: "Not Set"
      });
      setIsSubmitting(false);

      if (res?.success) {
        fetchAdmins();
        setForm({ email: "", branch: BRANCHES[0] });
      } else {
        alert(res?.message || "Failed to create admin.");
      }
    }

    if (type === "disable-single" || type === "disable-multiple") {
      setIsSubmitting(true);
      const results = await Promise.all(ids.map((id) => updateSuperAdminAdminStatus(id, false)));
      setIsSubmitting(false);

      if (results.some((result) => !result?.success)) {
        alert(results.find((result) => !result?.success)?.message || "Failed to disable one or more admin accounts.");
      }

      await fetchAdmins();
      setSelectedIds([]);
    }

    if (type === "enable-single" || type === "enable-multiple") {
      setIsSubmitting(true);
      const results = await Promise.all(ids.map((id) => updateSuperAdminAdminStatus(id, true)));
      setIsSubmitting(false);

      if (results.some((result) => !result?.success)) {
        alert(results.find((result) => !result?.success)?.message || "Failed to enable one or more admin accounts.");
      }

      await fetchAdmins();
      setSelectedIds([]);
    }

    closeConfirmModal();
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      const visibleIds = filteredAdmins.map((admin) => admin.id);
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
      return;
    }
    const visibleIds = filteredAdmins.map((admin) => admin.id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  return (
    <div className="admin-dashboard-page">
      <SuperAdminSidebar />
      <main className="admin-main-content">
        <SuperAdminTopbar
          title="Admin Management"
          notifications={notifications}
          isNotificationOpen={isNotificationOpen}
          onToggleNotifications={() => setIsNotificationOpen((prev) => !prev)}
          onCloseNotifications={() => setIsNotificationOpen(false)}
          onMarkAllRead={handleMarkAllRead}
        />

        <div className="superadmin-admins-fixed-page">
          <div className="superadmin-admins-content">
            <section className="superadmin-admins-header">
              <h2 className="superadmin-admins-title">Admin Management</h2>
              <p className="superadmin-admins-subtitle">
                Register, assign, and manage branch admin accounts.
              </p>
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

            <section className="superadmin-admins-form-card">
              <div className="superadmin-admins-card-head">
                <div>
                  <h3>Register Admin</h3>
                  <p>Only email and branch are required for registration.</p>
                </div>
              </div>

              <form onSubmit={openRegisterModal} className="superadmin-admins-form-grid">
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
                  <label>Branch</label>
                  <select
                    value={form.branch}
                    onChange={(e) => setForm((prev) => ({ ...prev, branch: e.target.value }))}
                  >
                    {BRANCHES.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="superadmin-admins-form-action">
                  <button type="submit" className="superadmin-admins-primary-btn" disabled={isSubmitting}>
                    {isSubmitting ? "Registering..." : "Register Admin"}
                  </button>
                </div>
              </form>
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
                  <button
                    type="button"
                    onClick={openBulkEnableModal}
                    className="superadmin-admins-secondary-btn enable-selected-btn"
                    disabled={selectedIds.length === 0}
                  >
                    Enable Selected
                  </button>
                  <button
                    type="button"
                    onClick={openBulkDisableModal}
                    className="superadmin-admins-secondary-btn"
                    disabled={selectedIds.length === 0}
                  >
                    Disable Selected
                  </button>
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
                        <th>Action</th>
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
                            {admin.name || <span className="superadmin-admins-empty-text">Not set yet</span>}
                          </td>
                          <td>{admin.dateOfBirth || <span className="superadmin-admins-empty-text">Not set yet</span>}</td>
                          <td>{admin.age || <span className="superadmin-admins-empty-text">Not set yet</span>}</td>
                          <td>{admin.sex || <span className="superadmin-admins-empty-text">Not set yet</span>}</td>
                          <td>{admin.contactNumber || <span className="superadmin-admins-empty-text">Not set yet</span>}</td>
                          <td className="superadmin-admins-email-cell">{admin.email}</td>
                          <td>{admin.branch}</td>
                          <td>
                            <span className={`superadmin-admins-status ${admin.status === "Active" ? "is-active" : "is-disabled"}`}>
                              {admin.status}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => openSingleStatusModal(admin)}
                              className={`superadmin-admins-action-btn ${admin.status === "Active" ? "disable-btn" : "enable-btn"}`}
                            >
                              {admin.status === "Active" ? "Disable" : "Enable"}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredAdmins.length === 0 && (
                        <tr>
                          <td colSpan="10">
                            <div className="superadmin-admins-empty-state">No admin records found.</div>
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

      {confirmModal.open && (
        <div className="superadmin-admins-modal-overlay" onClick={closeConfirmModal}>
          <div className="superadmin-admins-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{confirmModal.title}</h3>
            <p>{confirmModal.message}</p>
            <div className="superadmin-admins-modal-actions">
              <button type="button" className="superadmin-admins-modal-cancel" onClick={closeConfirmModal}>Cancel</button>
              <button type="button" className="superadmin-admins-modal-confirm" onClick={handleConfirmAction} disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}