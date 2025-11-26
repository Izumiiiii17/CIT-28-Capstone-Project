import { UserProfile } from '../types';

export class NotificationService {
    private static notificationPermission: NotificationPermission = 'default';
    private static scheduledNotifications: Map<string, number> = new Map();

    /**
     * Request permission for browser notifications
     */
    static async requestPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            console.warn('This browser does not support notifications');
            return false;
        }

        if (Notification.permission === 'granted') {
            this.notificationPermission = 'granted';
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            this.notificationPermission = permission;
            return permission === 'granted';
        }

        return false;
    }

    /**
     * Show a browser notification
     */
    static async showNotification(title: string, options?: NotificationOptions) {
        if (this.notificationPermission !== 'granted') {
            const granted = await this.requestPermission();
            if (!granted) return;
        }

        try {
            const notification = new Notification(title, {
                icon: '/logo.png',
                badge: '/logo.png',
                ...options,
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            return notification;
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    }

    /**
     * Schedule meal reminders based on user's meal timings
     */
    static scheduleMealReminders(userProfile: UserProfile) {
        // Clear existing reminders
        this.clearAllReminders();

        const settings = this.getNotificationSettings();
        if (!settings.mealReminders) return;

        const reminderMinutes = settings.reminderTime || 15;
        const mealTimings = userProfile.preferences.mealTimings;

        // Schedule breakfast reminder
        this.scheduleMealReminder(
            'breakfast',
            mealTimings.breakfast,
            reminderMinutes,
            '🌅 Breakfast Time!',
            'Time for your healthy breakfast. Check your meal plan!'
        );

        // Schedule lunch reminder
        this.scheduleMealReminder(
            'lunch',
            mealTimings.lunch,
            reminderMinutes,
            '☀️ Lunch Time!',
            'Time for your nutritious lunch. Don\'t forget to log it!'
        );

        // Schedule dinner reminder
        this.scheduleMealReminder(
            'dinner',
            mealTimings.dinner,
            reminderMinutes,
            '🌙 Dinner Time!',
            'Time for your evening meal. Stay on track!'
        );
    }

    /**
     * Schedule a single meal reminder
     */
    private static scheduleMealReminder(
        mealType: string,
        mealTime: string, // Format: "HH:MM"
        reminderMinutes: number,
        title: string,
        message: string
    ) {
        try {
            const [hours, minutes] = mealTime.split(':').map(Number);

            const now = new Date();
            const scheduledTime = new Date();
            scheduledTime.setHours(hours, minutes - reminderMinutes, 0, 0);

            // If the time has passed today, schedule for tomorrow
            if (scheduledTime <= now) {
                scheduledTime.setDate(scheduledTime.getDate() + 1);
            }

            const timeUntilNotification = scheduledTime.getTime() - now.getTime();

            const timeoutId = window.setTimeout(() => {
                this.showNotification(title, {
                    body: message,
                    tag: `meal-${mealType}`,
                    requireInteraction: true,
                });

                // Reschedule for next day
                this.scheduleMealReminder(mealType, mealTime, reminderMinutes, title, message);
            }, timeUntilNotification);

            this.scheduledNotifications.set(`meal-${mealType}`, timeoutId);

            console.log(`Scheduled ${mealType} reminder for ${scheduledTime.toLocaleString()}`);
        } catch (error) {
            console.error(`Error scheduling ${mealType} reminder:`, error);
        }
    }

    /**
     * Clear all scheduled reminders
     */
    static clearAllReminders() {
        this.scheduledNotifications.forEach((timeoutId) => {
            window.clearTimeout(timeoutId);
        });
        this.scheduledNotifications.clear();
    }

    /**
     * Clear a specific reminder
     */
    static clearReminder(key: string) {
        const timeoutId = this.scheduledNotifications.get(key);
        if (timeoutId) {
            window.clearTimeout(timeoutId);
            this.scheduledNotifications.delete(key);
        }
    }

    /**
     * Get notification settings from localStorage
     */
    static getNotificationSettings() {
        const defaultSettings = {
            mealReminders: true,
            progressUpdates: true,
            achievements: true,
            systemNotifications: true,
            smsEnabled: false,
            emailEnabled: true,
            reminderTime: 15,
            browserNotifications: true,
        };

        try {
            const saved = localStorage.getItem('nutriguide_notification_settings');
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
        } catch {
            return defaultSettings;
        }
    }

    /**
     * Save notification settings to localStorage
     */
    static saveNotificationSettings(settings: any) {
        localStorage.setItem('nutriguide_notification_settings', JSON.stringify(settings));
    }

    /**
     * Show achievement notification
     */
    static showAchievementNotification(title: string, message: string) {
        const settings = this.getNotificationSettings();
        if (!settings.achievements) return;

        this.showNotification(title, {
            body: message,
            tag: 'achievement',
            icon: '/achievement-icon.png',
        });
    }

    /**
     * Show progress update notification
     */
    static showProgressNotification(completedDays: number, totalDays: number, adherenceRate: number) {
        const settings = this.getNotificationSettings();
        if (!settings.progressUpdates) return;

        this.showNotification('📊 Progress Update', {
            body: `You've completed ${completedDays}/${totalDays} days with ${adherenceRate}% adherence. Great work!`,
            tag: 'progress',
        });
    }

    /**
     * Check if notifications are supported
     */
    static isSupported(): boolean {
        return 'Notification' in window;
    }

    /**
     * Get current permission status
     */
    static getPermissionStatus(): NotificationPermission {
        return Notification.permission;
    }

    /**
     * Schedule a one-time notification
     */
    static scheduleOneTimeNotification(
        title: string,
        message: string,
        delayMs: number,
        tag?: string
    ) {
        const timeoutId = window.setTimeout(() => {
            this.showNotification(title, {
                body: message,
                tag: tag || 'one-time',
            });
        }, delayMs);

        if (tag) {
            this.scheduledNotifications.set(tag, timeoutId);
        }

        return timeoutId;
    }

    /**
     * Test notification (for settings page)
     */
    static async testNotification() {
        const granted = await this.requestPermission();
        if (granted) {
            this.showNotification('🔔 Test Notification', {
                body: 'Notifications are working! You\'ll receive meal reminders at your scheduled times.',
                tag: 'test',
            });
            return true;
        }
        return false;
    }
}
