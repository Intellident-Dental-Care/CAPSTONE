import { useEffect, useMemo, useState } from "react";
import SuperAdminSidebar from "../../components/superadmin/layout/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/layout/SuperAdminTopbar";
import { getSuperAdminFaqs, createSuperAdminFaq } from "../../services/superAdminService";

import "../../styles/admin/layout/admin-sidebar.css";
import "../../styles/admin/layout/admin-topbar.css";
import "../../styles/admin/notifications/admin-notification-popup.css";
import "../../styles/admin/shared/admin-responsive.css";

import "../../styles/superadmin/faqs/superadmin-faqs.css";
import "../../styles/superadmin/shared/superadmin-responsive.css";

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

  const [form, setForm] = useState({
    question: "",
    answer: "",
    category: "General",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    id: null,
    title: "",
    message: "",
  });

  const fetchFaqs = async () => {
    const res = await getSuperAdminFaqs();
    if (res?.success) setFaqs(res.data);
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const handleMarkAllRead = () => {
    setNotifications([]);
    setIsNotificationOpen(false);
  };

  const handleAddFaq = async (e) => {
    e.preventDefault();

    if (!form.question.trim() || !form.answer.trim()) return;

    // Call the backend API
    const res = await createSuperAdminFaq({
      question: form.question.trim(),
      answer: form.answer.trim(),
      category: form.category,
    });

    if (res?.success) {
      // Add the real database record (with the Supabase UUID) to the top of the list
      setFaqs((prev) => [res.data, ...prev]);

      // Clear the form
      setForm({
        question: "",
        answer: "",
        category: "General",
      });
    } else {
      console.error("Failed to save FAQ to the database");
      alert("Failed to add FAQ. Please check your connection.");
    }
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
              <h2 className="superadmin-faqs-title">FAQs Management</h2>
              <p className="superadmin-faqs-subtitle">
                Manage the frequently asked questions shown to users.
              </p>
            </section>

            <section className="superadmin-faqs-form-card">
              <div className="superadmin-faqs-card-head">
                <div>
                  <h3>Add FAQ</h3>
                  <p>Enter the FAQ details before adding it to the list.</p>
                </div>
              </div>

              <form onSubmit={handleAddFaq} className="superadmin-faqs-form-grid">
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
                    <option value="General">General</option>
                    <option value="Appointments">Appointments</option>
                    <option value="Payments">Payments</option>
                    <option value="Services">Services</option>
                    <option value="Accounts">Accounts</option>
                  </select>
                </div>

                <div className="superadmin-faqs-field superadmin-faqs-field-full">
                  <label>Answer</label>
                  <textarea
                    placeholder="Enter answer"
                    rows={4}
                    value={form.answer}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        answer: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="superadmin-faqs-form-action">
                  <button type="submit" className="superadmin-faqs-primary-btn">
                    Add FAQ
                  </button>
                </div>
              </form>
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
                    <option value="General">General</option>
                    <option value="Appointments">Appointments</option>
                    <option value="Payments">Payments</option>
                    <option value="Services">Services</option>
                    <option value="Accounts">Accounts</option>
                  </select>
                </div>
              </div>

              <div className="superadmin-faqs-list-scroll">
                <div className="superadmin-faqs-list">
                  {filteredFaqs.map((faq) => (
                    <div key={faq.id} className="superadmin-faqs-item">
                      <div className="superadmin-faqs-item-top">
                        <h4>{faq.question}</h4>
                        <span className="superadmin-faqs-category">
                          {faq.category}
                        </span>
                      </div>

                      <p>{faq.answer}</p>

                      <div className="superadmin-faqs-item-actions">
                        <button
                          type="button"
                          className="superadmin-faqs-delete-btn"
                          onClick={() => openDeleteModal(faq)}
                        >
                          Delete
                        </button>
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

      {confirmModal.open && (
        <div
          className="superadmin-faqs-modal-overlay"
          onClick={closeDeleteModal}
        >
          <div
            className="superadmin-faqs-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{confirmModal.title}</h3>
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