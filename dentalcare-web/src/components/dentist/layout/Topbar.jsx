import { useNavigate } from "react-router-dom";
import NotificationPopup from "../notifications/NotificationPopup";

export default function Topbar({
  title = "Dashboard",
  notifications = [],
  isNotificationOpen,
  onToggleNotifications,
  onCloseNotifications,
  onMarkAllRead,
  profileImage,
}) {
  const navigate = useNavigate();

  return (
    <header className="topbar">
      <h1>{title}</h1>

      <div className="topbar-actions">
        <div className="notification-wrapper">
          <button
            type="button"
            className="icon-btn"
            onClick={onToggleNotifications}
            aria-label="Open Notifications"
          >
            🔔
          </button>

          <NotificationPopup
            open={isNotificationOpen}
            notifications={notifications}
            onClose={onCloseNotifications}
            onMarkAllRead={onMarkAllRead}
          />
        </div>

        <button
          type="button"
          className="top-profile-btn"
          onClick={() => navigate("/dentist/profile")}
          aria-label="Go to profile"
        >
          <img
            src={profileImage}
            alt="Profile"
            className="top-avatar"
          />
        </button>
      </div>
    </header>
  );
}