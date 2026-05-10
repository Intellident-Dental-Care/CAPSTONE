import { useEffect, useState } from "react";
import SuperAdminSidebar from "../../components/superadmin/layout/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/layout/SuperAdminTopbar";

import "../../styles/admin/layout/admin-sidebar.css";
import "../../styles/admin/layout/admin-topbar.css";
import "../../styles/admin/notifications/admin-notification-popup.css";
import "../../styles/admin/shared/admin-responsive.css";
import "../../styles/superadmin/shared/superadmin-responsive.css";
import "../../styles/superadmin/shared/superadmin-terms-conditions.css";

const TERMS_STORAGE_KEY = "superadmin_terms_conditions_content";

const stripLeadingNumber = (value) =>
  String(value || "").replace(/^\s*\d+\.\s*/, "").trim();

const DEFAULT_TERMS = [
  {
    id: 1,
    title: "General Use of the System",
    content:
      "IntelliDent is provided to support appointment booking, pre-assessment, patient record viewing, and clinic workflow management. Users must provide truthful and complete information when using the system.",
  },
  {
    id: 2,
    title: "Patient Information and Accuracy",
    content:
      "Patients are responsible for ensuring that submitted personal, medical, and appointment information is accurate and updated. Incorrect information may affect dental recommendations, scheduling, and treatment preparation.",
  },
  {
    id: 3,
    title: "Pre-Assessment Responses",
    content:
      "The pre-assessment feature is intended only for initial screening and appointment preparation. It does not replace professional diagnosis, clinical examination, or emergency treatment.",
  },
  {
    id: 4,
    title: "Uploaded Images and Descriptions",
    content:
      "Any uploaded image, symptom description, or tooth concern must be relevant to the patient’s oral health concern. The clinic may use these only for assessment support, appointment review, and treatment planning within the system.",
  },
  {
    id: 5,
    title: "Appointment Booking and Cancellation",
    content:
      "Appointment requests are subject to dentist availability, clinic confirmation, and branch scheduling policies. Patients are expected to arrive on time and inform the clinic in advance in case of cancellation or rescheduling.",
  },
  {
    id: 6,
    title: "Privacy and Data Protection",
    content:
      "Personal and dental information stored in the system must be handled securely and only by authorized personnel. The clinic must process user data in accordance with applicable privacy policies and data protection practices.",
  },
  {
    id: 7,
    title: "Emergency Cases",
    content:
      "IntelliDent is not intended for medical or dental emergencies. Patients experiencing severe bleeding, trauma, swelling, difficulty breathing, or intense pain should immediately contact the clinic or seek urgent care.",
  },
  {
    id: 8,
    title: "System Limitations",
    content:
      "The system may provide structured questions, suggested categories, and appointment guidance, but final diagnosis, treatment recommendation, and clinical decisions remain under the authority of the licensed dental professional.",
  },
  {
    id: 9,
    title: "Acceptance",
    content:
      "By continuing to use IntelliDent, users acknowledge that they understand these terms and agree to comply with clinic policies, patient responsibilities, and system usage guidelines.",
  },
];

export default function SuperAdminTermsConditions() {
  const [sections, setSections] = useState(DEFAULT_TERMS);
  const [draftSections, setDraftSections] = useState(DEFAULT_TERMS);
  const [isEditMode, setIsEditMode] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSection, setNewSection] = useState({
    title: "",
    content: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem(TERMS_STORAGE_KEY);

    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed) && parsed.length > 0) {
        const cleaned = parsed.map((item) => ({
          ...item,
          title: stripLeadingNumber(item.title),
        }));

        setSections(cleaned);
        setDraftSections(cleaned);
      }
    } catch (error) {
      console.error("Failed to parse saved terms and conditions.", error);
    }
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

  const handleSave = () => {
    setSections(draftSections);
    localStorage.setItem(TERMS_STORAGE_KEY, JSON.stringify(draftSections));
    setIsEditMode(false);
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
        ? Math.max(...draftSections.map((item) => item.id)) + 1
        : 1;

    setDraftSections((prev) => [
      ...prev,
      {
        id: nextId,
        title: stripLeadingNumber(newSection.title),
        content: newSection.content.trim(),
      },
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
                    >
                      Edit Terms
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="superadmin-terms-btn secondary-btn"
                        onClick={handleOpenAddModal}
                      >
                        Add Section
                      </button>

                      <button
                        type="button"
                        className="superadmin-terms-btn cancel-btn"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        className="superadmin-terms-btn save-btn"
                        onClick={handleSave}
                      >
                        Save Changes
                      </button>
                    </>
                  )}
                </div>
              </div>

              {renderSections.map((section, index) => (
                <div className="superadmin-terms-section" key={section.id}>
                  {isEditMode ? (
                    <>
                      <div className="superadmin-terms-edit-top">
                        <input
                          type="text"
                          value={`${index + 1}. ${section.title}`}
                          onChange={(e) =>
                            handleSectionChange(
                              section.id,
                              "title",
                              stripLeadingNumber(e.target.value)
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
                        rows={5}
                        placeholder="Enter section content"
                      />
                    </>
                  ) : (
                    <>
                      <h3>
                        {index + 1}. {section.title}
                      </h3>
                      <p>{section.content}</p>
                    </>
                  )}
                </div>
              ))}
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