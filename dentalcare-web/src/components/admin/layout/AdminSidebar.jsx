import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import logo from "../../../assets/logo.png";
import adminProfile from "../../../assets/profile_sample.jpg";
import AuthService from "../../../services/authService";
import { loadAdminAvatarObjectUrl } from "../../../services/adminService";

// Persistent cache across component remounts
const sidebarAvatarCache = {
  path: "",
  src: "",
};

export default function AdminSidebar() {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => AuthService.getCurrentUser() || {});
  const [avatarSrc, setAvatarSrc] = useState(sidebarAvatarCache.src);
  const loadingRef = useRef(false);


  useEffect(() => {
    const syncFromStorage = () => {
      setCurrentUser(AuthService.getCurrentUser() || {});
    };

    const handleUserUpdated = (event) => {
      if (event?.detail && typeof event.detail === "object") {
        setCurrentUser((prev) => ({ ...prev, ...event.detail }));
        return;
      }

      syncFromStorage();
    };

    window.addEventListener("storage", syncFromStorage);
    window.addEventListener("auth:user-updated", handleUserUpdated);

    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener("auth:user-updated", handleUserUpdated);
    };
  }, []);

  useEffect(() => {
    const reloadAvatar = async () => {
      const userData = JSON.parse(localStorage.getItem("user_data") || "{}");
      const avatarPath = userData?.avatarPath || userData?.avatarUrl || "";

      // If path hasn't changed and we have a cached src, use it
      if (avatarPath === sidebarAvatarCache.path && sidebarAvatarCache.src) {
        setAvatarSrc(sidebarAvatarCache.src);
        return;
      }

      if (!avatarPath) {
        sidebarAvatarCache.path = "";
        sidebarAvatarCache.src = "";
        setAvatarSrc("");
        return;
      }

      if (loadingRef.current) return;
      loadingRef.current = true;

      try {
        const resolved = await loadAdminAvatarObjectUrl(avatarPath);
        sidebarAvatarCache.path = avatarPath;
        sidebarAvatarCache.src = resolved || "";
        setAvatarSrc(resolved || "");
      } catch {
        setAvatarSrc("");
      } finally {
        loadingRef.current = false;
      }
    };

    reloadAvatar();

    // Listen for avatar updates from modal - only reload if path actually changed
    const handleAvatarUpdated = () => {
      const userData = JSON.parse(localStorage.getItem("user_data") || "{}");
      const newAvatarPath = userData?.avatarPath || userData?.avatarUrl || "";
      
      if (newAvatarPath && sidebarAvatarCache.path !== newAvatarPath) {
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

  const isSuperAdmin = (currentUser?.admin_type || currentUser?.adminType) === "super_admin";
  const displayName =
    currentUser?.fullName || currentUser?.full_name || currentUser?.name || "Admin";
  const displayRole = isSuperAdmin ? "System Administrator" : "Branch Administrator";

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

  return (
    <>
      <aside className="admin-sidebar">
        <div>
          <div className="admin-brand">
            <img src={logo} alt="GC Dental Care" className="admin-brand-logo-img" />
            <div>
              <h2>GC Dental Care</h2>
              <p>Powered by Intellident</p>
            </div>
          </div>

          <div className="admin-profile-card">
            <img src={avatarSrc || adminProfile} alt="Admin" />
            <h3>Hello, {displayName}</h3>
            <p>{displayRole}</p>
          </div>

          <nav className="admin-sidebar-menu">
            <NavLink
              to="/admin/dashboard"
              end
              className={({ isActive }) =>
                `admin-menu-item ${isActive ? "active" : ""}`
              }
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/admin/queue-control"
              className={({ isActive }) =>
                `admin-menu-item ${isActive ? "active" : ""}`
              }
            >
              Queue Control
            </NavLink>

            <NavLink
              to="/admin/appointments"
              className={({ isActive }) =>
                `admin-menu-item ${isActive ? "active" : ""}`
              }
            >
              Appointments
            </NavLink>

            <NavLink
              to="/admin/dentists"
              className={({ isActive }) =>
                `admin-menu-item ${isActive ? "active" : ""}`
              }
            >
              Dentist
            </NavLink>

            <NavLink
              to="/admin/patients"
              className={({ isActive }) =>
                `admin-menu-item ${isActive ? "active" : ""}`
              }
            >
              Patient
            </NavLink>
          </nav>
        </div>

        <button
          type="button"
          className="admin-logout-btn"
          onClick={handleOpenLogoutModal}
        >
          Sign Out
        </button>
      </aside>

      {showLogoutModal && (
        <div
          className="admin-logout-modal-overlay"
          onClick={handleCloseLogoutModal}
        >
          <div
            className="admin-logout-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Sign Out</h3>
            <p>Are you sure you want to sign out?</p>

            <div className="admin-logout-modal-actions">
              <button
                type="button"
                className="admin-logout-cancel-btn"
                onClick={handleCloseLogoutModal}
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-logout-confirm-btn"
                onClick={handleConfirmLogout}
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