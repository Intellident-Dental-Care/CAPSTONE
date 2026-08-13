import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import logo from "../../../assets/logo.png";
import adminProfile from "../../../assets/profile_sample.jpg";
import AuthService from "../../../services/authService";
import { getSuperAdminProfile, loadSuperAdminAvatarObjectUrl } from "../../../services/superAdminService";

const sidebarAvatarCache = {
  path: "",
  src: "",
};

export default function SuperAdminSidebar({ isOpen = false, onClose = () => {} }) {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => AuthService.getCurrentUser() || {});
  const [avatarSrc, setAvatarSrc] = useState(sidebarAvatarCache.src);
  const loadingRef = useRef(false);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      const result = await getSuperAdminProfile();
      if (!active || !result?.success || !result?.data) return;

      setCurrentUser((prev) => ({ ...(prev || {}), ...result.data }));
      localStorage.setItem(
        "user_data",
        JSON.stringify({
          ...(AuthService.getCurrentUser() || {}),
          ...result.data,
        })
      );
      window.dispatchEvent(new CustomEvent("auth:user-updated", { detail: result.data }));
    };

    const syncFromStorage = () => {
      setCurrentUser(AuthService.getCurrentUser() || {});
    };

    const handleUserUpdated = (event) => {
      if (event?.detail && typeof event.detail === "object") {
        setCurrentUser((prev) => ({ ...(prev || {}), ...event.detail }));
        return;
      }
      syncFromStorage();
    };

    loadProfile();
    window.addEventListener("storage", syncFromStorage);
    window.addEventListener("auth:user-updated", handleUserUpdated);

    return () => {
      active = false;
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener("auth:user-updated", handleUserUpdated);
    };
  }, []);

  useEffect(() => {
    const reloadAvatar = async () => {
      const userData = JSON.parse(localStorage.getItem("user_data") || "{}");
      const avatarPath = userData?.avatarPath || userData?.avatarUrl || "";

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
        const resolved = await loadSuperAdminAvatarObjectUrl(avatarPath);
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

  const displayName =
    currentUser?.fullName || currentUser?.full_name || currentUser?.name || "Super Admin";

  const displayRole =
    currentUser?.admin_type === "super_admin" || currentUser?.adminType === "super_admin"
      ? "System Super Administrator"
      : "Administrator";

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    AuthService.clearAuth();
    navigate("/login");
  };

  const handleNavClick = () => {
    if (window.innerWidth <= 900) {
      onClose();
    }
  };

  return (
    <>
      <div
        className={`superadmin-sidebar-overlay ${isOpen ? "show" : ""}`}
        onClick={onClose}
      ></div>

      <aside className={`admin-sidebar superadmin-mobile-sidebar ${isOpen ? "open" : ""}`}>
        <div className="superadmin-sidebar-inner">
          <div>
            <div className="admin-brand">
              <img
                src={logo}
                alt="GC Dental Care"
                className="admin-brand-logo-img"
              />
              <div>
                <h2>GC Dental Care</h2>
                <p>Powered by Intellident</p>
              </div>
            </div>

            <div className="admin-profile-card">
              <img src={avatarSrc || adminProfile} alt="Super Admin" />
              <h3>Hello, {displayName}</h3>
              <p>{displayRole}</p>
            </div>

            <nav className="admin-sidebar-menu">
              <NavLink
                to="/superadmin/dashboard"
                end
                onClick={handleNavClick}
                className={({ isActive }) => `admin-menu-item ${isActive ? "active" : ""}`}
              >
                Dashboard
              </NavLink>

              <NavLink
                to="/superadmin/admins"
                onClick={handleNavClick}
                className={({ isActive }) => `admin-menu-item ${isActive ? "active" : ""}`}
              >
                Admin Management
              </NavLink>

              <NavLink
                to="/superadmin/dentists"
                onClick={handleNavClick}
                className={({ isActive }) => `admin-menu-item ${isActive ? "active" : ""}`}
              >
                Dentist Management
              </NavLink>

              <NavLink
                to="/superadmin/patients"
                onClick={handleNavClick}
                className={({ isActive }) => `admin-menu-item ${isActive ? "active" : ""}`}
              >
                Patient Management
              </NavLink>

              <NavLink
                to="/superadmin/services"
                onClick={handleNavClick}
                className={({ isActive }) => `admin-menu-item ${isActive ? "active" : ""}`}
              >
                Services
              </NavLink>

              <NavLink
                to="/superadmin/tooth-questions"
                onClick={handleNavClick}
                className={({ isActive }) => `admin-menu-item ${isActive ? "active" : ""}`}
              >
                Tooth Questions
              </NavLink>

              <NavLink
                to="/superadmin/faqs"
                onClick={handleNavClick}
                className={({ isActive }) => `admin-menu-item ${isActive ? "active" : ""}`}
              >
                FAQs
              </NavLink>

              <NavLink
                to="/superadmin/terms-and-conditions"
                onClick={handleNavClick}
                className={({ isActive }) => `admin-menu-item ${isActive ? "active" : ""}`}
              >
                Terms & Conditions
              </NavLink>

            </nav>
          </div>

          <button
            type="button"
            className="admin-logout-btn"
            onClick={() => setShowLogoutModal(true)}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {showLogoutModal && (
        <div
          className="admin-logout-modal-overlay"
          onClick={() => setShowLogoutModal(false)}
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
                onClick={() => setShowLogoutModal(false)}
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