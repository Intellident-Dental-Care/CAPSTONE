import { useEffect, useState } from "react";
import SuperAdminSidebar from "../../components/superadmin/layout/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/layout/SuperAdminTopbar";
import {
  getSuperAdminTerms,
  saveSuperAdminTerms,
} from "../../services/superAdminService";

import "../../styles/admin/layout/admin-sidebar.css";
import "../../styles/admin/layout/admin-topbar.css";
import "../../styles/admin/notifications/admin-notification-popup.css";
import "../../styles/admin/shared/admin-responsive.css";
import "../../styles/superadmin/shared/superadmin-responsive.css";
import "../../styles/superadmin/shared/superadmin-terms-conditions.css";

export default function SuperAdminTermsConditions() {
  const [sections, setSections] = useState([]);
  const [draftSections, setDraftSections] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSection, setNewSection] = useState({
    title: "",
    content: "",
  });

  useEffect(() => {
    const fetchTerms = async () => {
      setIsLoading(true);

      const response = await getSuperAdminTerms();

      if (response?.success && Array.isArray(response.data)) {
        const cleaned = response.data.map((item) => ({
          ...item,
        }));

        setSections(cleaned);
        setDraftSections(cleaned);
      } else {
        console.error("Failed to load terms from database.");
      }

      setIsLoading(false);
    };

    fetchTerms();
  }, []);

  const handleEditClick = () => {
    setDraftSections(sections);
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setDraftSections(sections);
    setIsEditMode(false);
  };

  const handleSectionChange = (id, field, value) => {
    setDraftSections((prev) =>
      prev.map((section) =>
        section.id === id ? { ...section, [field]: value } : section
      )
    );
  };

  const handleRemoveSection = (id) => {
    setDraftSections((prev) => prev.filter((section) => section.id !== id));
  };

  const handleSave = async () => {
    setIsSaving(true);

    const response = await saveSuperAdminTerms(draftSections);

    if (response?.success) {
      setSections(draftSections);
      setIsEditMode(false);
    } else {
      alert(response?.message || "Failed to save terms to the database.");
    }

    setIsSaving(false);
  };

  const handleOpenAddModal = () => {
    setNewSection({
      title: "",
      content: "",
    });
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setNewSection({
      title: "",
      content: "",
    });
  };

  const handleConfirmAddSection = () => {
    if (!newSection.title.trim() || !newSection.content.trim()) {
      alert("Please complete the title and content.");
      return;
    }

    const nextId =
      draftSections.length > 0
        ? Math.max(...draftSections.map((item) => Number(item.id) || 0)) + 1
        : 1;

    setDraftSections((prev) => [
      ...prev,
      {
        id: nextId,
        title: newSection.title.trim(),
        content: newSection.content.trim(),
      }
    ]);

    handleCloseAddModal();
  };

  const renderSections = isEditMode ? draftSections : sections;

  return (
    <div className="admin-dashboard-page">
      <SuperAdminSidebar />

      <main className="admin-main-content">
        <SuperAdminTopbar title="Terms and Conditions" />

        <div className="superadmin-terms-page-scrollfix">
          <div className="superadmin-terms-page">
            <div className="superadmin-terms-card">
              <div className="superadmin-terms-head superadmin-terms-head-row">
                <div>
                  <h2>Terms and Conditions</h2>
                  <p>
                    The admin can review, edit, add, and remove the content used
                    for IntelliDent terms and conditions.
                  </p>
                </div>

                <div className="superadmin-terms-actions">
                  {!isEditMode ? (
                    <button
                      type="button"
                      className="superadmin-terms-btn edit-btn"
                      onClick={handleEditClick}
                      disabled={isLoading}
                    >
                      {isLoading ? "Loading..." : "Edit Terms"}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="superadmin-terms-btn secondary-btn"
                        onClick={handleOpenAddModal}
                        disabled={isSaving}
                      >
                        Add Section
                      </button>

                      <button
                        type="button"
                        className="superadmin-terms-btn cancel-btn"
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        className="superadmin-terms-btn save-btn"
                        onClick={handleSave}
                        disabled={isSaving}
                      >
                        {isSaving ? "Saving..." : "Save Changes"}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {isLoading ? (
                <div
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "#666",
                  }}
                >
                  Loading terms from database...
                </div>
              ) : renderSections.length > 0 ? (
                renderSections.map((section, index) => (
                  <div className="superadmin-terms-section" key={section.id}>
                    {isEditMode ? (
                      <>
                        <div className="superadmin-terms-edit-top">
                          <input
                            type="text"
                            value={section.title}
                            onChange={(e) =>
                              handleSectionChange(
                                section.id,
                                "title",
                                e.target.value
                              )
                            }
                            className="superadmin-terms-input"
                            placeholder="Enter section title"
                          />

                          <button
                            type="button"
                            className="superadmin-terms-remove-btn"
                            onClick={() => handleRemoveSection(section.id)}
                          >
                            Remove
                          </button>
                        </div>

                        <textarea
                          value={section.content}
                          onChange={(e) =>
                            handleSectionChange(
                              section.id,
                              "content",
                              e.target.value
                            )
                          }
                          className="superadmin-terms-textarea"
                          rows={6}
                          placeholder="Enter section content"
                        />
                      </>
                    ) : (
                      <>
                        <h3>{section.title}</h3>

                        <p className="superadmin-terms-paragraph">
                          {section.content}
                        </p>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <div className="superadmin-terms-empty-state">
                  No terms and conditions added yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {isAddModalOpen && (
          <div
            className="superadmin-shared-modal-overlay"
            onClick={handleCloseAddModal}
          >
            <div
              className="superadmin-shared-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="superadmin-shared-modal-top">
                <div>
                  <h3>Add Terms and Conditions Section</h3>
                  <p>Create a new section before adding it to the list.</p>
                </div>

                <button
                  type="button"
                  className="superadmin-shared-modal-close"
                  onClick={handleCloseAddModal}
                >
                  ✕
                </button>
              </div>

              <div className="superadmin-shared-modal-body">
                <div className="superadmin-shared-field">
                  <label>Title</label>
                  <input
                    type="text"
                    value={newSection.title}
                    onChange={(e) =>
                      setNewSection((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Enter section title"
                  />
                </div>

                <div className="superadmin-shared-field">
                  <label>Content</label>
                  <textarea
                    rows={6}
                    value={newSection.content}
                    onChange={(e) =>
                      setNewSection((prev) => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
                    placeholder="Enter section content"
                  />
                </div>
              </div>

              <div className="superadmin-shared-modal-actions">
                <button
                  type="button"
                  className="superadmin-shared-btn secondary"
                  onClick={handleCloseAddModal}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="superadmin-shared-btn primary"
                  onClick={handleConfirmAddSection}
                >
                  Add to List
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}