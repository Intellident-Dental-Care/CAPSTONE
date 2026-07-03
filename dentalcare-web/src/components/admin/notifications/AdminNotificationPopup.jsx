import { useEffect, useRef } from "react";

export default function AdminNotificationPopup({
  open,
  notifications = [],
  onClose,
  onMarkAllRead,
}) {
  const popupRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose?.();
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="admin-notification-overlay" onClick={onClose} />

      <div className="admin-notification-popup" ref={popupRef}>
        <div className="admin-notification-popup-header">
          <h3>Notification ({notifications.length})</h3>

          <button
            type="button"
            className="admin-notification-close-btn"
            onClick={onClose}
            aria-label="Close notifications"
          >
            ×
          </button>
        </div>

        <div className="admin-notification-popup-list">
          {notifications.length > 0 ? (
            notifications.map((item, index) => (
              <div className="admin-notification-item" key={index}>
                <div className="admin-notification-dot" />

                <div className="admin-notification-text">
                  {/* Removed all fallback "||" strings here */}
                  <p>{item.title}</p>
                  <span>{item.message}</span>
                </div>

                <small>{item.time}</small>
              </div>
            ))
          ) : (
            <div className="admin-notification-empty">
              No notifications yet.
            </div>
          )}
        </div>

        <button
          type="button"
          className="admin-mark-read-btn"
          onClick={onMarkAllRead}
        >
          Mark all as read
        </button>
      </div>
    </>
  );
}