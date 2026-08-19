import { useEffect, useRef, useState } from "react";
import AdminNotificationPopup from "../notifications/AdminNotificationPopup";
import AdminProfileModal from "../profile/AdminProfileModal";
import {
  getAdminProfile,
  fetchUnreadNotifications,
  markNotificationsAsRead,
} from "../../../services/adminService";

import { useBranch } from "../../../context/BranchContext";

const ADMIN_BRANCHES = [
  "Dasmarinas, Cavite",
  "General Trias, Cavite",
  "Bacoor, Cavite",
];

export default function AdminTopbar({
  title = "Dashboard",
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const profileRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const { selectedBranch, setSelectedBranch } = useBranch();

  const timeAgo = (dateString) => {
    if (!dateString) return "Just now";

    const seconds = Math.floor(
      (new Date() - new Date(dateString)) / 1000
    );

    if (seconds < 60) return `${seconds} secs ago`;

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) return `${minutes} mins ago`;

    const hours = Math.floor(minutes / 60);

    if (hours < 24) return `${hours} hrs ago`;

    return `${Math.floor(hours / 24)} days ago`;
  };

  const loadNotifications = async () => {
    try {
      const response = await fetchUnreadNotifications();

      if (response && response.success && response.data) {
        const formattedData = response.data.map((row) => ({
          id: row.id,
          title: row.title,
          message: row.message,
          time: row.created_at
            ? timeAgo(row.created_at)
            : "Just now",
        }));

        setNotifications(formattedData);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const handleMarkAllRead = async () => {
    const response = await markNotificationsAsRead();

    if (response.success) {
      setNotifications([]);
      setIsNotificationOpen(false);
    }
  };

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
    loadNotifications();

    const interval = setInterval(
      loadNotifications,
      30000
    );

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleUserUpdated = (event) => {
      if (
        !event?.detail ||
        typeof event.detail !== "object"
      ) {
        return;
      }

      setProfile((prev) => ({
        ...(prev || {}),
        ...event.detail,
      }));
    };

    window.addEventListener(
      "auth:user-updated",
      handleUserUpdated
    );

    return () => {
      window.removeEventListener(
        "auth:user-updated",
        handleUserUpdated
      );
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      const target = event.target;

      if (
        target instanceof Element &&
        target.closest(".admin-profile-modal")
      ) {
        return;
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  return (
    <>
      <header className="admin-topbar">
        <h1>{title}</h1>

        <div className="admin-topbar-actions">
          <div className="admin-topbar-branch-wrapper">
            <span className="admin-topbar-branch-label">
              Branch
            </span>

            <select
              value={selectedBranch}
              onChange={(e) =>
                setSelectedBranch(e.target.value)
              }
              className="admin-topbar-branch-select"
            >
              {ADMIN_BRANCHES.map((branch) => (
                <option
                  key={branch}
                  value={branch}
                >
                  {branch}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-notification-wrapper">
            <button
              type="button"
              className="admin-icon-btn"
              onClick={() =>
                setIsNotificationOpen((prev) => !prev)
              }
              aria-label="Toggle Notifications"
            >
              <span className="admin-bell-icon">
                🔔
              </span>

              {notifications.length > 0 && (
                <span className="admin-notification-badge">
                  {notifications.length > 9
                    ? "9+"
                    : notifications.length}
                </span>
              )}
            </button>

            <AdminNotificationPopup
              open={isNotificationOpen}
              notifications={notifications}
              onClose={() =>
                setIsNotificationOpen(false)
              }
              onMarkAllRead={handleMarkAllRead}
            />
          </div>

          <div
            className="admin-profile-wrapper"
            ref={profileRef}
          >
            <button
              type="button"
              className="admin-profile-trigger"
              onClick={() =>
                setIsProfileOpen((prev) => !prev)
              }
              aria-label="Open profile"
            >
              <span className="admin-profile-label">
                {profile?.fullName ||
                  "Administrator"}
              </span>

              <span
                className={`admin-profile-arrow ${
                  isProfileOpen ? "open" : ""
                }`}
              >
                ▾
              </span>
            </button>
          </div>
        </div>
      </header>

      <AdminProfileModal
        open={isProfileOpen}
        onClose={() =>
          setIsProfileOpen(false)
        }
        profile={profile}
        onProfileUpdated={setProfile}
      />
    </>
  );
}