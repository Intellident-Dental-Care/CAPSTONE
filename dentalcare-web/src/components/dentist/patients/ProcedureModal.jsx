import { useState } from "react";
import toothModel from "../../../assets/tooth_model.png";

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
}) {
  const [selectedService, setSelectedService] = useState("Restoration");
  const [remarks, setRemarks] = useState("");
  const [beforePhoto, setBeforePhoto] = useState(null);
  const [afterPhoto, setAfterPhoto] = useState(null);

  if (!open) return null;

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

  const handleSave = () => {
    const payload = {
      service: selectedService,
      remarks,
      beforePhoto,
      afterPhoto,
      tooth,
    };

    onSave?.(payload);
  };

  return (
    <div className="procedure-overlay" onClick={onClose}>
      <div
        className="procedure-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="procedure-back-btn"
          onClick={onClose}
        >
          ‹
        </button>

        <div className="procedure-content">
          <div className="procedure-left">
            <div className="procedure-image-wrap">
              <img
                src={toothModel}
                alt="Tooth Model"
                className="procedure-image"
              />
            </div>

            <p className="procedure-tooth">
              <strong>Tooth:</strong> {tooth || "Not specified"}
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
                className="save-procedure-btn"
                onClick={handleSave}
              >
                Save Procedure
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}