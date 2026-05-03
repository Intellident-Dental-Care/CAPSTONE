import { useEffect, useRef, useState } from "react";
import AdminNotificationPopup from "../../admin/notifications/AdminNotificationPopup";
import AdminProfileModal from "../../admin/profile/AdminProfileModal";
import { getAdminProfile } from "../../../services/adminService";

export default function SuperAdminTopbar({
  notifications = [],
  isNotificationOpen,
  onToggleNotifications,
  onCloseNotifications,
  onMarkAllRead,
  onToggleSidebar,
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const profileRef = useRef(null);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      const result = await getAdminProfile();
      if (active && result?.success && result?.data) {
        setProfile(result.data);
      }
    };

    loadProfile();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleUserUpdated = (event) => {
      if (!event?.detail || typeof event.detail !== "object") return;

      setProfile((prev) => ({
        ...(prev || {}),
        ...event.detail,
      }));
    };

    window.addEventListener("auth:user-updated", handleUserUpdated);
    return () => {
      window.removeEventListener("auth:user-updated", handleUserUpdated);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      const target = event.target;

      if (target instanceof Element && target.closest(".admin-profile-modal")) {
        return;
      }

      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className="admin-topbar superadmin-topbar-mobile">
        <div className="superadmin-topbar-left">
          <button
            type="button"
            className="superadmin-menu-btn"
            onClick={onToggleSidebar}
            aria-label="Open menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        <div className="admin-topbar-actions">
          <div className="admin-notification-wrapper">
            <button
              type="button"
              className="admin-icon-btn"
              onClick={onToggleNotifications}
              aria-label="Open notifications"
            >
              <svg
                className="admin-bell-svg"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M15 17H9M18 17H6C6.8 16.2 7.4 15.2 7.4 14V10.8C7.4 8.1 9.3 5.8 11.9 5.3V4.8C11.9 4.3 12.3 4 12.8 4C13.3 4 13.7 4.3 13.7 4.8V5.3C16.3 5.8 18.2 8.1 18.2 10.8V14C18.2 15.2 18.8 16.2 19.6 17H18Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10.2 17C10.4 18.1 11.3 19 12.5 19C13.7 19 14.6 18.1 14.8 17"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

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
              <span className="admin-profile-label">
                {profile?.fullName ||
                  profile?.full_name ||
                  profile?.name ||
                  "Super Administrator"}
              </span>
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
        profile={profile}
        onProfileUpdated={setProfile}
      />
    </>
  );
}