// Notification Service for generating and managing notifications
import { apiFetch, apiConfig } from '../config/api';

class NotificationService {
  constructor() {
    this.notifications = [];
    this.listeners = [];
    this.pollingInterval = null;
  }

  // Add notification listener
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify all listeners
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.notifications));
  }

  // Generate mock notifications for testing
  generateMockNotifications(userRole, centerName) {
    const mockNotifications = [];

    // Patient referral notifications
    if (userRole === 'admin' || userRole === 'superadmin') {
      mockNotifications.push({
        id: `ref_${Date.now()}_1`,
        type: 'referral',
        title: 'New Patient Referral',
        message: 'Patient John Doe has been referred from Salapan Center to your center for follow-up treatment.',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        isRead: false,
        priority: 'high'
      });

      mockNotifications.push({
        id: `ref_${Date.now()}_2`,
        type: 'referral',
        title: 'Patient Referral Update',
        message: 'Maria Santos has been transferred from Balong-Bato Center. Please review her case history.',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        isRead: false,
        priority: 'medium'
      });
    }

    // Scheduled visit notifications
    if (userRole === 'admin' || userRole === 'superadmin') {
      mockNotifications.push({
        id: `sched_${Date.now()}_1`,
        type: 'scheduled',
        title: 'Scheduled Visit Today',
        message: 'Patient Carlos Rodriguez has a vaccination appointment scheduled for today at 2:00 PM.',
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        isRead: false,
        priority: 'high'
      });

      mockNotifications.push({
        id: `sched_${Date.now()}_2`,
        type: 'scheduled',
        title: 'Multiple Appointments Today',
        message: 'You have 3 patients scheduled for vaccination today. Please prepare the necessary vaccines.',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        isRead: false,
        priority: 'medium'
      });
    }

    // Urgent notifications
    if (userRole === 'admin' || userRole === 'superadmin') {
      mockNotifications.push({
        id: `urgent_${Date.now()}_1`,
        type: 'urgent',
        title: 'Urgent: Vaccine Stock Low',
        message: 'Rabies vaccine stock is running low (5 doses remaining). Please reorder immediately.',
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
        isRead: false,
        priority: 'urgent'
      });
    }

    // Reminder notifications
    if (userRole === 'admin' || userRole === 'superadmin') {
      mockNotifications.push({
        id: `reminder_${Date.now()}_1`,
        type: 'reminder',
        title: 'Weekly Report Due',
        message: 'Your weekly patient report is due tomorrow. Please submit it before 5:00 PM.',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        isRead: true,
        priority: 'low'
      });
    }

    return mockNotifications;
  }

  // Fetch notifications from API (with fallback to mock data)
  async fetchNotifications(userRole, centerName) {
    try {
      // Try to fetch from real API first
      const response = await apiFetch(`/api/notifications?role=${userRole}&center=${centerName}`);
      
      if (response.ok) {
        const data = await response.json();
        this.notifications = data.notifications || [];
        this.notifyListeners();
        return {
          notifications: this.notifications,
          unreadCount: this.notifications.filter(n => !n.isRead).length
        };
      }
    } catch (error) {
      console.warn('API notification fetch failed, using mock data:', error);
    }

    // Fallback to mock data
    this.notifications = this.generateMockNotifications(userRole, centerName);
    this.notifyListeners();
    
    return {
      notifications: this.notifications,
      unreadCount: this.notifications.filter(n => !n.isRead).length
    };
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      await apiFetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
    } catch (error) {
      console.warn('API mark as read failed, updating locally:', error);
    }

    // Update locally
    this.notifications = this.notifications.map(notif => 
      notif.id === notificationId 
        ? { ...notif, isRead: true }
        : notif
    );
    this.notifyListeners();
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      await apiFetch('/api/notifications/mark-all-read', {
        method: 'PUT'
      });
    } catch (error) {
      console.warn('API mark all as read failed, updating locally:', error);
    }

    // Update locally
    this.notifications = this.notifications.map(notif => ({ ...notif, isRead: true }));
    this.notifyListeners();
  }

  // Delete notification
  async deleteNotification(notificationId) {
    try {
      await apiFetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.warn('API delete notification failed, updating locally:', error);
    }

    // Update locally
    this.notifications = this.notifications.filter(notif => notif.id !== notificationId);
    this.notifyListeners();
  }

  // Start polling for new notifications
  startPolling(userRole, centerName, interval = 30000) {
    this.stopPolling();
    
    this.pollingInterval = setInterval(() => {
      this.fetchNotifications(userRole, centerName);
    }, interval);
  }

  // Stop polling
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // Create notification for patient referral
  createReferralNotification(fromCenter, toCenter, patientName, patientId) {
    const notification = {
      id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'referral',
      title: 'New Patient Referral',
      message: `Patient ${patientName} (ID: ${patientId}) has been referred from ${fromCenter} to ${toCenter} for follow-up treatment.`,
      createdAt: new Date().toISOString(),
      isRead: false,
      priority: 'high'
    };

    this.notifications.unshift(notification);
    this.notifyListeners();
    return notification;
  }

  // Create notification for scheduled visit
  createScheduledVisitNotification(patientName, patientId, appointmentTime, centerName) {
    const notification = {
      id: `sched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'scheduled',
      title: 'Scheduled Visit Today',
      message: `Patient ${patientName} (ID: ${patientId}) has a vaccination appointment scheduled for today at ${appointmentTime} at ${centerName}.`,
      createdAt: new Date().toISOString(),
      isRead: false,
      priority: 'high'
    };

    this.notifications.unshift(notification);
    this.notifyListeners();
    return notification;
  }

  // Create urgent notification
  createUrgentNotification(title, message, priority = 'urgent') {
    const notification = {
      id: `urgent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'urgent',
      title,
      message,
      createdAt: new Date().toISOString(),
      isRead: false,
      priority
    };

    this.notifications.unshift(notification);
    this.notifyListeners();
    return notification;
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
