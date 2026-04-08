import { useEffect, useMemo, useState } from "react";
import SuperAdminSidebar from "../../components/superadmin/layout/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/layout/SuperAdminTopbar";
import { getSuperAdminServices, createSuperAdminService } from "../../services/superAdminService";

import "../../styles/admin/layout/admin-sidebar.css";
import "../../styles/admin/layout/admin-topbar.css";
import "../../styles/admin/notifications/admin-notification-popup.css";
import "../../styles/admin/shared/admin-responsive.css";

import "../../styles/superadmin/services/superadmin-services.css";
import "../../styles/superadmin/shared/superadmin-responsive.css";

export default function SuperAdminServices() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Service Update",
      message: "A new service was added.",
      time: "4 mins ago",
    },
  ]);

  const [services, setServices] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Memoize categories from existing data to populate the dropdown
  const categories = useMemo(() => {
    if (services.length === 0) return ["Consultation", "Cleaning", "Restoration", "Orthodontics", "Surgery", "Pediatric Dentistry", "Cosmetic Dentistry"];
    const unique = [...new Set(services.map((s) => s.category))];
    return unique.sort();
  }, [services]);

  const [form, setForm] = useState({
    name: "",
    category: "Consultation",
    description: "",
  });

  // Ensure form category matches available categories once loaded
  useEffect(() => {
    if (categories.length > 0 && !categories.includes(form.category)) {
      setForm(prev => ({ ...prev, category: categories[0] }));
    }
  }, [categories]);

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: "",
    ids: [],
    title: "",
    message: "",
    payload: null,
  });

  const fetchServices = async () => {
    const res = await getSuperAdminServices();
    if (res?.success) setServices(res.data);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const filteredServices = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) return services;

    return services.filter((service) => {
      return (
        (service.name || "").toLowerCase().includes(keyword) ||
        (service.category || "").toLowerCase().includes(keyword) ||
        (service.description || "").toLowerCase().includes(keyword) ||
        (service.status || "").toLowerCase().includes(keyword)
      );
    });
  }, [services, searchTerm]);

  const allVisibleSelected =
    filteredServices.length > 0 &&
    filteredServices.every((service) => selectedIds.includes(service.id));

  const handleMarkAllRead = () => {
    setNotifications([]);
    setIsNotificationOpen(false);
  };

  const openAddServiceModal = (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.description.trim()) return;

    setConfirmModal({
      open: true,
      type: "add-service",
      ids: [],
      title: "Add Service",
      message: `Are you sure you want to add "${form.name.trim()}" to the service list?`,
      payload: {
        name: form.name.trim(),
        category: form.category,
        description: form.description.trim(),
      },
    });
  };

  const openSingleStatusModal = (service) => {
    const isActive = service.status === "Active";

    setConfirmModal({
      open: true,
      type: isActive ? "disable-single" : "enable-single",
      ids: [service.id],
      title: isActive ? "Disable Service" : "Enable Service",
      message: isActive
        ? `Are you sure you want to disable "${service.name}"?`
        : `Are you sure you want to enable "${service.name}"?`,
      payload: null,
    });
  };

  const openBulkDisableModal = () => {
    if (selectedIds.length === 0) return;

    setConfirmModal({
      open: true,
      type: "disable-multiple",
      ids: selectedIds,
      title: "Disable Selected Services",
      message: `Are you sure you want to disable ${selectedIds.length} selected service(s)?`,
      payload: null,
    });
  };

  const openBulkEnableModal = () => {
    if (selectedIds.length === 0) return;

    setConfirmModal({
      open: true,
      type: "enable-multiple",
      ids: selectedIds,
      title: "Enable Selected Services",
      message: `Are you sure you want to enable ${selectedIds.length} selected service(s)?`,
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

    if (type === "add-service" && payload) {
      const res = await createSuperAdminService(payload);
      if (res?.success) {
        setServices((prev) => [res.data, ...prev]);
        setForm({
          name: "",
          category: categories[0],
          description: "",
        });
      }
    }

    if (type === "disable-single" || type === "disable-multiple") {
      setServices((prev) =>
        prev.map((service) =>
          ids.includes(service.id) ? { ...service, status: "Disabled" } : service
        )
      );
      setSelectedIds([]);
    }

    if (type === "enable-single" || type === "enable-multiple") {
      setServices((prev) =>
        prev.map((service) =>
          ids.includes(service.id) ? { ...service, status: "Active" } : service
        )
      );
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
      const visibleIds = filteredServices.map((service) => service.id);
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
      return;
    }

    const visibleIds = filteredServices.map((service) => service.id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  return (
    <div className="admin-dashboard-page">
      <SuperAdminSidebar />

      <main className="admin-main-content">
        <SuperAdminTopbar
          title="Services"
          notifications={notifications}
          isNotificationOpen={isNotificationOpen}
          onToggleNotifications={() => setIsNotificationOpen((prev) => !prev)}
          onCloseNotifications={() => setIsNotificationOpen(false)}
          onMarkAllRead={handleMarkAllRead}
        />

        <div className="superadmin-services-fixed-page">
          <div className="superadmin-services-content">
            <section className="superadmin-services-header">
              <h2 className="superadmin-services-title">Services Management</h2>
              <p className="superadmin-services-subtitle">
                Add, organize, and manage the clinic service list.
              </p>
            </section>

            <section className="superadmin-services-form-card">
              <div className="superadmin-services-card-head">
                <div>
                  <h3>Add Service</h3>
                  <p>Enter the service details before adding it to the list.</p>
                </div>
              </div>

              <form
                onSubmit={openAddServiceModal}
                className="superadmin-services-form-grid"
              >
                <div className="superadmin-services-field">
                  <label>Service Name</label>
                  <input
                    type="text"
                    placeholder="Service name"
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>

                <div className="superadmin-services-field">
                  <label>Category</label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, category: e.target.value }))
                    }
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="superadmin-services-field superadmin-services-field-full">
                  <label>Description</label>
                  <textarea
                    placeholder="Service description"
                    rows={4}
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="superadmin-services-form-action">
                  <button type="submit" className="superadmin-services-primary-btn">
                    Add Service
                  </button>
                </div>
              </form>
            </section>

            <section className="superadmin-services-list-card superadmin-services-list-flex">
              <div className="superadmin-services-card-head superadmin-services-card-head-wrap">
                <div>
                  <h3>Service List</h3>
                  <p>Only the list area scrolls when there are many records.</p>
                </div>

                <div className="superadmin-services-top-actions">
                  <input
                    type="text"
                    placeholder="Search name, category, description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="superadmin-services-search"
                  />

                  <button
                    type="button"
                    onClick={openBulkEnableModal}
                    className="superadmin-services-secondary-btn enable-selected-btn"
                    disabled={selectedIds.length === 0}
                  >
                    Enable Selected
                  </button>

                  <button
                    type="button"
                    onClick={openBulkDisableModal}
                    className="superadmin-services-secondary-btn"
                    disabled={selectedIds.length === 0}
                  >
                    Disable Selected
                  </button>
                </div>
              </div>

              <div className="superadmin-services-table-scroll">
                <div className="superadmin-services-table-wrap">
                  <table className="superadmin-services-table">
                    <thead>
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            checked={allVisibleSelected}
                            onChange={toggleSelectAllVisible}
                          />
                        </th>
                        <th>Service Name</th>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredServices.map((service) => (
                        <tr key={service.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(service.id)}
                              onChange={() => toggleSelectOne(service.id)}
                            />
                          </td>

                          <td className="superadmin-services-name-cell">
                            {service.name}
                          </td>

                          <td className="superadmin-services-category-cell">
                            {service.category}
                          </td>

                          <td className="superadmin-services-description-cell">
                            {service.description}
                          </td>

                          <td>
                            <span
                              className={`superadmin-services-status ${
                                service.status === "Active"
                                  ? "is-active"
                                  : "is-disabled"
                              }`}
                            >
                              {service.status}
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              onClick={() => openSingleStatusModal(service)}
                              className={`superadmin-services-action-btn ${
                                service.status === "Active"
                                  ? "disable-btn"
                                  : "enable-btn"
                              }`}
                            >
                              {service.status === "Active" ? "Disable" : "Enable"}
                            </button>
                          </td>
                        </tr>
                      ))}

                      {filteredServices.length === 0 && (
                        <tr>
                          <td colSpan="6">
                            <div className="superadmin-services-empty-state">
                              No service records found.
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

      {confirmModal.open && (
        <div
          className="superadmin-services-modal-overlay"
          onClick={closeConfirmModal}
        >
          <div
            className="superadmin-services-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{confirmModal.title}</h3>
            <p>{confirmModal.message}</p>

            <div className="superadmin-services-modal-actions">
              <button
                type="button"
                className="superadmin-services-modal-cancel"
                onClick={closeConfirmModal}
              >
                Cancel
              </button>

              <button
                type="button"
                className="superadmin-services-modal-confirm"
                onClick={handleConfirmAction}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}