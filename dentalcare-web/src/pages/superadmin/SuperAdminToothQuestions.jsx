import { useEffect, useMemo, useState } from "react";
import SuperAdminSidebar from "../../components/superadmin/layout/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/layout/SuperAdminTopbar";

import "../../styles/admin/layout/admin-sidebar.css";
import "../../styles/admin/layout/admin-topbar.css";
import "../../styles/admin/notifications/admin-notification-popup.css";
import "../../styles/admin/shared/admin-responsive.css";
import "../../styles/superadmin/shared/superadmin-responsive.css";
import "../../styles/superadmin/shared/superadmin-tooth-questions.css";

import {
  getSuperAdminQuestionnaire,
  createSuperAdminQuestionnaire,
  updateSuperAdminQuestionnaire,
  deleteSuperAdminQuestionnaire,
} from "../../services/superAdminService";

export default function SuperAdminToothQuestions() {
  const [questions, setQuestions] = useState([]);
  const [draftQuestions, setDraftQuestions] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);

  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newOptions, setNewOptions] = useState([""]);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const totalQuestions = useMemo(() => questions.length, [questions]);

  const formatQuestions = (data) => {
    return (Array.isArray(data) ? data : data?.data || []).map((item) => ({
      id: item.id,
      question: item.question_text,
      options: Array.isArray(item.options) ? item.options : [],
      question_order: item.question_order,
    }));
  };

  const fetchQuestions = async () => {
    try {
      const result = await getSuperAdminQuestionnaire();

      if (result?.success === false) {
        throw new Error(result.message || "Failed to fetch questions.");
      }

      const formattedQuestions = formatQuestions(result);

      setQuestions(formattedQuestions);
      setDraftQuestions(formattedQuestions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      alert("Failed to load questions.");
    }
  };

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
      prev.map((item, idx) =>
        idx === index ? { ...item, question: value } : item
      )
    );
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    setDraftQuestions((prev) =>
      prev.map((item, idx) => {
        if (idx !== questionIndex) return item;

        const updatedOptions = [...item.options];
        updatedOptions[optionIndex] = value;

        return {
          ...item,
          options: updatedOptions,
        };
      })
    );
  };

  const handleAddOption = (questionIndex) => {
    setDraftQuestions((prev) =>
      prev.map((item, idx) =>
        idx === questionIndex
          ? { ...item, options: [...item.options, ""] }
          : item
      )
    );
  };

  const handleRemoveOption = (questionIndex, optionIndex) => {
    setDraftQuestions((prev) =>
      prev.map((item, idx) => {
        if (idx !== questionIndex) return item;

        return {
          ...item,
          options: item.options.filter((_, optIdx) => optIdx !== optionIndex),
        };
      })
    );
  };

  const handleRemoveQuestion = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to remove this question?"
    );

    if (!confirmDelete) return;

    try {
      const result = await deleteSuperAdminQuestionnaire(id);

      if (result?.success === false) {
        throw new Error(result.message || "Failed to delete question.");
      }

      fetchQuestions();
    } catch (error) {
      console.error("Error deleting question:", error);
      alert("Failed to remove question.");
    }
  };

  const handleSaveQuestions = async () => {
    try {
      for (const item of draftQuestions) {
        if (!item.question.trim()) {
          alert("Question cannot be empty.");
          return;
        }

        const cleanedOptions = item.options
          .map((option) => option.trim())
          .filter(Boolean);

        if (cleanedOptions.length === 0) {
          alert("Each question must have at least one option.");
          return;
        }

        const result = await updateSuperAdminQuestionnaire(item.id, {
          question_text: item.question.trim(),
          options: cleanedOptions,
        });

        if (result?.success === false) {
          throw new Error(result.message || "Failed to update question.");
        }
      }

      setIsEditMode(false);
      fetchQuestions();
    } catch (error) {
      console.error("Error saving questions:", error);
      alert("Failed to save questions.");
    }
  };

  const handleOpenAddQuestionModal = () => {
    setNewQuestion("");
    setNewOptions([""]);
    setIsAddQuestionModalOpen(true);
  };

  const handleCloseAddQuestionModal = () => {
    setIsAddQuestionModalOpen(false);
    setNewQuestion("");
    setNewOptions([""]);
  };

  const handleConfirmAddQuestion = async () => {
    if (!newQuestion.trim()) {
      alert("Please enter a question.");
      return;
    }

    const cleanedOptions = newOptions.map((item) => item.trim()).filter(Boolean);

    if (cleanedOptions.length === 0) {
      alert("Please add at least one option.");
      return;
    }

    try {
      const result = await createSuperAdminQuestionnaire({
        question_text: newQuestion.trim(),
        options: cleanedOptions,
        question_order: questions.length + 1,
      });

      if (result?.success === false) {
        throw new Error(result.message || "Failed to add question.");
      }

      setNewQuestion("");
      setNewOptions([""]);
      setIsAddQuestionModalOpen(false);
      fetchQuestions();
    } catch (error) {
      console.error("Error adding question:", error);
      alert("Failed to add question.");
    }
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
                  Manage one general set of questions and answer options that
                  will be used for all selected teeth in the patient
                  pre-assessment.
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
                    These questions apply to all teeth. Admin can also manage
                    the options for each question.
                  </p>
                </div>

                <div className="superadmin-tooth-actions">
                  {!isEditMode ? (
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
                        className="superadmin-tooth-action-btn edit-btn"
                        onClick={handleEditQuestions}
                      >
                        Edit Questions
                      </button>
                    </>
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
                        key={question.id || `question-${index}`}
                      >
                        <div className="superadmin-tooth-question-content no-number">
                          <span className="superadmin-question-count">
                            Question {index + 1}
                          </span>

                          <p>{question.question}</p>

                          <div className="superadmin-question-options">
                            {question.options?.length > 0 ? (
                              question.options.map((option, optionIndex) => (
                                <span
                                  key={optionIndex}
                                  className="superadmin-question-option-chip"
                                >
                                  {option}
                                </span>
                              ))
                            ) : (
                              <span className="superadmin-question-no-options">
                                No options available
                              </span>
                            )}
                          </div>
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
                      key={question.id || `draft-question-${index}`}
                    >
                      <div className="superadmin-tooth-question-edit-wrap no-number">
                        <label>Question</label>

                        <textarea
                          value={question.question}
                          onChange={(e) =>
                            handleDraftQuestionChange(index, e.target.value)
                          }
                          rows={3}
                          className="superadmin-tooth-question-textarea"
                        />

                        <div className="superadmin-options-edit-wrap">
                          <label>Options</label>

                          {question.options.map((option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className="superadmin-option-input-row"
                            >
                              <input
                                type="text"
                                value={option}
                                onChange={(e) =>
                                  handleOptionChange(
                                    index,
                                    optionIndex,
                                    e.target.value
                                  )
                                }
                                placeholder={`Option ${optionIndex + 1}`}
                              />

                              <button
                                type="button"
                                className="superadmin-option-remove-btn"
                                onClick={() =>
                                  handleRemoveOption(index, optionIndex)
                                }
                              >
                                Remove
                              </button>
                            </div>
                          ))}

                          <button
                            type="button"
                            className="superadmin-add-option-btn"
                            onClick={() => handleAddOption(index)}
                          >
                            Add Option
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="superadmin-tooth-remove-btn"
                        onClick={() => handleRemoveQuestion(question.id)}
                      >
                        Remove Question
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
                  <p>Add a new general question with answer options.</p>
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

                <div className="superadmin-shared-field">
                  <label>Options</label>

                  {newOptions.map((option, index) => (
                    <div key={index} className="superadmin-option-input-row">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const updatedOptions = [...newOptions];
                          updatedOptions[index] = e.target.value;
                          setNewOptions(updatedOptions);
                        }}
                        placeholder={`Option ${index + 1}`}
                      />

                      <button
                        type="button"
                        className="superadmin-option-remove-btn"
                        onClick={() => {
                          if (newOptions.length === 1) {
                            setNewOptions([""]);
                            return;
                          }

                          setNewOptions((prev) =>
                            prev.filter((_, idx) => idx !== index)
                          );
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="superadmin-add-option-btn"
                    onClick={() => setNewOptions((prev) => [...prev, ""])}
                  >
                    Add Option
                  </button>
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