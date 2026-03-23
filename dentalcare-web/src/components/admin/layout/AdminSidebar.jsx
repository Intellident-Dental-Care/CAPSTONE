import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import logo from "../../../assets/logo.png";
import adminProfile from "../../../assets/profile_sample.jpg";

export default function AdminSidebar() {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleOpenLogoutModal = () => {
    setShowLogoutModal(true);
  };

  const handleCloseLogoutModal = () => {
    setShowLogoutModal(false);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
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
            <img src={adminProfile} alt="Admin" />
            <h3>Hello, Admin</h3>
            <p>System Administrator</p>
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