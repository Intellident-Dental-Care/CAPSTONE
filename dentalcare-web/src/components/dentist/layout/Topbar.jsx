import { useNavigate } from "react-router-dom";
import NotificationPopup from "../notifications/NotificationPopup";

function BellIcon() {
  return (
    <svg
      className="admin-bell-svg"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M18 8.5C18 6.9 17.37 5.37 16.24 4.24C15.11 3.11 13.58 2.5 12 2.5C10.42 2.5 8.89 3.11 7.76 4.24C6.63 5.37 6 6.9 6 8.5C6 15.5 3 17.5 3 17.5H21C21 17.5 18 15.5 18 8.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.73 21C13.55 21.3 13.29 21.55 12.98 21.72C12.68 21.9 12.34 22 12 22C11.66 22 11.32 21.9 11.02 21.72C10.71 21.55 10.45 21.3 10.27 21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Topbar({
  title = "Dashboard",
  notifications = [],
  isNotificationOpen,
  onToggleNotifications,
  onCloseNotifications,
  onMarkAllRead,
  profileImage,
  onToggleSidebar,
}) {
  const navigate = useNavigate();

  return (
    <header className="admin-topbar dentist-topbar">
      <div className="dentist-topbar-left">
        <button
          type="button"
          className="dentist-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Open menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <h1>{title}</h1>
      </div>

      <div className="admin-topbar-actions">
        <div className="admin-notification-wrapper">
          <button
            type="button"
            className="admin-icon-btn"
            onClick={onToggleNotifications}
            aria-label="Open Notifications"
          >
            <BellIcon />

            {notifications.length > 0 && (
              <span className="admin-notification-badge">
                {notifications.length > 9 ? "9+" : notifications.length}
              </span>
            )}
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
          <img src={profileImage} alt="Profile" className="top-avatar" />
        </button>
      </div>
    </header>
  );
}