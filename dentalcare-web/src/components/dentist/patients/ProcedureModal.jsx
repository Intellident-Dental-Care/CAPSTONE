import { useState, useEffect, useRef } from "react";

const SERVICE_OPTIONS = [
  "Cleaning",
  "Tooth Extraction",
  "Dental Filling",
  "Root Canal Treatment",
  "Braces Adjustment",
  "Tooth Restoration",
  "Teeth Whitening",
  "Oral Prophylaxis",
  "Dentures",
  "Consultation",
];

export default function ProcedureModal({
  open,
  onClose,
  onSave,
  tooth,
  isSaving = false,
}) {
  const [selectedService, setSelectedService] = useState("Restoration");
  const [remarks, setRemarks] = useState("");
  const [beforePhoto, setBeforePhoto] = useState(null);
  const [afterPhoto, setAfterPhoto] = useState(null);

  // --- NEW 3D MODEL SYNC LOGIC ---
  const iframeRef = useRef(null);
  const [localTooth, setLocalTooth] = useState("Not specified");

  // Sync local tooth when the modal first opens or the incoming tooth prop changes
  useEffect(() => {
    setLocalTooth(tooth || "Not specified");
  }, [tooth]);

  // Listen for the dentist clicking a NEW tooth inside the Procedure Modal's 3D model
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

  // When the 3D iframe loads, tell it to select the tooth that was passed down
  const handleIframeLoad = () => {
    if (tooth && tooth !== "Not specified" && iframeRef.current) {
      iframeRef.current.contentWindow.postMessage({ type: 'SELECT_TOOTH', tooth: tooth }, '*');
    }
  };
  // -------------------------------

  if (!open) return null;

  const safeClose = () => {
    if (isSaving) return;
    onClose?.();
  };

  const handleFileChange = (event, type) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    if (type === "before") {
      setBeforePhoto(previewUrl);
    } else {
      setAfterPhoto(previewUrl);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;

    const payload = {
      service: selectedService,
      remarks,
      beforePhoto,
      afterPhoto,
      // Pass the locally selected tooth, in case they changed it!
      tooth: localTooth, 
    };

    await onSave?.(payload);
  };

  return (
    <div className="procedure-overlay" onClick={safeClose}>
      <div
        className="procedure-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="procedure-back-btn"
          onClick={safeClose}
          disabled={isSaving}
        >
          ‹
        </button>

        <div className="procedure-content">
          <div className="procedure-left">
            {/* Replaced static image with the interactive 3D model iframe */}
            <div className="procedure-image-wrap" style={{ position: 'relative', width: '100%', height: '300px', overflow: 'hidden', borderRadius: '8px' }}>
              <iframe
                ref={iframeRef}
                onLoad={handleIframeLoad}
                src="https://intellident-3d-viewer.vercel.app/"
                title="IntelliDent 3D Viewer"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>

            <p className="procedure-tooth">
              <strong>Tooth:</strong> {localTooth}
            </p>
          </div>

          <div className="procedure-right">
            <h2 className="procedure-title">Procedure</h2>
            <h3 className="procedure-subtitle">Procedure Performed</h3>

            <select
              className="procedure-select"
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
            >
              {SERVICE_OPTIONS.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>

            <textarea
              className="procedure-remarks"
              placeholder="Enter dentist remarks here..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />

            <div className="procedure-photo-section">
              <h3 className="procedure-subtitle photo-subtitle">
                Photo Documentation
              </h3>

              <div className="procedure-photo-grid">
                <div className="procedure-photo-box-wrap">
                  <p className="procedure-photo-label">Before</p>

                  <label className="procedure-upload-box">
                    {beforePhoto ? (
                      <img
                        src={beforePhoto}
                        alt="Before"
                        className="procedure-upload-preview"
                      />
                    ) : (
                      <div className="procedure-upload-placeholder">
                        <span className="procedure-upload-icon">🖼️</span>
                        <span>Select a file</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => handleFileChange(e, "before")}
                    />
                  </label>
                </div>

                <div className="procedure-photo-box-wrap">
                  <p className="procedure-photo-label">After</p>

                  <label className="procedure-upload-box">
                    {afterPhoto ? (
                      <img
                        src={afterPhoto}
                        alt="After"
                        className="procedure-upload-preview"
                      />
                    ) : (
                      <div className="procedure-upload-placeholder">
                        <span className="procedure-upload-icon">🖼️</span>
                        <span>Select a file</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => handleFileChange(e, "after")}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="procedure-actions">
              <button
                type="button"
                className={`save-procedure-btn ${isSaving ? "loading" : ""}`}
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Procedure"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}