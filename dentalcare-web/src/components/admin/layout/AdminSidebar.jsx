import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import logo from "../../../assets/logo.png";
import adminProfile from "../../../assets/profile_sample.jpg";
import AuthService from "../../../services/authService";

import {
  getAdminProfile,
  loadAdminAvatarObjectUrl,
} from "../../../services/adminService";

// Persistent cache across component remounts
const sidebarAvatarCache = {
  path: "",
  src: "",
};

export default function AdminSidebar() {
  const navigate = useNavigate();

  /* =========================================================
     STATES
  ========================================================= */

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [showLogoutModal, setShowLogoutModal] =
    useState(false);

  const [currentUser, setCurrentUser] = useState(
    () => AuthService.getCurrentUser() || {}
  );

  const [avatarSrc, setAvatarSrc] = useState(
    sidebarAvatarCache.src
  );

  const loadingRef = useRef(false);

  /* =========================================================
     MOBILE SIDEBAR
  ========================================================= */

  const closeMobileSidebar = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  /* Listen for hamburger click from AdminTopbar */
  useEffect(() => {
    const handleOpenSidebar = () => {
      setIsMobileOpen(true);
    };

    window.addEventListener(
      "admin:sidebar-open",
      handleOpenSidebar
    );

    return () => {
      window.removeEventListener(
        "admin:sidebar-open",
        handleOpenSidebar
      );
    };
  }, []);

  /* Prevent page scrolling while sidebar is open */
  useEffect(() => {
    if (!isMobileOpen) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [isMobileOpen]);

  /* Close using Escape */
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (
        event.key === "Escape" &&
        isMobileOpen
      ) {
        closeMobileSidebar();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [isMobileOpen, closeMobileSidebar]);

  /* Close drawer if browser becomes desktop size */
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, []);

  /* =========================================================
     LOAD ADMIN PROFILE
  ========================================================= */

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      const result =
        await getAdminProfile();

      if (
        !active ||
        !result?.success ||
        !result?.data
      ) {
        return;
      }

      setCurrentUser((prev) => ({
        ...(prev || {}),
        ...result.data,
      }));

      localStorage.setItem(
        "user_data",
        JSON.stringify({
          ...(AuthService.getCurrentUser() || {}),
          ...result.data,
        })
      );

      window.dispatchEvent(
        new CustomEvent(
          "auth:user-updated",
          {
            detail: result.data,
          }
        )
      );
    };

    const syncFromStorage = () => {
      setCurrentUser(
        AuthService.getCurrentUser() || {}
      );
    };

    const handleUserUpdated = (
      event
    ) => {
      if (
        event?.detail &&
        typeof event.detail === "object"
      ) {
        setCurrentUser((prev) => ({
          ...prev,
          ...event.detail,
        }));

        return;
      }

      syncFromStorage();
    };

    loadProfile();

    window.addEventListener(
      "storage",
      syncFromStorage
    );

    window.addEventListener(
      "auth:user-updated",
      handleUserUpdated
    );

    return () => {
      active = false;

      window.removeEventListener(
        "storage",
        syncFromStorage
      );

      window.removeEventListener(
        "auth:user-updated",
        handleUserUpdated
      );
    };
  }, []);

  /* =========================================================
     LOAD ADMIN AVATAR
  ========================================================= */

  useEffect(() => {
    const reloadAvatar = async () => {
      const userData = JSON.parse(
        localStorage.getItem(
          "user_data"
        ) || "{}"
      );

      const avatarPath =
        userData?.avatarPath ||
        userData?.avatarUrl ||
        "";

      if (
        avatarPath ===
          sidebarAvatarCache.path &&
        sidebarAvatarCache.src
      ) {
        setAvatarSrc(
          sidebarAvatarCache.src
        );

        return;
      }

      if (!avatarPath) {
        sidebarAvatarCache.path = "";
        sidebarAvatarCache.src = "";

        setAvatarSrc("");

        return;
      }

      if (loadingRef.current) {
        return;
      }

      loadingRef.current = true;

      try {
        const resolved =
          await loadAdminAvatarObjectUrl(
            avatarPath
          );

        sidebarAvatarCache.path =
          avatarPath;

        sidebarAvatarCache.src =
          resolved || "";

        setAvatarSrc(
          resolved || ""
        );
      } catch (error) {
        console.error(
          "Unable to load admin avatar:",
          error
        );

        setAvatarSrc("");
      } finally {
        loadingRef.current = false;
      }
    };

    reloadAvatar();

    const handleAvatarUpdated = () => {
      const userData = JSON.parse(
        localStorage.getItem(
          "user_data"
        ) || "{}"
      );

      const newAvatarPath =
        userData?.avatarPath ||
        userData?.avatarUrl ||
        "";

      if (
        newAvatarPath &&
        sidebarAvatarCache.path !==
          newAvatarPath
      ) {
        reloadAvatar();
      }
    };

    window.addEventListener(
      "auth:user-updated",
      handleAvatarUpdated
    );

    window.addEventListener(
      "storage",
      handleAvatarUpdated
    );

    return () => {
      window.removeEventListener(
        "auth:user-updated",
        handleAvatarUpdated
      );

      window.removeEventListener(
        "storage",
        handleAvatarUpdated
      );
    };
  }, []);

  /* =========================================================
     USER INFORMATION
  ========================================================= */

  const isSuperAdmin =
    (
      currentUser?.admin_type ||
      currentUser?.adminType
    ) === "super_admin";

  const displayName =
    currentUser?.fullName ||
    currentUser?.full_name ||
    currentUser?.name ||
    "Admin";

  const displayRole =
    isSuperAdmin
      ? "System Administrator"
      : "Branch Administrator";

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleOpenLogoutModal = () => {
    setShowLogoutModal(true);
  };

  const handleCloseLogoutModal = () => {
    setShowLogoutModal(false);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);

    AuthService.clearAuth();

    navigate("/login");
  };

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const handleNavigation = () => {
    closeMobileSidebar();
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <>
      {/* =====================================================
          MOBILE BACKDROP
      ===================================================== */}

      <div
        className={`admin-sidebar-mobile-overlay ${
          isMobileOpen ? "open" : ""
        }`}
        onClick={closeMobileSidebar}
        aria-hidden={!isMobileOpen}
      />

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`admin-sidebar ${
          isMobileOpen
            ? "mobile-open"
            : ""
        }`}
      >
        {/* MOBILE CLOSE BUTTON */}

        <button
          type="button"
          className="admin-sidebar-mobile-close"
          onClick={closeMobileSidebar}
          aria-label="Close navigation menu"
        >
          ×
        </button>

        <div>
          {/* BRAND */}

          <div className="admin-brand">
            <img
              src={logo}
              alt="GC Dental Care"
              className="admin-brand-logo-img"
            />

            <div>
              <h2>
                GC Dental Care
              </h2>

              <p>
                Powered by IntelliDent
              </p>
            </div>
          </div>

          {/* PROFILE */}

          <div className="admin-profile-card">
            <img
              src={
                avatarSrc ||
                adminProfile
              }
              alt="Admin"
            />

            <h3>
              Hello, {displayName}
            </h3>

            <p>
              {displayRole}
            </p>
          </div>

          {/* NAVIGATION */}

          <nav className="admin-sidebar-menu">

            <NavLink
              to="/admin/dashboard"
              end
              onClick={
                handleNavigation
              }
              className={({
                isActive,
              }) =>
                `admin-menu-item ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/admin/queue-control"
              onClick={
                handleNavigation
              }
              className={({
                isActive,
              }) =>
                `admin-menu-item ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
            >
              Queue Control
            </NavLink>

            <NavLink
              to="/admin/appointments"
              onClick={
                handleNavigation
              }
              className={({
                isActive,
              }) =>
                `admin-menu-item ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
            >
              Appointments
            </NavLink>

            <NavLink
              to="/admin/dentists"
              onClick={
                handleNavigation
              }
              className={({
                isActive,
              }) =>
                `admin-menu-item ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
            >
              Dentist
            </NavLink>

            <NavLink
              to="/admin/patients"
              onClick={
                handleNavigation
              }
              className={({
                isActive,
              }) =>
                `admin-menu-item ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
            >
              Patient
            </NavLink>

          </nav>
        </div>

        {/* LOGOUT */}

        <button
          type="button"
          className="admin-logout-btn"
          onClick={
            handleOpenLogoutModal
          }
        >
          Sign Out
        </button>
      </aside>

      {/* =====================================================
          LOGOUT MODAL
      ===================================================== */}

      {showLogoutModal && (
        <div
          className="admin-logout-modal-overlay"
          onClick={
            handleCloseLogoutModal
          }
        >
          <div
            className="admin-logout-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <h3>
              Sign Out
            </h3>

            <p>
              Are you sure you want to
              sign out?
            </p>

            <div className="admin-logout-modal-actions">

              <button
                type="button"
                className="admin-logout-cancel-btn"
                onClick={
                  handleCloseLogoutModal
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-logout-confirm-btn"
                onClick={
                  handleConfirmLogout
                }
              >
                Sign Out
              </button>

            </div>
          </div>
        </div>
      )}
    </>
  );
}