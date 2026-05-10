import { useEffect, useMemo, useState } from "react";
import SuperAdminSidebar from "../../components/superadmin/layout/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/layout/SuperAdminTopbar";

import "../../styles/admin/layout/admin-sidebar.css";
import "../../styles/admin/layout/admin-topbar.css";
import "../../styles/admin/notifications/admin-notification-popup.css";
import "../../styles/admin/shared/admin-responsive.css";
import "../../styles/superadmin/shared/superadmin-responsive.css";
import "../../styles/superadmin/shared/superadmin-tooth-questions.css";

const STORAGE_KEY = "superadmin_tooth_questions_map";

const TOOTH_OPTIONS = [
  { id: "11", name: "Upper Right Central Incisor" },
  { id: "12", name: "Upper Right Lateral Incisor" },
  { id: "13", name: "Upper Right Canine / Cuspid" },
  { id: "14", name: "Upper Right First Premolar" },
  { id: "15", name: "Upper Right Second Premolar" },
  { id: "16", name: "Upper Right First Molar" },
  { id: "17", name: "Upper Right Second Molar" },
  { id: "18", name: "Upper Right Wisdom Tooth / Third Molar" },

  { id: "21", name: "Upper Left Central Incisor" },
  { id: "22", name: "Upper Left Lateral Incisor" },
  { id: "23", name: "Upper Left Canine / Cuspid" },
  { id: "24", name: "Upper Left First Premolar" },
  { id: "25", name: "Upper Left Second Premolar" },
  { id: "26", name: "Upper Left First Molar" },
  { id: "27", name: "Upper Left Second Molar" },
  { id: "28", name: "Upper Left Wisdom Tooth / Third Molar" },

  { id: "31", name: "Lower Left Central Incisor" },
  { id: "32", name: "Lower Left Lateral Incisor" },
  { id: "33", name: "Lower Left Canine / Cuspid" },
  { id: "34", name: "Lower Left First Premolar" },
  { id: "35", name: "Lower Left Second Premolar" },
  { id: "36", name: "Lower Left First Molar" },
  { id: "37", name: "Lower Left Second Molar" },
  { id: "38", name: "Lower Left Wisdom Tooth / Third Molar" },

  { id: "41", name: "Lower Right Central Incisor" },
  { id: "42", name: "Lower Right Lateral Incisor" },
  { id: "43", name: "Lower Right Canine / Cuspid" },
  { id: "44", name: "Lower Right First Premolar" },
  { id: "45", name: "Lower Right Second Premolar" },
  { id: "46", name: "Lower Right First Molar" },
  { id: "47", name: "Lower Right Second Molar" },
  { id: "48", name: "Lower Right Wisdom Tooth / Third Molar" },
];

const TOOTH_LABELS = Object.fromEntries(
  TOOTH_OPTIONS.map((item) => [item.id, item.name])
);

function buildDefaultQuestions() {
  return {
    11: [
      "Do you feel pain in the upper right front central tooth when biting?",
      "Was this tooth recently hit, chipped, or cracked?",
      "Do you notice darkening or discoloration in this tooth?",
      "Is this tooth sensitive to cold drinks or sweets?",
      "Do you feel discomfort when smiling or speaking?",
    ],
    12: [
      "Do you feel pain in the upper right lateral incisor when touching it?",
      "Is the tooth edge chipped or rough?",
      "Do cold drinks cause discomfort in this tooth?",
      "Is there gum swelling beside this tooth?",
      "Do you feel this tooth has become loose or weak?",
    ],
    13: [
      "Do you feel pain in the upper right canine when tearing food?",
      "Is this tooth sore when you brush around it?",
      "Do you feel pressure near the gum line of this canine?",
      "Do you grind or clench your teeth and feel pain here?",
      "Is there swelling or redness around this tooth?",
    ],
    14: [
      "Do you feel pain in the upper right first premolar when chewing?",
      "Is this tooth sensitive to hot, cold, or sweet foods?",
      "Does food get stuck around this tooth often?",
      "Do you notice a hole or cavity in this premolar?",
      "Does biting on this side feel uncomfortable?",
    ],
    15: [
      "Do you feel pain in the upper right second premolar during chewing?",
      "Does sensitivity remain even after eating or drinking?",
      "Is the tooth tender when tapped or pressed?",
      "Do you notice gum soreness around this area?",
      "Does the pain spread to nearby teeth?",
    ],
    16: [
      "Do you have strong chewing pain in the upper right first molar?",
      "Do you think there is a broken filling or cavity here?",
      "Does food frequently get trapped in this molar?",
      "Do hot or cold foods trigger pain in this tooth?",
      "Does this pain spread toward the jaw or temple?",
      "Do you feel pressure when biting down on this molar?",
    ],
    17: [
      "Do you feel discomfort in the upper right second molar while chewing?",
      "Is it difficult to brush or clean this tooth properly?",
      "Do you notice a bad taste near this molar?",
      "Is the gum around this tooth swollen or tender?",
      "Do you feel pain when opening your mouth wide?",
    ],
    18: [
      "Is the upper right wisdom tooth partially erupted?",
      "Do you feel swelling at the back of the mouth on this side?",
      "Does chewing cause pain in this wisdom tooth area?",
      "Is food often trapped around this tooth?",
      "Do you notice jaw pressure or headache from this side?",
      "Is the gum around this wisdom tooth red or inflamed?",
    ],
    21: [
      "Do you feel pain in the upper left front central tooth when biting?",
      "Was this tooth recently hit, chipped, or cracked?",
      "Do you notice darkening or discoloration in this tooth?",
      "Is this tooth sensitive to cold drinks or sweets?",
      "Do you feel discomfort when smiling or speaking?",
    ],
    22: [
      "Do you feel pain in the upper left lateral incisor when touching it?",
      "Is the tooth edge chipped or rough?",
      "Do cold drinks cause discomfort in this tooth?",
      "Is there gum swelling beside this tooth?",
      "Do you feel this tooth has become loose or weak?",
    ],
    23: [
      "Do you feel pain in the upper left canine when tearing food?",
      "Is this tooth sore when you brush around it?",
      "Do you feel pressure near the gum line of this canine?",
      "Do you grind or clench your teeth and feel pain here?",
      "Is there swelling or redness around this tooth?",
    ],
    24: [
      "Do you feel pain in the upper left first premolar when chewing?",
      "Is this tooth sensitive to hot, cold, or sweet foods?",
      "Does food get stuck around this tooth often?",
      "Do you notice a hole or cavity in this premolar?",
      "Does biting on this side feel uncomfortable?",
    ],
    25: [
      "Do you feel pain in the upper left second premolar during chewing?",
      "Does sensitivity remain even after eating or drinking?",
      "Is the tooth tender when tapped or pressed?",
      "Do you notice gum soreness around this area?",
      "Does the pain spread to nearby teeth?",
    ],
    26: [
      "Do you have strong chewing pain in the upper left first molar?",
      "Do you think there is a broken filling or cavity here?",
      "Does food frequently get trapped in this molar?",
      "Do hot or cold foods trigger pain in this tooth?",
      "Does this pain spread toward the jaw or temple?",
      "Do you feel pressure when biting down on this molar?",
    ],
    27: [
      "Do you feel discomfort in the upper left second molar while chewing?",
      "Is it difficult to brush or clean this tooth properly?",
      "Do you notice a bad taste near this molar?",
      "Is the gum around this tooth swollen or tender?",
      "Do you feel pain when opening your mouth wide?",
    ],
    28: [
      "Is the upper left wisdom tooth partially erupted?",
      "Do you feel swelling at the back of the mouth on this side?",
      "Does chewing cause pain in this wisdom tooth area?",
      "Is food often trapped around this tooth?",
      "Do you notice jaw pressure or headache from this side?",
      "Is the gum around this wisdom tooth red or inflamed?",
    ],
    31: [
      "Do you feel pain in the lower left front central tooth when biting?",
      "Is this tooth chipped, cracked, or worn down?",
      "Do cold drinks or sweets cause sensitivity in this tooth?",
      "Do you notice gum irritation in front of this tooth?",
      "Does this tooth feel loose or weak?",
    ],
    32: [
      "Do you feel pain in the lower left lateral incisor when touching it?",
      "Is the tooth edge rough or damaged?",
      "Do you feel sensitivity when drinking something cold?",
      "Is there swelling in the gum beside this tooth?",
      "Do you feel discomfort while brushing here?",
    ],
    33: [
      "Do you feel pain in the lower left canine while tearing food?",
      "Is there soreness near the gum around this tooth?",
      "Do you feel pressure in this canine when biting?",
      "Do you clench your teeth and feel pain here?",
      "Is the gum red or swollen in this area?",
    ],
    34: [
      "Do you feel pain in the lower left first premolar while chewing?",
      "Is this tooth sensitive to hot, cold, or sweets?",
      "Does food get stuck around this premolar often?",
      "Do you notice a cavity or dark area on this tooth?",
      "Does biting make this tooth hurt more?",
    ],
    35: [
      "Do you feel pain in the lower left second premolar during chewing?",
      "Does sensitivity stay even after the trigger is gone?",
      "Is the tooth sore when tapped or pressed?",
      "Do you feel gum soreness near this tooth?",
      "Does the pain spread to nearby teeth or jaw?",
    ],
    36: [
      "Do you have strong chewing pain in the lower left first molar?",
      "Do you think there is a cavity, broken filling, or crack here?",
      "Does food get trapped in this molar often?",
      "Do hot or cold foods trigger pain here?",
      "Does the pain spread toward the jaw or ear?",
      "Do you feel pressure when biting hard on this tooth?",
    ],
    37: [
      "Do you feel discomfort in the lower left second molar when chewing?",
      "Is it hard to clean this tooth properly?",
      "Do you notice gum tenderness or bad taste near this area?",
      "Does opening the mouth wide make it hurt?",
      "Has this tooth caused repeated pain before?",
    ],
    38: [
      "Is the lower left wisdom tooth partially erupted?",
      "Do you feel swelling at the back of the mouth on this side?",
      "Does chewing or opening wide cause pain here?",
      "Is food often trapped around this wisdom tooth?",
      "Do you feel jaw pain or pressure from this area?",
      "Is the gum around this tooth inflamed or red?",
    ],
    41: [
      "Do you feel pain in the lower right front central tooth when biting?",
      "Is this tooth chipped, cracked, or worn down?",
      "Do cold drinks or sweets cause sensitivity in this tooth?",
      "Do you notice gum irritation in front of this tooth?",
      "Does this tooth feel loose or weak?",
    ],
    42: [
      "Do you feel pain in the lower right lateral incisor when touching it?",
      "Is the tooth edge rough or damaged?",
      "Do you feel sensitivity when drinking something cold?",
      "Is there swelling in the gum beside this tooth?",
      "Do you feel discomfort while brushing here?",
    ],
    43: [
      "Do you feel pain in the lower right canine while tearing food?",
      "Is there soreness near the gum around this tooth?",
      "Do you feel pressure in this canine when biting?",
      "Do you clench your teeth and feel pain here?",
      "Is the gum red or swollen in this area?",
    ],
    44: [
      "Do you feel pain in the lower right first premolar while chewing?",
      "Is this tooth sensitive to hot, cold, or sweets?",
      "Does food get stuck around this premolar often?",
      "Do you notice a cavity or dark area on this tooth?",
      "Does biting make this tooth hurt more?",
    ],
    45: [
      "Do you feel pain in the lower right second premolar during chewing?",
      "Does sensitivity stay even after the trigger is gone?",
      "Is the tooth sore when tapped or pressed?",
      "Do you feel gum soreness near this tooth?",
      "Does the pain spread to nearby teeth or jaw?",
    ],
    46: [
      "Do you have strong chewing pain in the lower right first molar?",
      "Do you think there is a cavity, broken filling, or crack here?",
      "Does food get trapped in this molar often?",
      "Do hot or cold foods trigger pain here?",
      "Does the pain spread toward the jaw or ear?",
      "Do you feel pressure when biting hard on this tooth?",
    ],
    47: [
      "Do you feel discomfort in the lower right second molar when chewing?",
      "Is it hard to clean this tooth properly?",
      "Do you notice gum tenderness or bad taste near this area?",
      "Does opening the mouth wide make it hurt?",
      "Has this tooth caused repeated pain before?",
    ],
    48: [
      "Is the lower right wisdom tooth partially erupted?",
      "Do you feel swelling at the back of the mouth on this side?",
      "Does chewing or opening wide cause pain here?",
      "Is food often trapped around this wisdom tooth?",
      "Do you feel jaw pain or pressure from this area?",
      "Is the gum around this tooth inflamed or red?",
    ],
  };
}

export default function SuperAdminToothQuestions() {
  const [selectedTooth, setSelectedTooth] = useState("11");
  const [questionsMap, setQuestionsMap] = useState(buildDefaultQuestions());
  const [draftQuestions, setDraftQuestions] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);

  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") {
        setQuestionsMap(parsed);
      }
    } catch (error) {
      console.error("Failed to parse saved tooth questions.", error);
    }
  }, []);

  useEffect(() => {
    setDraftQuestions([...(questionsMap[selectedTooth] || [])]);
  }, [selectedTooth, questionsMap]);

  const selectedQuestions = useMemo(
    () => questionsMap[selectedTooth] || [],
    [questionsMap, selectedTooth]
  );

  const handleEditQuestions = () => {
    setDraftQuestions([...(questionsMap[selectedTooth] || [])]);
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setDraftQuestions([...(questionsMap[selectedTooth] || [])]);
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

    const updated = {
      ...questionsMap,
      [selectedTooth]: cleanedQuestions,
    };

    setQuestionsMap(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
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
                <h2>Tooth-Based Pre-Assessment Questions</h2>
                <p>
                  Every tooth has its own editable question set. Select a tooth
                  from the dropdown to review or update its questions.
                </p>
              </div>

              <div className="superadmin-tooth-summary-card">
                <span>Selected Tooth</span>
                <h3>{TOOTH_LABELS[selectedTooth]}</h3>
              </div>
            </section>

            <section className="superadmin-tooth-top-filter">
              <div className="superadmin-tooth-dropdown-wrap">
                <label>Select Tooth</label>
                <select
                  value={selectedTooth}
                  onChange={(e) => {
                    setSelectedTooth(e.target.value);
                    setIsEditMode(false);
                  }}
                  className="superadmin-tooth-dropdown"
                >
                  {TOOTH_OPTIONS.map((tooth) => (
                    <option key={tooth.id} value={tooth.id}>
                      {tooth.name}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <section className="superadmin-tooth-questions-card">
              <div className="superadmin-tooth-card-head superadmin-tooth-card-head-row">
                <div>
                  <h3>{TOOTH_LABELS[selectedTooth]}</h3>
                  <p>Admin-editable questions for this specific tooth only.</p>
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
                  selectedQuestions.length > 0 ? (
                    selectedQuestions.map((question, index) => (
                      <div
                        className="superadmin-tooth-question-item"
                        key={`${selectedTooth}-${index}`}
                      >
                        <div className="superadmin-tooth-question-content no-number">
                          <p>{question}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="superadmin-tooth-empty-state">
                      No questions available for this tooth.
                    </div>
                  )
                ) : draftQuestions.length > 0 ? (
                  draftQuestions.map((question, index) => (
                    <div
                      className="superadmin-tooth-question-item edit-mode"
                      key={`${selectedTooth}-draft-${index}`}
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
                    No draft questions yet for this tooth.
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
                  <h3>Add Tooth Question</h3>
                  <p>Add a new question for {TOOTH_LABELS[selectedTooth]}.</p>
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