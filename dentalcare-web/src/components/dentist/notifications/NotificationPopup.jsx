export default function NotificationPopup({
  open,
  notifications = [],
  onClose,
  onMarkAllRead,
}) {
  if (!open) return null;

  return (
    <>
      <div className="notification-overlay" onClick={onClose} />

      <div
        className="notification-popup"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="notification-popup-header">
          <h3>Notification ({notifications.length})</h3>

          <button
            type="button"
            className="notification-close-btn"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="notification-popup-list">
          {notifications.length > 0 ? (
            notifications.map((item) => (
              <div className="notification-item" key={item.id}>
                <div className="notification-dot"></div>

                <div className="notification-text">
                  <p>{item.title}</p>
                  <span>{item.message}</span>
                </div>

                <small>{item.time}</small>
              </div>
            ))
          ) : (
            <p className="notification-empty">No notifications available.</p>
          )}
        </div>

        <button
          type="button"
          className="mark-read-btn"
          onClick={onMarkAllRead}
        >
          Mark all as read
        </button>
      </div>
    </>
  );
}