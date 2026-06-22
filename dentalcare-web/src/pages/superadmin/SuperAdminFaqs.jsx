import { useEffect, useMemo, useState } from "react";
import SuperAdminSidebar from "../../components/superadmin/layout/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/layout/SuperAdminTopbar";
import {
  getSuperAdminFaqs,
  createSuperAdminFaq,
} from "../../services/superAdminService";

import "../../styles/admin/layout/admin-sidebar.css";
import "../../styles/admin/layout/admin-topbar.css";
import "../../styles/admin/notifications/admin-notification-popup.css";
import "../../styles/admin/shared/admin-responsive.css";

import "../../styles/superadmin/faqs/superadmin-faqs.css";
import "../../styles/superadmin/shared/superadmin-responsive.css";

const FAQ_CATEGORIES = [
  "General",
  "Appointments",
  "Services",
  "Accounts",
  "Records",
  "Pre-Assessment",
  "Notifications",
  "Privacy",
];

export default function SuperAdminFaqs() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "FAQ Update",
      message: "FAQ list was updated.",
      time: "7 mins ago",
    },
  ]);

  const [faqs, setFaqs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [form, setForm] = useState({
    question: "",
    answer: "",
    category: "General",
  });

  const [editForm, setEditForm] = useState({
    id: null,
    question: "",
    answer: "",
    category: "General",
  });

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    id: null,
    title: "",
    message: "",
  });

  const fetchFaqs = async () => {
    const res = await getSuperAdminFaqs();
    if (res?.success) setFaqs(res.data || []);
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const handleMarkAllRead = () => {
    setNotifications([]);
    setIsNotificationOpen(false);
  };

  const resetAddForm = () => {
    setForm({
      question: "",
      answer: "",
      category: "General",
    });
  };

  const openAddFaqModal = () => {
    resetAddForm();
    setIsAddModalOpen(true);
  };

  const closeAddFaqModal = () => {
    setIsAddModalOpen(false);
    resetAddForm();
  };

  const handleAddFaq = async (e) => {
    e.preventDefault();

    if (!form.question.trim() || !form.answer.trim()) return;

    const res = await createSuperAdminFaq({
      question: form.question.trim(),
      answer: form.answer.trim(),
      category: form.category,
    });

    if (res?.success) {
      setFaqs((prev) => [res.data, ...prev]);
      closeAddFaqModal();
    } else {
      console.error("Failed to save FAQ to the database");
      alert("Failed to add FAQ. Please check your connection.");
    }
  };

  const openEditFaqModal = (faq) => {
    setEditForm({
      id: faq.id,
      question: faq.question || "",
      answer: faq.answer || "",
      category: faq.category || "General",
    });
    setIsEditModalOpen(true);
  };

  const closeEditFaqModal = () => {
    setIsEditModalOpen(false);
    setEditForm({
      id: null,
      question: "",
      answer: "",
      category: "General",
    });
  };

  const handleEditFaq = (e) => {
    e.preventDefault();

    if (!editForm.question.trim() || !editForm.answer.trim()) return;

    setFaqs((prev) =>
      prev.map((faq) =>
        faq.id === editForm.id
          ? {
              ...faq,
              question: editForm.question.trim(),
              answer: editForm.answer.trim(),
              category: editForm.category,
            }
          : faq
      )
    );

    closeEditFaqModal();
  };

  const openDeleteModal = (faq) => {
    setConfirmModal({
      open: true,
      id: faq.id,
      title: "Delete FAQ",
      message: `Are you sure you want to delete "${faq.question}"?`,
    });
  };

  const closeDeleteModal = () => {
    setConfirmModal({
      open: false,
      id: null,
      title: "",
      message: "",
    });
  };

  const handleConfirmDelete = () => {
    setFaqs((prev) => prev.filter((item) => item.id !== confirmModal.id));
    closeDeleteModal();
  };

  const filteredFaqs = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return faqs.filter((faq) => {
      const matchesSearch =
        !keyword ||
        (faq.question || "").toLowerCase().includes(keyword) ||
        (faq.answer || "").toLowerCase().includes(keyword) ||
        (faq.category || "").toLowerCase().includes(keyword);

      const matchesCategory =
        selectedCategory === "All" || faq.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [faqs, searchTerm, selectedCategory]);

  return (
    <div className="admin-dashboard-page">
      <SuperAdminSidebar />

      <main className="admin-main-content">
        <SuperAdminTopbar
          title="FAQs"
          notifications={notifications}
          isNotificationOpen={isNotificationOpen}
          onToggleNotifications={() => setIsNotificationOpen((prev) => !prev)}
          onCloseNotifications={() => setIsNotificationOpen(false)}
          onMarkAllRead={handleMarkAllRead}
        />

        <div className="superadmin-faqs-fixed-page">
          <div className="superadmin-faqs-content">
            <section className="superadmin-faqs-header">
              <div>
                <h2 className="superadmin-faqs-title">FAQs Management</h2>
                <p className="superadmin-faqs-subtitle">
                  Manage the frequently asked questions shown to users.
                </p>
              </div>

              <button
                type="button"
                className="superadmin-faqs-primary-btn superadmin-faqs-add-open-btn"
                onClick={openAddFaqModal}
              >
                Add FAQ
              </button>
            </section>

            <section className="superadmin-faqs-list-card superadmin-faqs-list-flex">
              <div className="superadmin-faqs-card-head superadmin-faqs-card-head-wrap">
                <div>
                  <h3>FAQ List</h3>
                  <p>Only the list area scrolls when there are many records.</p>
                </div>

                <div className="superadmin-faqs-top-actions">
                  <input
                    type="text"
                    placeholder="Search question, answer, category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="superadmin-faqs-search"
                  />

                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="superadmin-faqs-filter"
                  >
                    <option value="All">All Categories</option>
                    {FAQ_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="superadmin-faqs-list-scroll">
                <div className="superadmin-faqs-list">
                  {filteredFaqs.map((faq) => (
                    <div key={faq.id} className="superadmin-faqs-item">
                      <div className="superadmin-faqs-item-head">
                        <div className="superadmin-faqs-item-main">
                          <div className="superadmin-faqs-item-top">
                            <span className="superadmin-faqs-category">
                              {faq.category}
                            </span>
                          </div>

                          <h4>{faq.question}</h4>
                          <p>{faq.answer}</p>
                        </div>

                        <div className="superadmin-faqs-item-actions">
                          <button
                            type="button"
                            className="superadmin-faqs-edit-btn"
                            onClick={() => openEditFaqModal(faq)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="superadmin-faqs-delete-btn"
                            onClick={() => openDeleteModal(faq)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredFaqs.length === 0 && (
                    <div className="superadmin-faqs-empty-state">
                      No FAQ records found.
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {isAddModalOpen && (
        <div
          className="superadmin-faqs-modal-overlay"
          onClick={closeAddFaqModal}
        >
          <div
            className="superadmin-faqs-modal superadmin-faqs-form-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="superadmin-faqs-modal-top">
              <div>
                <h3>Add FAQ</h3>
                <p>Enter the FAQ details before adding it to the list.</p>
              </div>

              <button
                type="button"
                className="superadmin-faqs-modal-close"
                onClick={closeAddFaqModal}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleAddFaq}
              className="superadmin-faqs-form-grid superadmin-faqs-modal-form-grid"
            >
              <div className="superadmin-faqs-field">
                <label>Question</label>
                <input
                  type="text"
                  placeholder="Enter question"
                  value={form.question}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      question: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="superadmin-faqs-field">
                <label>Category</label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                >
                  {FAQ_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="superadmin-faqs-field superadmin-faqs-field-full">
                <label>Answer</label>
                <textarea
                  placeholder="Enter answer"
                  rows={5}
                  value={form.answer}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      answer: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="superadmin-faqs-modal-actions">
                <button
                  type="button"
                  className="superadmin-faqs-modal-cancel"
                  onClick={closeAddFaqModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="superadmin-faqs-modal-confirm"
                >
                  Add FAQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div
          className="superadmin-faqs-modal-overlay"
          onClick={closeEditFaqModal}
        >
          <div
            className="superadmin-faqs-modal superadmin-faqs-form-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="superadmin-faqs-modal-top">
              <div>
                <h3>Edit FAQ</h3>
                <p>Update the question, answer, or category.</p>
              </div>

              <button
                type="button"
                className="superadmin-faqs-modal-close"
                onClick={closeEditFaqModal}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleEditFaq}
              className="superadmin-faqs-form-grid superadmin-faqs-modal-form-grid"
            >
              <div className="superadmin-faqs-field">
                <label>Question</label>
                <input
                  type="text"
                  placeholder="Enter question"
                  value={editForm.question}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      question: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="superadmin-faqs-field">
                <label>Category</label>
                <select
                  value={editForm.category}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                >
                  {FAQ_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="superadmin-faqs-field superadmin-faqs-field-full">
                <label>Answer</label>
                <textarea
                  placeholder="Enter answer"
                  rows={5}
                  value={editForm.answer}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      answer: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="superadmin-faqs-modal-actions">
                <button
                  type="button"
                  className="superadmin-faqs-modal-cancel"
                  onClick={closeEditFaqModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="superadmin-faqs-modal-confirm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmModal.open && (
        <div
          className="superadmin-faqs-modal-overlay"
          onClick={closeDeleteModal}
        >
          <div
            className="superadmin-faqs-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="superadmin-faqs-modal-top">
              <h3>{confirmModal.title}</h3>
              <button
                type="button"
                className="superadmin-faqs-modal-close"
                onClick={closeDeleteModal}
              >
                ×
              </button>
            </div>

            <p>{confirmModal.message}</p>

            <div className="superadmin-faqs-modal-actions">
              <button
                type="button"
                className="superadmin-faqs-modal-cancel"
                onClick={closeDeleteModal}
              >
                Cancel
              </button>

              <button
                type="button"
                className="superadmin-faqs-modal-confirm"
                onClick={handleConfirmDelete}
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