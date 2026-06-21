import { useEffect, useState } from "react";
import Sidebar from "../../components/dentist/layout/Sidebar";
import Topbar from "../../components/dentist/layout/Topbar";
import profileImage from "../../assets/profile_sample.jpg";
import {
  getDentistProfile,
  updateDentistProfile,
} from "../../services/dentistService";

import "../../styles/dentist/layout/sidebar.css";
import "../../styles/admin/layout/admin-topbar.css";
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
      branch: current.branch || "No branch",
      startTime: current.startTime || "--:--",
      endTime: current.endTime || "--:--",
      isActive: current.isActive !== false,
    };
  });
};

const formatTime = (time) => {
  if (!time || time === "--:--") return "--:--";

  const [hours, minutes] = time.split(":");
  const hour = Number(hours);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;

  return `${hour12}:${minutes} ${suffix}`;
};

export default function DentistProfile() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    specialization: "",
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
    setProfileForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage("");

    const result = await updateDentistProfile({
      fullName: profileForm.fullName,
      phone: profileForm.phone,
      specialization: profileForm.specialization,
    });

    if (!result?.success) {
      setSaveMessage(result?.message || "Failed to save changes.");
      setIsSaving(false);
      return;
    }

    setSaveMessage("Profile updated successfully.");
    setIsSaving(false);
  };

  return (
    <div className="dentist-dashboard">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="main-content">
        <Topbar
          title="Profile"
          notifications={notifications}
          isNotificationOpen={isNotificationOpen}
          onToggleNotifications={handleToggleNotifications}
          onCloseNotifications={handleCloseNotifications}
          onMarkAllRead={handleMarkAllRead}
          profileImage={profileImage}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />

        <section className="profile-page">
          <div className="profile-card-page">
            <h2 className="profile-section-title">Profile Information</h2>

            <div className="profile-form-grid two">
              <div className="profile-field">
                <label>Full Name</label>
                <input
                  type="text"
                  value={profileForm.fullName}
                  onChange={(e) =>
                    handleInputChange("fullName", e.target.value)
                  }
                />
              </div>

              <div className="profile-field">
                <label>Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  disabled
                  className="readonly-input"
                />
              </div>

              <div className="profile-field">
                <label>Contact Number</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) =>
                    handleInputChange("phone", e.target.value)
                  }
                />
              </div>

              <div className="profile-field">
                <label>Specialization</label>
                <input
                  type="text"
                  value={profileForm.specialization}
                  onChange={(e) =>
                    handleInputChange("specialization", e.target.value)
                  }
                />
              </div>
            </div>

            <h2 className="profile-section-title">Schedule</h2>

            <div className="schedule-grid-modern">
              {profileForm.schedules.map((schedule) => (
                <div
                  className="schedule-modern-card"
                  key={schedule.dayOfWeek}
                >
                  <div className="schedule-modern-day">{schedule.day}</div>

                  <div className="schedule-modern-details">
                    <div className="schedule-modern-item">
                      <span className="schedule-modern-label">Branch</span>
                      <span className="schedule-modern-value">
                        {schedule.branch || "No branch"}
                      </span>
                    </div>

                    <div className="schedule-modern-item">
                      <span className="schedule-modern-label">Time</span>
                      <span className="schedule-modern-value">
                        {formatTime(schedule.startTime)} —{" "}
                        {formatTime(schedule.endTime)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {saveMessage ? (
              <p className="section-subtitle">{saveMessage}</p>
            ) : null}

            <div className="profile-save-wrap">
              <button
                type="button"
                className="profile-save-btn"
                disabled={isSaving}
                onClick={handleSave}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}