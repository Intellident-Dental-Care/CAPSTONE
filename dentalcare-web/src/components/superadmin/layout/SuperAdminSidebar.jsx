import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import logo from "../../../assets/logo.png";
import adminProfile from "../../../assets/profile_sample.jpg";

export default function SuperAdminSidebar() {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    navigate("/login");
  };

  return (
    <>
      <aside className="admin-sidebar">
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
            <img src={adminProfile} alt="Super Admin" />
            <h3>Hello, Super Admin</h3>
            <p>Global System Administrator</p>
          </div>

          <nav className="admin-sidebar-menu">
            <NavLink
              to="/superadmin/dashboard"
              end
              className={({ isActive }) =>
                `admin-menu-item ${isActive ? "active" : ""}`
              }
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/superadmin/admins"
              className={({ isActive }) =>
                `admin-menu-item ${isActive ? "active" : ""}`
              }
            >
              Admin Management
            </NavLink>

            <NavLink
              to="/superadmin/dentists"
              className={({ isActive }) =>
                `admin-menu-item ${isActive ? "active" : ""}`
              }
            >
              Dentist Management
            </NavLink>

            <NavLink
              to="/superadmin/patients"
              className={({ isActive }) =>
                `admin-menu-item ${isActive ? "active" : ""}`
              }
            >
              Patient Management
            </NavLink>

            <NavLink
              to="/superadmin/services"
              className={({ isActive }) =>
                `admin-menu-item ${isActive ? "active" : ""}`
              }
            >
              Services
            </NavLink>

            <NavLink
              to="/superadmin/faqs"
              className={({ isActive }) =>
                `admin-menu-item ${isActive ? "active" : ""}`
              }
            >
              FAQs
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