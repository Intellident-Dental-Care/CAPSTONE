import { useEffect, useMemo, useState } from "react";
import SuperAdminSidebar from "../../components/superadmin/layout/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/layout/SuperAdminTopbar";
import {
  getSuperAdminServices,
  createSuperAdminService,
  getSuperAdminServiceCategories,
  createSuperAdminServiceCategory,
  updateSuperAdminServiceCategory,
  updateSuperAdminServiceCategoryStatus,
} from "../../services/superAdminService";

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
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ DYNAMIC CATEGORY STATE
  const [dbCategories, setDbCategories] = useState([]);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  
  // Manage Categories Table State
  const [selectedCatIds, setSelectedCatIds] = useState([]);
  const [localCatEdits, setLocalCatEdits] = useState({});

  const activeCategories = useMemo(
    () => dbCategories.filter((c) => c.status === "Active"),
    [dbCategories]
  );

  const [form, setForm] = useState({
    name: "",
    category: "",
    price_min: "",
    price_max: "",
    description: "",
  });

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: "",
    ids: [],
    title: "",
    message: "",
    payload: null,
  });

  // ✅ CUSTOM ALERT MODAL STATE (Replaces window.alert)
  const [alertModal, setAlertModal] = useState({
    open: false,
    message: "",
  });

  const showAlert = (message) => {
    setAlertModal({ open: true, message });
  };

  const closeAlertModal = () => {
    setAlertModal({ open: false, message: "" });
  };

  const fetchData = async () => {
    const [svcRes, catRes] = await Promise.all([
      getSuperAdminServices(),
      getSuperAdminServiceCategories(),
    ]);

    if (svcRes?.success) setServices(svcRes.data || []);
    if (catRes?.success) {
      setDbCategories(catRes.data || []);
      
      // Initialize local edits for inline editing
      const initialEdits = {};
      (catRes.data || []).forEach(cat => {
        initialEdits[cat.id] = { category_name: cat.category_name, status: cat.status };
      });
      setLocalCatEdits(initialEdits);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Set default category when modal opens or categories load
  useEffect(() => {
    if (activeCategories.length > 0 && !form.category) {
      setForm((prev) => ({ ...prev, category: activeCategories[0].category_name }));
    }
  }, [activeCategories, form.category]);

  const formatPriceRange = (min, max) => {
    const minPrice = Number(min || 0);
    const maxPrice = Number(max || 0);

    const format = (value) =>
      `₱${value.toLocaleString("en-PH", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`;

    if (!minPrice && !maxPrice) return "₱0";
    if (minPrice && !maxPrice) return `${format(minPrice)} starting`;
    if (minPrice === maxPrice) return format(minPrice);

    return `${format(minPrice)} - ${format(maxPrice)}`;
  };

  const filteredServices = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) return services;

    return services.filter((service) => {
      return (
        (service.name || "").toLowerCase().includes(keyword) ||
        (service.category || "").toLowerCase().includes(keyword) ||
        (service.subcategory || "").toLowerCase().includes(keyword) ||
        (service.price_display || "").toLowerCase().includes(keyword) ||
        String(service.price_min || "").includes(keyword) ||
        String(service.price_max || "").includes(keyword) ||
        (service.description || "").toLowerCase().includes(keyword) ||
        (service.status || "").toLowerCase().includes(keyword)
      );
    });
  }, [services, searchTerm]);

  const allVisibleSelected =
    filteredServices.length > 0 &&
    filteredServices.every((service) => selectedIds.includes(service.id));

  const allCatsVisibleSelected =
    dbCategories.length > 0 &&
    dbCategories.every((cat) => selectedCatIds.includes(cat.id));

  const handleMarkAllRead = () => {
    setNotifications([]);
    setIsNotificationOpen(false);
  };

  const resetForm = () => {
    setForm({
      name: "",
      category: activeCategories[0]?.category_name || "",
      price_min: "",
      price_max: "",
      description: "",
    });
  };

  const handleOpenAddServiceModal = () => {
    resetForm();
    setIsAddServiceModalOpen(true);
  };

  const handleCloseAddServiceModal = () => {
    setIsAddServiceModalOpen(false);
    resetForm();
  };

  // ✅ CATEGORY MODAL FUNCTIONS
  const handleOpenAddCategoryModal = () => {
    setNewCategory("");
    setSelectedCatIds([]);
    setIsAddCategoryModalOpen(true);
    
    // Reset any unsaved edits back to db defaults
    const initialEdits = {};
    dbCategories.forEach(cat => {
      initialEdits[cat.id] = { category_name: cat.category_name, status: cat.status };
    });
    setLocalCatEdits(initialEdits);
  };

  const handleCloseAddCategoryModal = () => {
    setNewCategory("");
    setIsAddCategoryModalOpen(false);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();

    const cleanedCategory = newCategory.trim();

    if (!cleanedCategory) {
      showAlert("Please enter a category name.");
      return;
    }

    const categoryExists = dbCategories.some(
      (cat) => cat.category_name.toLowerCase() === cleanedCategory.toLowerCase()
    );

    if (categoryExists) {
      showAlert("This category already exists.");
      return;
    }

    setIsSubmitting(true);
    const res = await createSuperAdminServiceCategory({ category_name: cleanedCategory });
    setIsSubmitting(false);
    
    if (res?.success) {
      setNewCategory("");
      fetchData();
    } else {
      showAlert(res?.message || "Failed to add category.");
    }
  };

  const handleCatNameChange = (id, newName) => {
    setLocalCatEdits((prev) => ({
      ...prev,
      [id]: { ...prev[id], category_name: newName },
    }));
  };

  const handleCatStatusToggle = (id) => {
    setLocalCatEdits((prev) => {
      const currentStatus = prev[id]?.status || "Active";
      return {
        ...prev,
        [id]: { ...prev[id], status: currentStatus === "Active" ? "Inactive" : "Active" },
      };
    });
  };

  const isCatChanged = (cat) => {
    const edit = localCatEdits[cat.id];
    if (!edit) return false;
    return edit.category_name !== cat.category_name || edit.status !== cat.status;
  };

  const handleSaveCategory = async (cat) => {
    const edit = localCatEdits[cat.id];
    if (!edit || !edit.category_name.trim()) return;

    setIsSubmitting(true);
    try {
      if (edit.category_name !== cat.category_name) {
        await updateSuperAdminServiceCategory(cat.id, { category_name: edit.category_name.trim() });
      }
      if (edit.status !== cat.status) {
        await updateSuperAdminServiceCategoryStatus([cat.id], edit.status);
      }
      await fetchData();
    } catch (err) {
      showAlert("Failed to save changes.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkCategoryStatus = async (status) => {
    if (selectedCatIds.length === 0) return;
    setIsSubmitting(true);
    const res = await updateSuperAdminServiceCategoryStatus(selectedCatIds, status);
    setIsSubmitting(false);
    if (res?.success) {
      setSelectedCatIds([]);
      fetchData();
    } else {
      showAlert(res?.message || "Failed to update category statuses.");
    }
  };

  const toggleSelectOneCat = (id) => {
    setSelectedCatIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllCats = () => {
    if (allCatsVisibleSelected) {
      setSelectedCatIds([]);
    } else {
      setSelectedCatIds(dbCategories.map((cat) => cat.id));
    }
  };

  const openAddServiceConfirmModal = (e) => {
    e.preventDefault();

    const minPrice = Number(form.price_min);
    const maxPrice = Number(form.price_max);

    if (
      !form.name.trim() ||
      !form.description.trim() ||
      !form.price_min ||
      !form.price_max ||
      Number.isNaN(minPrice) ||
      Number.isNaN(maxPrice) ||
      minPrice <= 0 ||
      maxPrice <= 0 ||
      minPrice > maxPrice
    ) {
      showAlert(
        "Please enter valid service details. Maximum price must be higher than or equal to minimum price."
      );
      return;
    }

    const priceDisplay = formatPriceRange(minPrice, maxPrice);

    setConfirmModal({
      open: true,
      type: "add-service",
      ids: [],
      title: "Add Service",
      message: `Are you sure you want to add "${form.name.trim()}" with a price range of ${priceDisplay}?`,
      payload: {
        name: form.name.trim(),
        category: form.category,
        price_min: minPrice,
        price_max: maxPrice,
        price_display: priceDisplay,
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
        closeConfirmModal();
        handleCloseAddServiceModal();
        return;
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
    const visibleIds = filteredServices.map((service) => service.id);

    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
      return;
    }

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
              <div>
                <h2 className="superadmin-services-title">
                  Services Management
                </h2>
                <p className="superadmin-services-subtitle">
                  Add, organize, and manage the clinic service list.
                </p>
              </div>

              <div className="superadmin-services-header-actions">
                <button
                  type="button"
                  className="superadmin-services-secondary-btn"
                  onClick={handleOpenAddCategoryModal}
                >
                  Manage Categories
                </button>

                <button
                  type="button"
                  className="superadmin-services-primary-btn superadmin-services-add-open-btn"
                  onClick={handleOpenAddServiceModal}
                >
                  Add Service
                </button>
              </div>
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
                    placeholder="Search name, category, price, description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="superadmin-services-search"
                  />

                  {selectedIds.length > 0 && (
                    <div className="superadmin-services-bulk-actions">
                      <button
                        type="button"
                        onClick={openBulkEnableModal}
                        className="superadmin-services-secondary-btn enable-selected-btn"
                      >
                        Enable Selected
                      </button>

                      <button
                        type="button"
                        onClick={openBulkDisableModal}
                        className="superadmin-services-secondary-btn"
                      >
                        Disable Selected
                      </button>
                    </div>
                  )}
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
                        <th>Price</th>
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

                          <td className="superadmin-services-price-cell">
                            {service.price_display ||
                              formatPriceRange(
                                service.price_min,
                                service.price_max
                              )}
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
                              {service.status || "Active"}
                            </span>
                          </td>

                          <td className="superadmin-services-action-cell">
                            <button
                              type="button"
                              onClick={() => openSingleStatusModal(service)}
                              className={`superadmin-services-action-btn ${
                                service.status === "Active"
                                  ? "disable-btn"
                                  : "enable-btn"
                              }`}
                            >
                              {service.status === "Active"
                                ? "Disable"
                                : "Enable"}
                            </button>
                          </td>
                        </tr>
                      ))}

                      {filteredServices.length === 0 && (
                        <tr>
                          <td colSpan="7">
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

      {/* ✅ ADD SERVICE MODAL */}
      {isAddServiceModalOpen && (
        <div
          className="superadmin-services-modal-overlay"
          onClick={handleCloseAddServiceModal}
        >
          <div
            className="superadmin-services-modal superadmin-services-add-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="superadmin-services-modal-top">
              <div>
                <h3>Add Service</h3>
                <p>Enter the service details before adding it to the list.</p>
              </div>

              <button
                type="button"
                className="superadmin-services-modal-close"
                onClick={handleCloseAddServiceModal}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={openAddServiceConfirmModal}
              className="superadmin-services-form-grid superadmin-services-modal-form-grid"
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
                  {activeCategories.map((cat) => (
                    <option key={cat.id} value={cat.category_name}>
                      {cat.category_name}
                    </option>
                  ))}
                  {activeCategories.length === 0 && (
                    <option value="" disabled>No active categories</option>
                  )}
                </select>
              </div>

              <div className="superadmin-services-field">
                <label>Minimum Price</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Enter minimum price"
                  value={form.price_min}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      price_min: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="superadmin-services-field">
                <label>Maximum Price</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Enter maximum price"
                  value={form.price_max}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      price_max: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="superadmin-services-field superadmin-services-field-full">
                <label>Description</label>
                <textarea
                  placeholder="Service description"
                  rows={5}
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="superadmin-services-modal-actions">
                <button
                  type="button"
                  className="superadmin-services-modal-cancel"
                  onClick={handleCloseAddServiceModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="superadmin-services-modal-confirm"
                >
                  Add Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ MANAGE CATEGORY MODAL */}
      {isAddCategoryModalOpen && (
        <div
          className="superadmin-services-modal-overlay"
          onClick={handleCloseAddCategoryModal}
        >
          <div
            className="superadmin-services-modal"
            style={{ maxWidth: "680px", width: "100%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="superadmin-services-modal-top">
              <div>
                <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#374151" }}>Manage Categories</h3>
                <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "2px" }}>Create, edit, or disable service categories.</p>
              </div>

              <button
                type="button"
                className="superadmin-services-modal-close"
                onClick={handleCloseAddCategoryModal}
              >
                ×
              </button>
            </div>

            {/* Inline Add Category Row */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#6b7280", marginBottom: "8px" }}>New Category Name</label>
              <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Example: Dental X-Ray"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  disabled={isSubmitting}
                  style={{ flex: 1, padding: "10px 14px", borderRadius: "8px", border: "1px solid #f1d7e3", outline: "none", fontSize: "14px", color: "#374151" }}
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="superadmin-services-modal-confirm"
                  style={{ margin: 0, padding: '0 24px', height: '42px', borderRadius: "8px" }}
                >
                  Add
                </button>
              </form>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#374151", margin: 0 }}>Category List</h3>
              {selectedCatIds.length > 0 && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => handleBulkCategoryStatus("Active")}
                    disabled={isSubmitting}
                    className="superadmin-services-secondary-btn enable-selected-btn"
                    style={{ padding: "6px 12px", fontSize: "12px" }}
                  >
                    Enable Selected
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkCategoryStatus("Inactive")}
                    disabled={isSubmitting}
                    className="superadmin-services-secondary-btn"
                    style={{ padding: "6px 12px", fontSize: "12px" }}
                  >
                    Disable Selected
                  </button>
                </div>
              )}
            </div>

            <div className="superadmin-services-table-scroll" style={{ maxHeight: "350px", border: "none", background: "transparent" }}>
              <div className="superadmin-services-table-wrap" style={{ border: "none", borderRadius: "0" }}>
                <table className="superadmin-services-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #f1d7e3", background: "transparent" }}>
                      <th style={{ width: "40px", padding: "12px 8px", background: "transparent" }}>
                        <input
                          type="checkbox"
                          checked={allCatsVisibleSelected}
                          onChange={toggleSelectAllCats}
                        />
                      </th>
                      <th style={{ padding: "12px 8px", background: "transparent", color: "#6b7280", fontSize: "12px", fontWeight: "600", textTransform: "none" }}>Category Name</th>
                      <th style={{ width: "90px", textAlign: "center", padding: "12px 8px", background: "transparent", color: "#6b7280", fontSize: "12px", fontWeight: "600", textTransform: "none" }}>Status</th>
                      <th style={{ width: "150px", padding: "12px 8px", background: "transparent" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbCategories.map((cat) => {
                      const edit = localCatEdits[cat.id] || cat;
                      const changed = isCatChanged(cat);

                      return (
                        <tr key={cat.id} style={{ borderBottom: "1px solid #fdf2f7", background: "transparent" }}>
                          <td style={{ padding: "12px 8px" }}>
                            <input
                              type="checkbox"
                              checked={selectedCatIds.includes(cat.id)}
                              onChange={() => toggleSelectOneCat(cat.id)}
                            />
                          </td>
                          <td style={{ padding: "12px 8px" }}>
                            <input
                              type="text"
                              value={edit.category_name}
                              onChange={(e) => handleCatNameChange(cat.id, e.target.value)}
                              disabled={isSubmitting}
                              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #f1d7e3", outline: "none", fontSize: "13px", color: "#374151" }}
                            />
                          </td>
                          <td style={{ padding: "12px 8px", textAlign: "center" }}>
                            <span
                              className={`superadmin-services-status ${
                                edit.status === "Active" ? "is-active" : "is-disabled"
                              }`}
                              style={{ margin: "0 auto" }}
                            >
                              {edit.status}
                            </span>
                          </td>
                          <td style={{ padding: "12px 8px" }}>
                            <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                              {changed && (
                                <button
                                  onClick={() => handleSaveCategory(cat)}
                                  disabled={isSubmitting}
                                  className="superadmin-services-action-btn enable-btn"
                                  style={{ padding: "6px 12px", fontSize: "12px", minWidth: "60px", borderRadius: "6px", fontWeight: "600" }}
                                >
                                  Save
                                </button>
                              )}
                              <button
                                onClick={() => handleCatStatusToggle(cat.id)}
                                disabled={isSubmitting}
                                className="superadmin-services-action-btn"
                                style={{ padding: "6px 12px", fontSize: "12px", background: "#f3f4f6", color: "#4b5563", border: "none", borderRadius: "6px", fontWeight: "600" }}
                              >
                                {edit.status === "Active" ? "Disable" : "Enable"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {dbCategories.length === 0 && (
                      <tr>
                        <td colSpan="4">
                          <div className="superadmin-services-empty-state" style={{ padding: "30px 0" }}>
                            No categories found.
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ✅ CONFIRMATION MODAL */}
      {confirmModal.open && (
        <div
          className="superadmin-services-modal-overlay"
          onClick={closeConfirmModal}
        >
          <div
            className="superadmin-services-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="superadmin-services-modal-top">
              <h3>{confirmModal.title}</h3>
              <button
                type="button"
                className="superadmin-services-modal-close"
                onClick={closeConfirmModal}
              >
                ×
              </button>
            </div>

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

      {/* ✅ CUSTOM ALERT MODAL (Replaces window.alert) */}
      {alertModal.open && (
        <div
          className="superadmin-services-modal-overlay"
          onClick={closeAlertModal}
        >
          <div
            className="superadmin-services-modal"
            style={{ maxWidth: "420px", textAlign: "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="superadmin-services-modal-top" style={{ borderBottom: "none", paddingBottom: "0" }}>
              <h3 style={{ color: "#e11d48", width: "100%", fontSize: "20px" }}>Notice</h3>
            </div>
            
            <p style={{ margin: "16px 0 24px", color: "#4b5563", fontSize: "14px", lineHeight: "1.5" }}>
              {alertModal.message}
            </p>

            <div className="superadmin-services-modal-actions" style={{ justifyContent: "center" }}>
              <button
                type="button"
                className="superadmin-services-modal-confirm"
                onClick={closeAlertModal}
                style={{ padding: "10px 32px" }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}