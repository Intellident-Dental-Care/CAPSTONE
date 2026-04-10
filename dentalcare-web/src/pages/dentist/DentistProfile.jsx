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

const SCHEDULE_DAYS = [
  { dayOfWeek: 1, label: "Monday" },
  { dayOfWeek: 2, label: "Tuesday" },
  { dayOfWeek: 3, label: "Wednesday" },
  { dayOfWeek: 4, label: "Thursday" },
  { dayOfWeek: 5, label: "Friday" },
  { dayOfWeek: 6, label: "Saturday" },
  { dayOfWeek: 0, label: "Sunday" },
];

const TIME_OPTIONS = Array.from({ length: 24 }, (_, hour) => {
  const value = `${String(hour).padStart(2, "0")}:00`;
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return { value, label: `${hour12}:00 ${suffix}` };
});

const BRANCH_OPTIONS = [
  "General Trias, Cavite",
  "Dasmarinas, Cavite",
  "Bacoor, Cavite",
];

const buildScheduleState = (schedules = []) => {
  const byDay = new Map(
    (Array.isArray(schedules) ? schedules : [])
      .filter((item) => Number.isInteger(item?.dayOfWeek))
      .map((item) => [item.dayOfWeek, item])
  );

  return SCHEDULE_DAYS.map(({ dayOfWeek, label }) => {
    const current = byDay.get(dayOfWeek) || {};
    return {
      id: current.id || null,
      dayOfWeek,
      day: label,
      branch: current.branch || "",
      startTime: current.startTime || "09:00",
      endTime: current.endTime || "18:00",
      isActive: current.isActive !== false,
    };
  });
};

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
    schedules: buildScheduleState([]),
  });

  useEffect(() => {
    let mounted = true;

    const applyProfileData = (data = {}) => {
      setProfileForm({
        fullName: data.fullName || "",
        email: data.email || "",
        phone: data.phone || "",
        specialization: data.specialization || "",
        licenseNumber: data.licenseNumber || "",
        schedules: buildScheduleState(data.schedules || []),
      });
      setNotifications(data.notifications || []);
    };

    const loadProfile = async () => {
      const cached = await getDentistProfile();
      if (!mounted) return;

      if (cached?.success) {
        applyProfileData(cached.data || {});
      }

      const fresh = await getDentistProfile({ forceRefresh: true });
      if (!mounted || !fresh?.success) return;

      applyProfileData(fresh.data || {});
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

  const handleScheduleChange = (dayOfWeek, key, value) => {
    setProfileForm((prev) => ({
      ...prev,
      schedules: prev.schedules.map((item) =>
        item.dayOfWeek === dayOfWeek ? { ...item, [key]: value } : item
      ),
    }));
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
      schedules: profileForm.schedules.map((item) => ({
        id: item.id || undefined,
        dayOfWeek: item.dayOfWeek,
        branch: item.branch,
        startTime: item.startTime,
        endTime: item.endTime,
        isActive: item.isActive,
      })),
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
      schedules: buildScheduleState(data.schedules || prev.schedules),
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
              {profileForm.schedules.map((schedule) => (
                <div className="schedule-row" key={schedule.dayOfWeek}>
                  <span className="day-label">{schedule.day}</span>

                  <select
                    value={schedule.branch}
                    onChange={(e) => handleScheduleChange(schedule.dayOfWeek, "branch", e.target.value)}
                  >
                    <option value="">Select branch</option>
                    {BRANCH_OPTIONS.map((branch) => (
                      <option key={`branch-${schedule.dayOfWeek}-${branch}`} value={branch}>
                        {branch}
                      </option>
                    ))}
                    {schedule.branch && !BRANCH_OPTIONS.includes(schedule.branch) ? (
                      <option value={schedule.branch}>{schedule.branch}</option>
                    ) : null}
                  </select>

                  <select
                    value={schedule.startTime}
                    onChange={(e) => handleScheduleChange(schedule.dayOfWeek, "startTime", e.target.value)}
                  >
                    {TIME_OPTIONS.map((option) => (
                      <option key={`start-${schedule.dayOfWeek}-${option.value}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <span className="to-label">TO</span>

                  <select
                    value={schedule.endTime}
                    onChange={(e) => handleScheduleChange(schedule.dayOfWeek, "endTime", e.target.value)}
                  >
                    {TIME_OPTIONS.map((option) => (
                      <option key={`end-${schedule.dayOfWeek}-${option.value}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
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
