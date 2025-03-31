// src/components/Notifications/Notifications.js
import React from 'react';
import { useAppContext } from '../../context/AppContext';

const Notifications = () => {
    const { notifications, removeNotification } = useAppContext();

    if (notifications.length === 0) {
        return null;
    }

    return (
        <div className="notifications-container">
            {notifications.map((notification) => (
                <div
                    key={notification.id}
                    className={`notification notification-${notification.type}`}
                >
                    <div className="notification-message">{notification.message}</div>
                    <button
                        type="button"
                        className="notification-close"
                        onClick={() => removeNotification(notification.id)}
                        aria-label="Close"
                    >
                        &times;
                    </button>
                </div>
            ))}
        </div>
    );
};

export default Notifications;