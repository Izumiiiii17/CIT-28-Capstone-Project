import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bell,
  Clock,
  Settings,
  ArrowLeft,
  Check,
  X,
  Trash2,
  Plus,
  Smartphone,
  Mail,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationService } from '../services/notificationService';
import { ProfileService } from '../services/profileService';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: 'meal_reminder' | 'progress_update' | 'achievement' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionRequired?: boolean;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationSettings, setNotificationSettings] = useState({
    mealReminders: true,
    progressUpdates: true,
    achievements: true,
    systemNotifications: true,
    smsEnabled: false,
    emailEnabled: true,
    reminderTime: 15, // minutes before meal
    browserNotifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [browserNotificationPermission, setBrowserNotificationPermission] = useState<NotificationPermission>('default');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadNotifications();
    loadNotificationSettings();
    checkBrowserNotificationPermission();
    setupMealReminders();
  }, [user]);

  const loadNotifications = () => {
    // Mock notifications data
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'meal_reminder',
        title: 'Lunch Reminder',
        message: 'Time for your healthy lunch! Don\'t forget to log your meal.',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        read: false,
        actionRequired: true,
      },
      {
        id: '2',
        type: 'achievement',
        title: 'Achievement Unlocked!',
        message: 'Congratulations! You\'ve completed 7 days in a row. Keep up the great work!',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        read: false,
      },
      {
        id: '3',
        type: 'progress_update',
        title: 'Weekly Progress Summary',
        message: 'You\'ve achieved 87% adherence this week. You\'re doing amazing!',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        read: true,
      },
      {
        id: '4',
        type: 'system',
        title: 'New Feature Available',
        message: 'Check out the new meal planner feature to customize your daily meals!',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        read: true,
      },
    ];

    setNotifications(mockNotifications);
    setLoading(false);
  };

  const loadNotificationSettings = () => {
    const savedSettings = localStorage.getItem('nutriguide_notification_settings');
    if (savedSettings) {
      setNotificationSettings(JSON.parse(savedSettings));
    }
  };

  const saveNotificationSettings = async () => {
    localStorage.setItem('nutriguide_notification_settings', JSON.stringify(notificationSettings));
    NotificationService.saveNotificationSettings(notificationSettings);

    // If browser notifications are enabled, request permission and setup reminders
    if (notificationSettings.browserNotifications && notificationSettings.mealReminders) {
      await setupMealReminders();
    } else {
      NotificationService.clearAllReminders();
    }

    toast.success('Notification settings saved!');
  };

  const checkBrowserNotificationPermission = () => {
    if (NotificationService.isSupported()) {
      setBrowserNotificationPermission(NotificationService.getPermissionStatus());
    }
  };

  const requestBrowserNotificationPermission = async () => {
    const granted = await NotificationService.requestPermission();
    if (granted) {
      setBrowserNotificationPermission('granted');
      toast.success('Browser notifications enabled!');
      await setupMealReminders();
    } else {
      toast.error('Browser notification permission denied');
    }
  };

  const setupMealReminders = async () => {
    try {
      const { data: profileData } = await ProfileService.getProfile();
      if (profileData) {
        const profile = ProfileService.profileRowToUserProfile(profileData);
        NotificationService.scheduleMealReminders(profile);
        console.log('Meal reminders scheduled successfully');
      }
    } catch (error) {
      console.error('Error setting up meal reminders:', error);
    }
  };

  const testNotification = async () => {
    const success = await NotificationService.testNotification();
    if (!success) {
      toast.error('Please enable browser notifications first');
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
    toast.success('All notifications marked as read');
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    toast.success('Notification deleted');
  };

  const clearAllNotifications = () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      setNotifications([]);
      toast.success('All notifications cleared');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'meal_reminder': return '🍽️';
      case 'achievement': return '🏆';
      case 'progress_update': return '📊';
      case 'system': return '🔔';
      default: return '📢';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'meal_reminder': return 'border-orange-200 bg-orange-50';
      case 'achievement': return 'border-emerald-200 bg-emerald-50';
      case 'progress_update': return 'border-blue-200 bg-blue-50';
      case 'system': return 'border-purple-200 bg-purple-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} days ago`;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
  };

  const pageTransition = {
    type: 'tween' as const,
    ease: 'anticipate',
    duration: 0.5
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Loading Notifications</h2>
          <p className="text-gray-600">Getting your latest updates...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="min-h-screen bg-gray-50 py-8"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600">
                {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <Check className="w-4 h-4 mr-2" />
                Mark All Read
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={clearAllNotifications}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Notifications List */}
          <div className="lg:col-span-2 space-y-4">
            {notifications.length > 0 ? (
              notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`${getNotificationColor(notification.type)} ${!notification.read ? 'border-l-4 border-l-emerald-500' : ''
                    }`}>
                    <CardContent>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="text-2xl">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className={`font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-700'
                                }`}>
                                {notification.title}
                              </h3>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                              )}
                            </div>
                            <p className={`text-sm ${!notification.read ? 'text-gray-700' : 'text-gray-600'
                              }`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {formatTimestamp(notification.timestamp)}
                            </p>
                            {notification.actionRequired && (
                              <div className="mt-3">
                                <Button size="sm">
                                  Take Action
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <Card>
                <CardContent>
                  <div className="text-center py-12">
                    <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">No Notifications</h2>
                    <p className="text-gray-600">
                      You're all caught up! New notifications will appear here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Notification Settings */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-emerald-600" />
                  <span>Notification Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Meal Reminders</p>
                      <p className="text-sm text-gray-600">Get reminded about meal times</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.mealReminders}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev,
                        mealReminders: e.target.checked
                      }))}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Progress Updates</p>
                      <p className="text-sm text-gray-600">Weekly progress summaries</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.progressUpdates}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev,
                        progressUpdates: e.target.checked
                      }))}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Achievements</p>
                      <p className="text-sm text-gray-600">Celebrate your milestones</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.achievements}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev,
                        achievements: e.target.checked
                      }))}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">System Notifications</p>
                      <p className="text-sm text-gray-600">App updates and news</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.systemNotifications}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev,
                        systemNotifications: e.target.checked
                      }))}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>

                  <hr className="my-4" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-medium">Browser Notifications</p>
                        <p className="text-sm text-gray-600">Real-time meal reminders</p>
                        {browserNotificationPermission === 'denied' && (
                          <p className="text-xs text-red-600 mt-1">Permission denied. Enable in browser settings.</p>
                        )}
                        {browserNotificationPermission === 'default' && (
                          <p className="text-xs text-amber-600 mt-1">Click to enable notifications</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {browserNotificationPermission !== 'granted' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={requestBrowserNotificationPermission}
                        >
                          Enable
                        </Button>
                      )}
                      <input
                        type="checkbox"
                        checked={notificationSettings.browserNotifications}
                        onChange={(e) => setNotificationSettings(prev => ({
                          ...prev,
                          browserNotifications: e.target.checked
                        }))}
                        disabled={browserNotificationPermission !== 'granted'}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <hr className="my-4" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-medium">SMS Notifications</p>
                        <p className="text-sm text-gray-600">Receive via text message</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.smsEnabled}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev,
                        smsEnabled: e.target.checked
                      }))}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-gray-600">Receive via email</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailEnabled}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev,
                        emailEnabled: e.target.checked
                      }))}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reminder Time (minutes before meal)
                    </label>
                    <select
                      value={notificationSettings.reminderTime}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev,
                        reminderTime: parseInt(e.target.value)
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value={5}>5 minutes</option>
                      <option value={10}>10 minutes</option>
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Button
                      onClick={saveNotificationSettings}
                      className="w-full"
                    >
                      Save Settings
                    </Button>
                    <Button
                      onClick={testNotification}
                      variant="outline"
                      className="w-full"
                    >
                      Test Notification
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Notification Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Notifications</span>
                    <span className="font-semibold">{notifications.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unread</span>
                    <span className="font-semibold text-emerald-600">{unreadCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">This Week</span>
                    <span className="font-semibold">
                      {notifications.filter(n => {
                        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                        return new Date(n.timestamp) > weekAgo;
                      }).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  );
}