import { useEffect, useState } from "react";
import Sidebar from "../../components/dentist/layout/Sidebar";
import Topbar from "../../components/dentist/layout/Topbar";
import profileImage from "../../assets/profile_sample.jpg";
import { getDentistProfile, updateDentistProfile } from "../../services/dentistService";

import "../../styles/dentist/layout/sidebar.css";
import "../../styles/dentist/layout/topbar.css";
import "../../styles/dentist/notifications/notification-popup.css";
import "../../styles/dentist/profile/profile-page.css";
import "../../styles/dentist/shared/responsive.css";

export default function DentistProfile() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    specialization: "",
    licenseNumber: "",
    schedules: [],
  });

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      const result = await getDentistProfile({ forceRefresh: true });
      if (!mounted || !result?.success) return;

      const data = result.data || {};
      setProfileForm({
        fullName: data.fullName || "",
        email: data.email || "",
        phone: data.phone || "",
        specialization: data.specialization || "",
        licenseNumber: data.licenseNumber || "",
        schedules: data.schedules || [],
      });
      setNotifications(data.notifications || []);
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const handleToggleNotifications = () => {
    setIsNotificationOpen((prev) => !prev);
  };

  const handleCloseNotifications = () => {
    setIsNotificationOpen(false);
  };

  const handleMarkAllRead = () => {
    setNotifications([]);
    setIsNotificationOpen(false);
  };

  const handleInputChange = (key, value) => {
    setProfileForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage("");

    const result = await updateDentistProfile({
      fullName: profileForm.fullName,
      email: profileForm.email,
      phone: profileForm.phone,
      specialization: profileForm.specialization,
      licenseNumber: profileForm.licenseNumber,
    });

    if (!result?.success) {
      setSaveMessage(result?.message || "Failed to save changes.");
      setIsSaving(false);
      return;
    }

    const data = result.data || {};
    setProfileForm((prev) => ({
      ...prev,
      fullName: data.fullName || prev.fullName,
      email: data.email || prev.email,
      phone: data.phone || prev.phone,
      specialization: data.specialization || prev.specialization,
      licenseNumber: data.licenseNumber || prev.licenseNumber,
      schedules: data.schedules || prev.schedules,
    }));

    setSaveMessage("Profile updated successfully.");
    setIsSaving(false);
  };

  return (
    <div className="dentist-dashboard">
      <Sidebar />

      <main className="main-content">
        <Topbar
          title="Profile"
          notifications={notifications}
          isNotificationOpen={isNotificationOpen}
          onToggleNotifications={handleToggleNotifications}
          onCloseNotifications={handleCloseNotifications}
          onMarkAllRead={handleMarkAllRead}
          profileImage={profileImage}
        />

        <section className="profile-page">
          <div className="profile-card-page">
            <h2 className="profile-section-title">Personal Information</h2>

            <div className="profile-form-grid three">
              <div className="profile-field">
                <label>Full Name</label>
                <input
                  type="text"
                  value={profileForm.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                />
              </div>

              <div className="profile-field">
                <label>Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>

              <div className="profile-field">
                <label>Phone Number</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                />
              </div>
            </div>

            <h2 className="profile-section-title">Professional Details</h2>

            <div className="profile-form-grid two">
              <div className="profile-field">
                <label>Specialization</label>
                <input
                  type="text"
                  value={profileForm.specialization}
                  onChange={(e) => handleInputChange("specialization", e.target.value)}
                />
              </div>

              <div className="profile-field">
                <label>License Number</label>
                <input
                  type="text"
                  value={profileForm.licenseNumber}
                  onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
                />
              </div>
            </div>

            <h2 className="profile-section-title">Manage Schedule</h2>

            <div className="schedule-grid">
              {profileForm.schedules.length === 0 ? (
                <div className="schedule-row">
                  <span className="day-label">No active schedule yet.</span>
                </div>
              ) : (
                profileForm.schedules.map((schedule) => (
                  <div className="schedule-row" key={schedule.id}>
                    <span className="day-label">{schedule.day}</span>
                    <select value={schedule.branch} disabled>
                      <option>{schedule.branch}</option>
                    </select>
                    <span className="to-label">TIME</span>
                    <select value={schedule.time} disabled>
                      <option>{schedule.time}</option>
                    </select>
                  </div>
                ))
              )}
            </div>

            {saveMessage ? <p className="section-subtitle">{saveMessage}</p> : null}

            <div className="profile-save-wrap">
              <button type="button" className="profile-save-btn" disabled={isSaving} onClick={handleSave}>
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
