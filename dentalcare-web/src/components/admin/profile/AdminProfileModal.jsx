import { useEffect, useRef, useState } from "react";
import { updateAdminProfile, uploadAdminProfileAvatar, loadAdminAvatarObjectUrl } from "../../../services/adminService";

export default function AdminProfileModal({ open, onClose, profile, onProfileUpdated }) {
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    fullName: "",
    dob: "",
    gender: "",
    phone: "",
    email: "",
  });
  const [avatarPath, setAvatarPath] = useState("");
  const [avatarSrc, setAvatarSrc] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
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
    
    // Load avatar path from localStorage if it exists
    const userData = JSON.parse(localStorage.getItem("user_data") || "{}");
    setAvatarPath(userData.avatarPath || userData.avatarUrl || "");
  }, [profile]);

  useEffect(() => {
    let active = true;

    const loadAvatar = async () => {
      if (!avatarPath) {
        setAvatarSrc("");
        return;
      }

      try {
        const resolved = await loadAdminAvatarObjectUrl(avatarPath);
        if (active) setAvatarSrc(resolved || "");
      } catch {
        if (active) setAvatarSrc("");
      }
    };

    loadAvatar();

    return () => {
      active = false;
    };
  }, [avatarPath]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setUploadingAvatar(true);

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Failed to read image file"));
        reader.readAsDataURL(file);
      });

      const result = await uploadAdminProfileAvatar({
        avatarBase64: base64,
        fileName: file.name,
      });

      if (!result?.success) {
        console.error("Avatar upload failed:", result?.message || "Unknown error");
        alert(result?.message || "Failed to upload avatar. Please check database schema.");
        return;
      }

      if (!result?.data) {
        console.error("No data returned from avatar upload");
        alert("Avatar uploaded but profile data not returned");
        return;
      }

      const avatarPath = result.data.avatarUrl || result.data.avatarPath || "";
      setAvatarPath(avatarPath);

      // Update localStorage with avatar path
      const userData = JSON.parse(localStorage.getItem("user_data") || "{}");
      userData.avatarPath = avatarPath;
      userData.avatarUrl = avatarPath;
      localStorage.setItem("user_data", JSON.stringify(userData));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateAdminProfile({
        fullName: form.fullName,
        dob: form.dob,
        gender: form.gender,
        phone: form.phone,
        email: form.email,
        contactDetail: form.email,
      });

      if (!result?.success) {
        console.error("Profile update failed:", result?.message || "Unknown error");
        alert(result?.message || "Failed to update profile");
        setSaving(false);
        return;
      }

      if (!result?.data) {
        console.error("No data returned from profile update");
        setSaving(false);
        return;
      }

      if (result?.success && result?.data && onProfileUpdated) {
      const normalizedProfile = {
        ...result.data,
        fullName: result.data.fullName || result.data.full_name || form.fullName,
        full_name: result.data.full_name || result.data.fullName || form.fullName,
        email: result.data.email || form.email,
        phone: result.data.phone || result.data.phone_number || form.phone,
        phone_number: result.data.phone_number || result.data.phone || form.phone,
        avatarUrl: result.data.avatarUrl || result.data.avatar_url || avatarPath || "",
        avatar_url: result.data.avatar_url || result.data.avatarUrl || avatarPath || "",
      };

      onProfileUpdated(normalizedProfile);

      localStorage.setItem("user_data", JSON.stringify({
        ...(JSON.parse(localStorage.getItem("user_data") || "{}")),
        fullName: normalizedProfile.fullName,
        full_name: normalizedProfile.full_name,
        email: normalizedProfile.email,
        phone_number: normalizedProfile.phone_number,
        avatarUrl: normalizedProfile.avatarUrl,
        avatar_url: normalizedProfile.avatar_url,
      }));

      window.dispatchEvent(new CustomEvent("auth:user-updated", { detail: normalizedProfile }));
      onClose();
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("An error occurred while saving. Check console for details.");
    } finally {
      setSaving(false);
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
            src={avatarSrc || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80"}
            alt="Profile"
            className="admin-profile-modal-image"
          />
          <button type="button" className="admin-profile-image-edit-btn" onClick={handleAvatarClick} disabled={uploadingAvatar}>
            ✎
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleAvatarChange}
          />
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