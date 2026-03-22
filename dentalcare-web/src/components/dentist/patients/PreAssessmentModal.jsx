import toothModel from "../../../assets/tooth_model.png";
import PreAssessmentQAList from "./PreAssessmentQAList";
import SuggestedProcedureCard from "./SuggestedProcedureCard";

export default function PreAssessmentModal({
  open,
  onClose,
  data,
  onAddProcedure,
  showAddProcedure = true,
}) {
  if (!open || !data) return null;

  const {
    tooth,
    uploadedPhotos = [],
    questions = [],
    suggestedTreatment,
    suggestedPrice,
  } = data;

  return (
    <div className="preassessment-overlay" onClick={onClose}>
      <div
        className="preassessment-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="preassessment-back-btn"
          onClick={onClose}
        >
          ‹
        </button>

        <div className="preassessment-content">
          <div className="preassessment-left">
            <div className="preassessment-image-wrap">
              <img
                src={toothModel}
                alt="Tooth Model"
                className="preassessment-image"
              />
            </div>

            <p className="preassessment-tooth">
              <strong>Tooth:</strong> {tooth || "Not specified"}
            </p>
          </div>

          <div className="preassessment-right">
            <h2 className="preassessment-title">PRE-ASSESSMENT RESULT</h2>
            <h3 className="preassessment-subtitle">
              Summary of Pre Assessment
            </h3>

            <PreAssessmentQAList questions={questions} />

            <div className="uploaded-photos-section">
              <p className="uploaded-photos-label">Uploaded Photos</p>

              <div className="uploaded-photos-grid">
                {uploadedPhotos.length > 0 ? (
                  uploadedPhotos.map((photo, index) => (
                    <div className="uploaded-photo-card" key={index}>
                      <img
                        src={photo}
                        alt={`Uploaded ${index + 1}`}
                        className="uploaded-photo-img"
                      />
                    </div>
                  ))
                ) : (
                  <div className="uploaded-photo-empty">
                    No uploaded photos available.
                  </div>
                )}
              </div>
            </div>

            <SuggestedProcedureCard
              treatment={suggestedTreatment}
              price={suggestedPrice}
            />

            {showAddProcedure && (
              <div className="preassessment-actions">
                <button
                  type="button"
                  className="add-procedure-btn"
                  onClick={() => onAddProcedure?.(data)}
                >
                  Add Procedure
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}