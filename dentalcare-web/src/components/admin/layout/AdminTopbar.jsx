import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import AdminNotificationPopup from "../notifications/AdminNotificationPopup";
import AdminProfileModal from "../profile/AdminProfileModal";

import {
  getAdminProfile,
  fetchUnreadNotifications,
  markNotificationsAsRead,
} from "../../../services/adminService";

import { useBranch } from "../../../context/BranchContext";

const DEFAULT_ALL_BRANCHES = [
  "Dasmarinas, Cavite",
  "General Trias, Cavite",
  "Bacoor, Cavite",
];

const normalizeBranchName = (
  str = ""
) => {
  const clean = str.trim();
  const lower = clean.toLowerCase();

  if (lower.includes("dasma")) {
    return "Dasmarinas, Cavite";
  }

  if (
    lower.includes("gentri") ||
    lower.includes(
      "general trias"
    )
  ) {
    return "General Trias, Cavite";
  }

  if (
    lower.includes("bacoor")
  ) {
    return "Bacoor, Cavite";
  }

  return clean;
};

export default function AdminTopbar({
  title = "Dashboard",
}) {
  /* =========================================================
     STATES
  ========================================================= */

  const [
    isProfileOpen,
    setIsProfileOpen,
  ] = useState(false);

  const [
    profile,
    setProfile,
  ] = useState(null);

  const profileRef =
    useRef(null);

  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [
    isNotificationOpen,
    setIsNotificationOpen,
  ] = useState(false);

  const {
    selectedBranch,
    setSelectedBranch,
  } = useBranch();

  /* =========================================================
     BRANCHES
  ========================================================= */

  const availableBranches =
    useMemo(() => {
      if (!profile) {
        return DEFAULT_ALL_BRANCHES;
      }

      const isAdminSuper =
        profile.adminType ===
          "super_admin" ||
        profile.admin_type ===
          "super_admin";

      if (isAdminSuper) {
        return DEFAULT_ALL_BRANCHES;
      }

      if (profile.branch) {
        const parsed =
          profile.branch
            .split("|")
            .map((branch) =>
              normalizeBranchName(
                branch
              )
            )
            .filter(Boolean);

        if (
          parsed.length > 0
        ) {
          return [
            ...new Set(parsed),
          ];
        }
      }

      return DEFAULT_ALL_BRANCHES;
    }, [profile]);

  useEffect(() => {
    if (
      availableBranches.length ===
      0
    ) {
      return;
    }

    if (
      !selectedBranch ||
      !availableBranches.includes(
        selectedBranch
      )
    ) {
      setSelectedBranch(
        availableBranches[0]
      );
    }
  }, [
    availableBranches,
    selectedBranch,
    setSelectedBranch,
  ]);

  /* =========================================================
     TIME AGO
  ========================================================= */

  const timeAgo = (
    dateString
  ) => {
    if (!dateString) {
      return "Just now";
    }

    const seconds =
      Math.floor(
        (new Date() -
          new Date(
            dateString
          )) /
          1000
      );

    if (seconds < 60) {
      return `${seconds} secs ago`;
    }

    const minutes =
      Math.floor(
        seconds / 60
      );

    if (minutes < 60) {
      return `${minutes} mins ago`;
    }

    const hours =
      Math.floor(
        minutes / 60
      );

    if (hours < 24) {
      return `${hours} hrs ago`;
    }

    const days =
      Math.floor(
        hours / 24
      );

    return `${days} ${
      days === 1
        ? "day"
        : "days"
    } ago`;
  };

  /* =========================================================
     NOTIFICATIONS
  ========================================================= */

  const loadNotifications =
    async () => {
      try {
        const response =
          await fetchUnreadNotifications(
            selectedBranch
          );

        if (
          response?.success &&
          response?.data
        ) {
          const formattedData =
            response.data.map(
              (row) => ({
                id: row.id,
                title: row.title,
                message:
                  row.message,
                time:
                  row.created_at
                    ? timeAgo(
                        row.created_at
                      )
                    : "Just now",
              })
            );

          setNotifications(
            formattedData
          );
        }
      } catch (error) {
        console.error(
          "Error fetching notifications:",
          error
        );
      }
    };

  const handleMarkAllRead =
    async () => {
      try {
        const response =
          await markNotificationsAsRead(
            selectedBranch
          );

        if (response?.success) {
          setNotifications([]);

          setIsNotificationOpen(
            false
          );
        }
      } catch (error) {
        console.error(
          "Error marking notifications as read:",
          error
        );
      }
    };

  /* =========================================================
     PROFILE
  ========================================================= */

  useEffect(() => {
    let active = true;

    const loadProfile =
      async () => {
        const result =
          await getAdminProfile();

        if (
          active &&
          result?.success &&
          result?.data
        ) {
          setProfile(
            result.data
          );
        }
      };

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  /* =========================================================
     REFRESH NOTIFICATIONS
  ========================================================= */

  useEffect(() => {
    loadNotifications();

    const interval =
      setInterval(
        loadNotifications,
        30000
      );

    return () => {
      clearInterval(interval);
    };
  }, [selectedBranch]);

  /* =========================================================
     USER UPDATE
  ========================================================= */

  useEffect(() => {
    const handleUserUpdated = (
      event
    ) => {
      if (
        !event?.detail ||
        typeof event.detail !==
          "object"
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

  /* =========================================================
     CLICK OUTSIDE PROFILE
  ========================================================= */

  useEffect(() => {
    const handleClickOutside = (
      event
    ) => {
      const target =
        event.target;

      if (
        target instanceof
          Element &&
        target.closest(
          ".admin-profile-modal"
        )
      ) {
        return;
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(
          event.target
        )
      ) {
        setIsProfileOpen(false);
      }
    };

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

  /* =========================================================
     MOBILE SIDEBAR
  ========================================================= */

  const handleOpenSidebar = () => {
    window.dispatchEvent(
      new CustomEvent(
        "admin:sidebar-open"
      )
    );
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <>
      <header className="admin-topbar">

        {/* LEFT SIDE */}

        <div className="admin-topbar-left">

          <button
            type="button"
            className="admin-mobile-menu-btn"
            onClick={
              handleOpenSidebar
            }
            aria-label="Open navigation menu"
          >
            <span />
            <span />
            <span />
          </button>

          <h1>
            {title}
          </h1>

        </div>

        {/* RIGHT SIDE */}

        <div className="admin-topbar-actions">

          {/* BRANCH */}

          <div className="admin-topbar-branch-wrapper">

            <span className="admin-topbar-branch-label">
              Branch
            </span>

            <select
              value={
                selectedBranch || ""
              }
              onChange={(e) =>
                setSelectedBranch(
                  e.target.value
                )
              }
              className="admin-topbar-branch-select"
            >
              {availableBranches.map(
                (branch) => (
                  <option
                    key={branch}
                    value={branch}
                  >
                    {branch}
                  </option>
                )
              )}
            </select>

          </div>

          {/* NOTIFICATION */}

          <div className="admin-notification-wrapper">

            <button
              type="button"
              className="admin-icon-btn"
              onClick={() =>
                setIsNotificationOpen(
                  (prev) =>
                    !prev
                )
              }
              aria-label="Toggle notifications"
            >
              <span className="admin-bell-icon">
                🔔
              </span>

              {notifications.length >
                0 && (
                <span className="admin-notification-badge">
                  {notifications.length >
                  9
                    ? "9+"
                    : notifications.length}
                </span>
              )}
            </button>

            <AdminNotificationPopup
              open={
                isNotificationOpen
              }
              notifications={
                notifications
              }
              onClose={() =>
                setIsNotificationOpen(
                  false
                )
              }
              onMarkAllRead={
                handleMarkAllRead
              }
            />

          </div>

          {/* PROFILE */}

          <div
            className="admin-profile-wrapper"
            ref={profileRef}
          >

            <button
              type="button"
              className="admin-profile-trigger"
              onClick={() =>
                setIsProfileOpen(
                  (prev) =>
                    !prev
                )
              }
              aria-label="Open profile"
            >
              <span className="admin-profile-label">
                {profile?.fullName ||
                  profile?.full_name ||
                  profile?.name ||
                  "Administrator"}
              </span>

              <span
                className={`admin-profile-arrow ${
                  isProfileOpen
                    ? "open"
                    : ""
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
        onProfileUpdated={
          setProfile
        }
      />
    </>
  );
}