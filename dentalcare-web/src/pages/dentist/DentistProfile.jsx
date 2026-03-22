import { useState } from "react";
import Sidebar from "../../components/dentist/layout/Sidebar";
import Topbar from "../../components/dentist/layout/Topbar";

import "../../styles/dentist/layout/sidebar.css";
import "../../styles/dentist/layout/topbar.css";
import "../../styles/dentist/notifications/notification-popup.css";
import "../../styles/dentist/profile/profile-page.css";
import "../../styles/dentist/shared/responsive.css";
import profileImage from "../../assets/profile_sample.jpg";

export default function DentistProfile() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New Appointment Requests:",
      message: "John Doe for Consultation",
      time: "2 mins ago",
    },
    {
      id: 2,
      title: "Pre-Assessment Completed:",
      message: "Jane Smith for Tooth Extraction",
      time: "10 mins ago",
    },
    {
      id: 3,
      title: "Pre-Assessment Completed:",
      message: "Jane Smith for Tooth Extraction",
      time: "10 mins ago",
    },
    {
      id: 4,
      title: "Pre-Assessment Completed:",
      message: "Jane Smith for Tooth Extraction",
      time: "10 mins ago",
    },
    {
      id: 5,
      title: "Pre-Assessment Completed:",
      message: "Jane Smith for Tooth Extraction",
      time: "10 mins ago",
    },
    {
      id: 6,
      title: "New Appointment Requests:",
      message: "John Doe for Consultation",
      time: "2 mins ago",
    },
  ]);

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
                <input type="text" value="Edward Crizzie Amparo" readOnly />
              </div>

              <div className="profile-field">
                <label>Email</label>
                <input type="email" defaultValue="amparo@gmail.com" />
              </div>

              <div className="profile-field">
                <label>Phone Number</label>
                <input type="text" defaultValue="09123456789" />
              </div>
            </div>

            <h2 className="profile-section-title">Professional Details</h2>

            <div className="profile-form-grid two">
              <div className="profile-field">
                <label>Specialization</label>
                <input type="text" defaultValue="Orthodontist" />
              </div>

              <div className="profile-field">
                <label>License Number</label>
                <input type="text" defaultValue="D-12345" />
              </div>
            </div>

            <h2 className="profile-section-title">Manage Schedule</h2>

            <div className="schedule-grid">
              {[
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ].map((day) => (
                <div className="schedule-row" key={day}>
                  <span className="day-label">{day}</span>

                  <select>
                    <option>9:00 AM</option>
                    <option>10:00 AM</option>
                    <option>11:00 AM</option>
                  </select>

                  <span className="to-label">TO</span>

                  <select>
                    <option>6:00 PM</option>
                    <option>5:00 PM</option>
                    <option>4:00 PM</option>
                  </select>
                </div>
              ))}
            </div>

            <div className="profile-save-wrap">
              <button type="button" className="profile-save-btn">
                Save Changes
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}