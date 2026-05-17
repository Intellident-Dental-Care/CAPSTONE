import React, { useEffect, useRef, useState } from "react";
import PreAssessmentQAList from "./PreAssessmentQAList";
import SuggestedProcedureCard from "./SuggestedProcedureCard";
import { getSecureImageBlob } from "../../../services/dentistService";

const SecureImage = ({ imagePath, index }) => {
  const [blobUrl, setBlobUrl] = useState(null);

  useEffect(() => {
    let active = true;
    
    const loadBlob = async () => {
      const url = await getSecureImageBlob(imagePath);
      if (active && url) setBlobUrl(url);
    };

    loadBlob();

    return () => {
      active = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [imagePath]);

  if (!blobUrl) {
    return (
      <div className="uploaded-photo-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0', width: '160px', height: '160px', borderRadius: '10px' }}>
        <span style={{ fontSize: '12px', color: '#888', fontWeight: '500' }}>Loading...</span>
      </div>
    );
  }

  return (
    <div className="uploaded-photo-card">
      <a href={blobUrl} target="_blank" rel="noopener noreferrer">
        <img
          src={blobUrl}
          alt={`Uploaded ${index + 1}`}
          className="uploaded-photo-img"
          style={{ 
            width: "160px", 
            height: "160px", 
            objectFit: "cover", 
            borderRadius: "10px", 
            border: "1px solid #e0e0e0",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
          }}
        />
      </a>
    </div>
  );
};

export default function PreAssessmentModal({
  open,
  onClose,
  data,
  onAddProcedure,
  showAddProcedure = true,
}) {
  const iframeRef = useRef(null);
  const [localTooth, setLocalTooth] = useState("Not specified");

  useEffect(() => {
    setLocalTooth(data?.tooth || "Not specified");
  }, [data]);

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

  const handleIframeLoad = () => {
    if (data?.tooth && data.tooth !== "Not specified" && iframeRef.current) {
      iframeRef.current.contentWindow.postMessage({ type: 'SELECT_TOOTH', tooth: data.tooth }, '*');
    }
  };

  useEffect(() => {
    if (!open || !iframeRef.current) return;
    if (!data?.tooth || data.tooth === "Not specified") return;

    iframeRef.current.contentWindow.postMessage({ type: 'SELECT_TOOTH', tooth: data.tooth }, '*');
  }, [open, data?.tooth]);

  if (!open || !data) return null;

  const {
    uploadedPhotos = [],
    questions = [],
    suggestedTreatment,
    suggestedPrice,
    description,
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

            <div style={{ marginTop: '16px', marginBottom: '16px' }}>
              <p className="uploaded-photos-label">Patient Description</p>
              <div style={{ 
                backgroundColor: '#f9f9f9', 
                padding: '12px 16px', 
                borderRadius: '8px', 
                border: '1px solid #efefef',
                color: '#555',
                fontSize: '13px',
                lineHeight: '1.6',
                marginTop: '8px'
              }}>
                {description || "No additional description provided."}
              </div>
            </div>

            <div className="uploaded-photos-section">
              <p className="uploaded-photos-label">Uploaded Photos</p>

              <div className="uploaded-photos-grid" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '10px' }}>
                {uploadedPhotos.length > 0 ? (
                  uploadedPhotos.map((path, index) => (
                    <SecureImage key={index} imagePath={path} index={index} />
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