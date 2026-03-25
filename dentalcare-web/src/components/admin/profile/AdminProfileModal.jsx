import { useEffect, useState } from "react";
import { updateAdminProfile } from "../../../services/adminService";

export default function AdminProfileModal({ open, onClose, profile, onProfileUpdated }) {
  const [form, setForm] = useState({
    fullName: "",
    dob: "",
    gender: "",
    phone: "",
    email: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      fullName: profile.fullName || "",
      dob: profile.dob || "",
      gender: profile.gender || "",
      phone: profile.phone || "",
      email: profile.email || "",
    });
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    const result = await updateAdminProfile({
      fullName: form.fullName,
      dob: form.dob,
      gender: form.gender,
      phone: form.phone,
      email: form.email,
      contactDetail: form.email,
    });
    setSaving(false);

    if (result?.success && result?.data && onProfileUpdated) {
      const normalizedProfile = {
        ...result.data,
        fullName: result.data.fullName || result.data.full_name || form.fullName,
        full_name: result.data.full_name || result.data.fullName || form.fullName,
        email: result.data.email || form.email,
        phone: result.data.phone || result.data.phone_number || form.phone,
        phone_number: result.data.phone_number || result.data.phone || form.phone,
      };

      onProfileUpdated(normalizedProfile);

      localStorage.setItem("user_data", JSON.stringify({
        ...(JSON.parse(localStorage.getItem("user_data") || "{}")),
        fullName: normalizedProfile.fullName,
        full_name: normalizedProfile.full_name,
        email: normalizedProfile.email,
        phone_number: normalizedProfile.phone_number,
      }));

      window.dispatchEvent(new CustomEvent("auth:user-updated", { detail: normalizedProfile }));
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="admin-profile-modal-overlay" onClick={onClose}>
      <div
        className="admin-profile-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="admin-profile-close-btn"
          onClick={onClose}
          aria-label="Close profile modal"
        >
          ‹
        </button>

        <h2 className="admin-profile-modal-title">My Profile</h2>

        <div className="admin-profile-image-wrapper">
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80"
            alt="Profile"
            className="admin-profile-modal-image"
          />
          <button type="button" className="admin-profile-image-edit-btn">
            ✎
          </button>
        </div>

        <div className="admin-profile-section">
          <p className="admin-profile-section-title">Basic Detail</p>

          <div className="admin-profile-field">
            <label>Full Name</label>
            <input type="text" value={form.fullName} onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))} />
          </div>

          <div className="admin-profile-field">
            <label>Date of Birth</label>
            <input type="date" value={form.dob} onChange={(e) => setForm((prev) => ({ ...prev, dob: e.target.value }))} />
          </div>

          <div className="admin-profile-field">
            <label>Gender</label>
            <select value={form.gender} onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}>
              <option value="">Select gender</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="admin-profile-section">
          <p className="admin-profile-section-title">Contact Detail</p>

          <div className="admin-profile-field">
            <label>Mobile Number</label>
            <input type="text" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
          </div>

          <div className="admin-profile-field">
            <label>Email Address</label>
            <input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
          </div>
        </div>

        <button type="button" className="admin-profile-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}