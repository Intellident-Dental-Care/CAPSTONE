import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import logo from "../../../assets/logo.png";
import doctorProfile from "../../../assets/profile_sample.jpg";
import AuthService from "../../../services/authService";
import { getDentistProfile, loadDentistAvatarObjectUrl } from "../../../services/dentistService";

const sidebarAvatarCache = {
  path: "",
  src: "",
};

export default function Sidebar({ isOpen = false, onClose }) {
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

    getDentistProfile().then((result) => {
      if (result?.success && result?.data) {
        const localUser = AuthService.getCurrentUser() || {};
        const updatedUser = { ...localUser, ...result.data };

        if (result.data.profile_photo_url) {
          updatedUser.avatarPath = result.data.profile_photo_url;
          updatedUser.avatarUrl = result.data.profile_photo_url;
        }

        localStorage.setItem("user_data", JSON.stringify(updatedUser));
        window.dispatchEvent(new CustomEvent("auth:user-updated", { detail: updatedUser }));
      }
    }).catch(() => {});

    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener("auth:user-updated", handleUserUpdated);
    };
  }, []);

  useEffect(() => {
    const reloadAvatar = async () => {
      const userData = JSON.parse(localStorage.getItem("user_data") || "{}");
      const avatarPath = userData?.avatarPath || userData?.avatarUrl || userData?.profile_photo_url || "";

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
        const resolved = await loadDentistAvatarObjectUrl(avatarPath);
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
      const newAvatarPath = userData?.avatarPath || userData?.avatarUrl || userData?.profile_photo_url || "";
      
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

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    AuthService.clearAuth();
    navigate("/login");
  };

  const displayName = currentUser?.fullName || currentUser?.name || "Dentist";
  const displaySpecialty = currentUser?.specialty || currentUser?.specialization || "General Dentistry";

  return (
    <>
      <div
        className={`dentist-sidebar-overlay ${isOpen ? "show" : ""}`}
        onClick={onClose}
      ></div>

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="dentist-sidebar-inner">
          <div>
            <div className="brand">
              <img src={logo} alt="GC Dental Care" className="brand-logo-img" />
              <div>
                <h2>GC Dental Care</h2>
                <p>Powered by Intellident</p>
              </div>
            </div>

            <div className="profile-card">
              <img src={avatarSrc || doctorProfile} alt="Dentist" />
              <h3>{displayName}</h3>
              <p>{displaySpecialty}</p>
            </div>

            <nav className="sidebar-menu">
              <NavLink to="/dentist/dashboard" end className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`} onClick={onClose}>
                Dashboard
              </NavLink>

              <NavLink to="/dentist/schedule" className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`} onClick={onClose}>
                Schedule
              </NavLink>

              <NavLink to="/dentist/patient-history" className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`} onClick={onClose}>
                Patient History
              </NavLink>

              <NavLink to="/dentist/profile" className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`} onClick={onClose}>
                Profile
              </NavLink>
            </nav>
          </div>

          <button type="button" className="logout-btn" onClick={() => setShowLogoutModal(true)}>
            Sign Out
          </button>
        </div>
      </aside>

      {showLogoutModal && (
        <div className="logout-modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Sign Out</h3>
            <p>Are you sure you want to sign out?</p>

            <div className="logout-modal-actions">
              <button type="button" className="logout-cancel-btn" onClick={() => setShowLogoutModal(false)}>
                Cancel
              </button>

              <button type="button" className="logout-confirm-btn" onClick={handleConfirmLogout}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}