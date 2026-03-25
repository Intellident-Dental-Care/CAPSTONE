export default function AdminProfileModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="admin-profile-modal-overlay" onClick={onClose}>
      <div
        className="admin-profile-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="admin-profile-close-btn"
          onClick={onClose}
          aria-label="Close profile modal"
        >
          ‹
        </button>

        <h2 className="admin-profile-modal-title">My Profile</h2>

        <div className="admin-profile-image-wrapper">
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80"
            alt="Profile"
            className="admin-profile-modal-image"
          />
          <button type="button" className="admin-profile-image-edit-btn">
            ✎
          </button>
        </div>

        <div className="admin-profile-section">
          <p className="admin-profile-section-title">Basic Detail</p>

          <div className="admin-profile-field">
            <label>Full Name</label>
            <input type="text" defaultValue="Dian Mendoza" />
          </div>

          <div className="admin-profile-field">
            <label>Date of Birth</label>
            <select defaultValue="1 January 2004">
              <option>1 January 2004</option>
            </select>
          </div>

          <div className="admin-profile-field">
            <label>Gender</label>
            <select defaultValue="Female">
              <option>Female</option>
              <option>Male</option>
            </select>
          </div>
        </div>

        <div className="admin-profile-section">
          <p className="admin-profile-section-title">Contact Detail</p>

          <div className="admin-profile-field">
            <label>Mobile Number</label>
            <input type="text" defaultValue="+63 912 3456 789" />
          </div>

          <div className="admin-profile-field">
            <label>Email Address</label>
            <input type="email" defaultValue="andreab@gmail.com" />
          </div>
        </div>

        <button type="button" className="admin-profile-save-btn">
          Save
        </button>
      </div>
    </div>
  );
}