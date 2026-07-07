import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NotificationPopup from "../notifications/NotificationPopup";
import { 
  fetchUnreadDentistNotifications, 
  markDentistNotificationsAsRead,
  uploadDentistProfileAvatar,
  loadDentistAvatarObjectUrl
} from "../../../services/dentistService";

const topbarAvatarCache = {
  path: "",
  src: "",
};

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
  profileImage,
  onToggleSidebar,
}) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState(topbarAvatarCache.src);
  const loadingRef = useRef(false);

  const timeAgo = (dateString) => {
    if (!dateString) return "Just now";
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (seconds < 60) return `${seconds} secs ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} mins ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hrs ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  const loadNotifications = async () => {
    try {
      const response = await fetchUnreadDentistNotifications();
      if (response && response.success && response.data) {
        const formattedData = response.data.map((row) => ({
          id: row.id,
          title: row.title,
          message: row.message,
          time: row.created_at ? timeAgo(row.created_at) : "Just now",
        }));
        setNotifications(formattedData);
      }
    } catch (error) {
    }
  };

  const handleMarkAllRead = async () => {
    const response = await markDentistNotificationsAsRead();
    if (response.success) {
      setNotifications([]);
      setIsNotificationOpen(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const reloadAvatar = async () => {
      const userData = JSON.parse(localStorage.getItem("user_data") || "{}");
      const avatarPath = userData?.avatarPath || userData?.avatarUrl || userData?.profile_photo_url || "";

      if (avatarPath === topbarAvatarCache.path && topbarAvatarCache.src) {
        setAvatarSrc(topbarAvatarCache.src);
        return;
      }

      if (!avatarPath) {
        topbarAvatarCache.path = "";
        topbarAvatarCache.src = "";
        setAvatarSrc("");
        return;
      }

      if (loadingRef.current) return;
      loadingRef.current = true;

      try {
        const resolved = await loadDentistAvatarObjectUrl(avatarPath);
        topbarAvatarCache.path = avatarPath;
        topbarAvatarCache.src = resolved || "";
        setAvatarSrc(resolved || "");
      } catch {
        setAvatarSrc("");
      } finally {
        loadingRef.current = false;
      }
    };

    reloadAvatar();

    const handleAvatarUpdated = () => {
      const userData = JSON.parse(localStorage.getItem("user_data") || "{}");
      const newAvatarPath = userData?.avatarPath || userData?.avatarUrl || userData?.profile_photo_url || "";
      
      if (newAvatarPath && topbarAvatarCache.path !== newAvatarPath) {
        reloadAvatar();
      }
    };

    window.addEventListener("auth:user-updated", handleAvatarUpdated);
    window.addEventListener("storage", handleAvatarUpdated);

    return () => {
      window.removeEventListener("auth:user-updated", handleAvatarUpdated);
      window.removeEventListener("storage", handleAvatarUpdated);
    };
  }, []);

  const handleAvatarClick = () => {
    navigate("/dentist/profile");
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

      const result = await uploadDentistProfileAvatar({
        avatarBase64: base64,
        fileName: file.name,
      });

      if (!result?.success) {
        alert(result?.message || "Failed to upload avatar.");
        return;
      }

      const newAvatarPath = result.data.avatarUrl || result.data.avatarPath || "";
      
      const userData = JSON.parse(localStorage.getItem("user_data") || "{}");
      userData.avatarPath = newAvatarPath;
      userData.avatarUrl = newAvatarPath;
      localStorage.setItem("user_data", JSON.stringify(userData));

      window.dispatchEvent(new CustomEvent("auth:user-updated", { detail: userData }));
      
    } finally {
      setUploadingAvatar(false);
    }
  };

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
            onClick={() => setIsNotificationOpen((prev) => !prev)}
            aria-label="Toggle Notifications"
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
            onClose={() => setIsNotificationOpen(false)}
            onMarkAllRead={handleMarkAllRead}
          />
        </div>

        <button
          type="button"
          className="top-profile-btn"
          onClick={handleAvatarClick}
          disabled={uploadingAvatar}
          aria-label="Go to profile and upload picture"
          style={{ position: "relative", opacity: uploadingAvatar ? 0.5 : 1 }}
        >
          <img 
            src={avatarSrc || profileImage || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80"} 
            alt="Profile" 
            className="top-avatar" 
          />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleAvatarChange}
        />
      </div>
    </header>
  );
}