import { useEffect, useMemo, useState } from "react";
import SuperAdminSidebar from "../../components/superadmin/layout/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/layout/SuperAdminTopbar";

import "../../styles/admin/layout/admin-sidebar.css";
import "../../styles/admin/layout/admin-topbar.css";
import "../../styles/admin/notifications/admin-notification-popup.css";
import "../../styles/admin/shared/admin-responsive.css";
import "../../styles/superadmin/shared/superadmin-responsive.css";
import "../../styles/superadmin/shared/superadmin-tooth-questions.css";

const STORAGE_KEY = "superadmin_general_tooth_questions";

const DEFAULT_QUESTIONS = [
  "Do you feel pain or discomfort in the selected tooth?",
  "Is the tooth sensitive to cold drinks, hot drinks, or sweets?",
  "Do you feel pain when biting or chewing using this tooth?",
  "Is there swelling, redness, or bleeding around the gum near this tooth?",
  "Do you notice a hole, dark spot, crack, or broken part on this tooth?",
  "Does food often get stuck around this tooth?",
  "Does the tooth feel loose or weak?",
  "Was this tooth recently hit, chipped, or damaged?",
  "Do you notice a bad taste or bad smell near this tooth?",
  "Does the pain spread to nearby teeth, jaw, ear, or head?",
];

export default function SuperAdminToothQuestions() {
  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS);
  const [draftQuestions, setDraftQuestions] = useState(DEFAULT_QUESTIONS);
  const [isEditMode, setIsEditMode] = useState(false);

  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        setQuestions(parsed);
        setDraftQuestions(parsed);
      }
    } catch (error) {
      console.error("Failed to parse saved tooth questions.", error);
    }
  }, []);

  const totalQuestions = useMemo(() => questions.length, [questions]);

  const handleEditQuestions = () => {
    setDraftQuestions([...questions]);
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setDraftQuestions([...questions]);
    setIsEditMode(false);
  };

  const handleDraftQuestionChange = (index, value) => {
    setDraftQuestions((prev) =>
      prev.map((item, idx) => (idx === index ? value : item))
    );
  };

  const handleRemoveQuestion = (index) => {
    setDraftQuestions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveQuestions = () => {
    const cleanedQuestions = draftQuestions
      .map((item) => item.trim())
      .filter(Boolean);

    setQuestions(cleanedQuestions);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedQuestions));
    setIsEditMode(false);
  };

  const handleOpenAddQuestionModal = () => {
    setNewQuestion("");
    setIsAddQuestionModalOpen(true);
  };

  const handleCloseAddQuestionModal = () => {
    setIsAddQuestionModalOpen(false);
    setNewQuestion("");
  };

  const handleConfirmAddQuestion = () => {
    if (!newQuestion.trim()) {
      alert("Please enter a question.");
      return;
    }

    setDraftQuestions((prev) => [newQuestion.trim(), ...prev]);
    handleCloseAddQuestionModal();
  };

  return (
    <div className="admin-dashboard-page">
      <SuperAdminSidebar />

      <main className="admin-main-content">
        <SuperAdminTopbar title="Tooth Questions" />

        <div className="superadmin-tooth-page-scrollfix">
          <div className="superadmin-tooth-page">
            <section className="superadmin-tooth-hero">
              <div>
                <h2>Tooth Pre-Assessment Questions</h2>
                <p>
                  Manage one general set of questions that will be used for all
                  selected teeth in the patient pre-assessment.
                </p>
              </div>

              <div className="superadmin-tooth-summary-card">
                <span>Total Questions</span>
                <h3>{totalQuestions}</h3>
              </div>
            </section>

            <section className="superadmin-tooth-questions-card">
              <div className="superadmin-tooth-card-head superadmin-tooth-card-head-row">
                <div>
                  <h3>General Tooth Questions</h3>
                  <p>
                    These questions apply to all teeth, so the admin no longer
                    needs to select a specific tooth.
                  </p>
                </div>

                <div className="superadmin-tooth-actions">
                  {!isEditMode ? (
                    <button
                      type="button"
                      className="superadmin-tooth-action-btn edit-btn"
                      onClick={handleEditQuestions}
                    >
                      Edit Questions
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="superadmin-tooth-action-btn secondary-btn"
                        onClick={handleOpenAddQuestionModal}
                      >
                        Add Question
                      </button>

                      <button
                        type="button"
                        className="superadmin-tooth-action-btn cancel-btn"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        className="superadmin-tooth-action-btn save-btn"
                        onClick={handleSaveQuestions}
                      >
                        Save Questions
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="superadmin-tooth-question-list">
                {!isEditMode ? (
                  questions.length > 0 ? (
                    questions.map((question, index) => (
                      <div
                        className="superadmin-tooth-question-item"
                        key={`question-${index}`}
                      >
                        <div className="superadmin-tooth-question-content no-number">
                          <p>{question}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="superadmin-tooth-empty-state">
                      No questions available.
                    </div>
                  )
                ) : draftQuestions.length > 0 ? (
                  draftQuestions.map((question, index) => (
                    <div
                      className="superadmin-tooth-question-item edit-mode"
                      key={`draft-question-${index}`}
                    >
                      <div className="superadmin-tooth-question-edit-wrap no-number">
                        <label>Question</label>
                        <textarea
                          value={question}
                          onChange={(e) =>
                            handleDraftQuestionChange(index, e.target.value)
                          }
                          rows={3}
                          className="superadmin-tooth-question-textarea"
                        />
                      </div>

                      <button
                        type="button"
                        className="superadmin-tooth-remove-btn"
                        onClick={() => handleRemoveQuestion(index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="superadmin-tooth-empty-state">
                    No draft questions yet.
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {isAddQuestionModalOpen && (
          <div
            className="superadmin-shared-modal-overlay"
            onClick={handleCloseAddQuestionModal}
          >
            <div
              className="superadmin-shared-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="superadmin-shared-modal-top">
                <div>
                  <h3>Add Question</h3>
                  <p>Add a new general question for all teeth.</p>
                </div>

                <button
                  type="button"
                  className="superadmin-shared-modal-close"
                  onClick={handleCloseAddQuestionModal}
                >
                  ✕
                </button>
              </div>

              <div className="superadmin-shared-modal-body">
                <div className="superadmin-shared-field">
                  <label>Question</label>
                  <textarea
                    rows={5}
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Enter question"
                  />
                </div>
              </div>

              <div className="superadmin-shared-modal-actions">
                <button
                  type="button"
                  className="superadmin-shared-btn secondary"
                  onClick={handleCloseAddQuestionModal}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="superadmin-shared-btn primary"
                  onClick={handleConfirmAddQuestion}
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