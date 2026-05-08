import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import logo from "../../../assets/logo.png";
import doctorProfile from "../../../assets/profile_sample.jpg";
import AuthService from "../../../services/authService";
import { getDentistProfile } from "../../../services/dentistService";

export default function Sidebar({ isOpen = false, onClose }) {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [displayName, setDisplayName] = useState("Dentist");
  const [displaySpecialty, setDisplaySpecialty] = useState("General Dentistry");

  useEffect(() => {
    const localUser = AuthService.getCurrentUser();

    if (localUser?.fullName || localUser?.name) {
      setDisplayName(localUser.fullName || localUser.name);
      setDisplaySpecialty(
        localUser.specialty || localUser.specialization || "General Dentistry"
      );
    }

    let mounted = true;

    getDentistProfile()
      .then((result) => {
        if (!mounted || !result?.success || !result?.data) return;
        setDisplayName(result.data.fullName || localUser?.fullName || "Dentist");
        setDisplaySpecialty(
          result.data.specialization ||
            localUser?.specialty ||
            "General Dentistry"
        );
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    AuthService.clearAuth();
    navigate("/login");
  };

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
              <img src={doctorProfile} alt="Dentist" />
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