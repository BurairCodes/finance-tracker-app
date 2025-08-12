import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      // Web notifications fallback
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }

  static async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    if (Platform.OS === 'web') {
      // Web notification fallback
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.png' });
      } else {
        console.log('Notification:', title, body);
      }
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  }

  static async scheduleBudgetAlert(
    category: string,
    spent: number,
    budget: number,
    currency: string
  ): Promise<void> {
    const percentage = (spent / budget) * 100;
    let title = '';
    let body = '';

    if (percentage >= 100) {
      title = '🚨 Budget Exceeded!';
      body = `You've exceeded your ${category} budget by ${(percentage - 100).toFixed(1)}%`;
    } else if (percentage >= 80) {
      title = '⚠️ Budget Alert';
      body = `You've used ${percentage.toFixed(1)}% of your ${category} budget`;
    }

    if (title && body) {
      await this.scheduleLocalNotification(title, body, {
        type: 'budget_alert',
        category,
        spent,
        budget,
        currency,
      });
    }
  }
}