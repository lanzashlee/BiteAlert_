import React, { useState, useEffect } from 'react';
import './NotificationSystem.css';
import notificationService from '../../services/notificationService';

const NotificationSystem = ({ userRole, centerName }) => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications using the notification service
  const fetchNotifications = async () => {
    try {
      const data = await notificationService.fetchNotifications(userRole, centerName);
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      // The service will update the notifications automatically
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      // The service will update the notifications automatically
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      // The service will update the notifications automatically
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Fetch notifications on component mount and set up polling
  useEffect(() => {
    fetchNotifications();
    
    // Set up notification service listener
    const unsubscribe = notificationService.addListener((updatedNotifications) => {
      setNotifications(updatedNotifications);
      setUnreadCount(updatedNotifications.filter(n => !n.isRead).length);
    });
    
    // Start polling for new notifications
    notificationService.startPolling(userRole, centerName, 30000);
    
    return () => {
      unsubscribe();
      notificationService.stopPolling();
    };
  }, [userRole, centerName]);

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'referral':
        return 'fa-solid fa-user-plus';
      case 'scheduled':
        return 'fa-solid fa-calendar-day';
      case 'urgent':
        return 'fa-solid fa-exclamation-triangle';
      case 'reminder':
        return 'fa-solid fa-bell';
      default:
        return 'fa-solid fa-info-circle';
    }
  };

  // Get notification color based on type
  const getNotificationColor = (type) => {
    switch (type) {
      case 'referral':
        return '#3b82f6';
      case 'scheduled':
        return '#10b981';
      case 'urgent':
        return '#ef4444';
      case 'reminder':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  // Format time ago
  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className="notification-system">
      {/* Notification Bell */}
      <div className="notification-bell-container">
        <button
          className="notification-bell"
          onClick={() => setShowNotifications(!showNotifications)}
          aria-label="Notifications"
        >
          <i className="fa-solid fa-bell"></i>
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount}</span>
          )}
        </button>
      </div>

      {/* Notification Dropdown */}
      {showNotifications && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                className="mark-all-read-btn"
                onClick={markAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <i className="fa-solid fa-bell-slash"></i>
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="notification-icon">
                    <i 
                      className={getNotificationIcon(notification.type)}
                      style={{ color: getNotificationColor(notification.type) }}
                    ></i>
                  </div>
                  
                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.title}
                    </div>
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    <div className="notification-time">
                      {getTimeAgo(notification.createdAt)}
                    </div>
                  </div>
                  
                  <button
                    className="delete-notification-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    aria-label="Delete notification"
                  >
                    <i className="fa-solid fa-times"></i>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {showNotifications && (
        <div 
          className="notification-backdrop"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
};

export default NotificationSystem;
