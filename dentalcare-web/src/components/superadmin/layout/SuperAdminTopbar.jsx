import { useEffect, useRef, useState } from "react";
import AdminNotificationPopup from "../../admin/notifications/AdminNotificationPopup";
import AdminProfileModal from "../../admin/profile/AdminProfileModal";

export default function SuperAdminTopbar({
  title = "Dashboard",
  notifications = [],
  isNotificationOpen,
  onToggleNotifications,
  onCloseNotifications,
  onMarkAllRead,
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className="admin-topbar">
        <h1>{title}</h1>

        <div className="admin-topbar-actions">
          <div className="admin-notification-wrapper">
            <button
              type="button"
              className="admin-icon-btn"
              onClick={onToggleNotifications}
              aria-label="Open Notifications"
            >
              <span className="admin-bell-icon">🔔</span>

              {notifications.length > 0 && (
                <span className="admin-notification-badge">
                  {notifications.length > 9 ? "9+" : notifications.length}
                </span>
              )}
            </button>

            <AdminNotificationPopup
              open={isNotificationOpen}
              notifications={notifications}
              onClose={onCloseNotifications}
              onMarkAllRead={onMarkAllRead}
            />
          </div>

          <div className="admin-profile-wrapper" ref={profileRef}>
            <button
              type="button"
              className="admin-profile-trigger"
              onClick={() => setIsProfileOpen((prev) => !prev)}
            >
              <span className="admin-profile-label">Super Administrator</span>
              <span className={`admin-profile-arrow ${isProfileOpen ? "open" : ""}`}>
                ▾
              </span>
            </button>
          </div>
        </div>
      </header>

      <AdminProfileModal
        open={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  );
}