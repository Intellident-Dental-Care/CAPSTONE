import React, { useEffect, useRef, useState } from "react";
import PreAssessmentQAList from "./PreAssessmentQAList";
import SuggestedProcedureCard from "./SuggestedProcedureCard";

export default function PreAssessmentModal({
  open,
  onClose,
  data,
  onAddProcedure,
  showAddProcedure = true,
}) {
  const iframeRef = useRef(null);
  
  // Track the tooth locally so if the dentist clicks a different tooth, it updates the UI
  const [localTooth, setLocalTooth] = useState("Not specified");

  // Sync local tooth when the modal first opens or data changes
  useEffect(() => {
    setLocalTooth(data?.tooth || "Not specified");
  }, [data]);

  // Listen for the dentist clicking around inside the 3D model
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'TOOTH_SELECTED') {
        setLocalTooth(event.data.tooth);
      } else if (event.data?.type === 'SELECTION_CLEARED') {
        setLocalTooth("Not specified");
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // When the 3D iframe finishes loading, immediately tell it to select the patient's tooth
  const handleIframeLoad = () => {
    if (data?.tooth && data.tooth !== "Not specified" && iframeRef.current) {
      iframeRef.current.contentWindow.postMessage({ type: 'SELECT_TOOTH', tooth: data.tooth }, '*');
    }
  };

  if (!open || !data) return null;

  const {
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
            {/* Replaced static image with the interactive 3D model iframe */}
            <div className="preassessment-image-wrap" style={{ position: 'relative', width: '100%', height: '300px', overflow: 'hidden', borderRadius: '8px' }}>
              <iframe
                ref={iframeRef}
                onLoad={handleIframeLoad}
                src="https://intellident-3d-viewer.vercel.app/"
                title="IntelliDent 3D Viewer"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>

            <p className="preassessment-tooth">
              <strong>Tooth:</strong> {localTooth}
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
                  onClick={() => onAddProcedure?.({ ...data, tooth: localTooth })}
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