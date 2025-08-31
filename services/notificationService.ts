import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { ExchangeRateService } from './exchangeRateService';

type NotificationType = 'budget' | 'bill' | 'insight' | 'security';
type Notification = Database['public']['Tables']['notifications']['Insert'];

export class NotificationService {
  // Request notification permissions
  static async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
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

  // Create notification in database
  static async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          is_read: false,
        });

      if (error) throw error;

      console.log(`✅ Created ${type} notification for user ${userId}`);
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  }

  // Budget alerts
  static async createBudgetAlert(
    userId: string,
    category: string,
    spent: number,
    budget: number,
    currency: string
  ): Promise<void> {
    const percentage = (spent / budget) * 100;
    let title = '';
    let message = '';

    if (percentage >= 100) {
      title = '🚨 Budget Exceeded!';
      message = `You've exceeded your ${category} budget by ${(percentage - 100).toFixed(1)}%. Current spending: ${currency} ${spent.toLocaleString()}`;
    } else if (percentage >= 80) {
      title = '⚠️ Budget Alert';
      message = `You've used ${percentage.toFixed(1)}% of your ${category} budget. Current spending: ${currency} ${spent.toLocaleString()}`;
    }

    if (title && message) {
      // Check if a similar notification already exists to prevent duplicates
      const { data: existingNotifications } = await supabase
        .from('notifications')
        .select('id, created_at')
        .eq('user_id', userId)
        .eq('type', 'budget')
        .eq('title', title)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .limit(1);

      // Only create notification if none exists in the last 24 hours
      if (!existingNotifications || existingNotifications.length === 0) {
        await this.createNotification(userId, 'budget', title, message);
        
        // Also show local notification if permissions granted
        const hasPermission = await this.requestPermissions();
        if (hasPermission) {
          await this.scheduleLocalNotification(title, message, {
            type: 'budget_alert',
            category,
            spent,
            budget,
            currency,
          });
        }
      }
    }
  }

  // Bill reminders
  static async createBillReminder(
    userId: string,
    billName: string,
    amount: number,
    currency: string,
    dueDate: Date,
    daysUntilDue: number
  ): Promise<void> {
    let title = '';
    let message = '';

    if (daysUntilDue === 0) {
      title = '📅 Bill Due Today!';
      message = `${billName} is due today. Amount: ${currency} ${amount.toLocaleString()}`;
    } else if (daysUntilDue === 1) {
      title = '📅 Bill Due Tomorrow!';
      message = `${billName} is due tomorrow. Amount: ${currency} ${amount.toLocaleString()}`;
    } else if (daysUntilDue <= 3) {
      title = '📅 Bill Due Soon!';
      message = `${billName} is due in ${daysUntilDue} days. Amount: ${currency} ${amount.toLocaleString()}`;
    }

    if (title && message) {
      await this.createNotification(userId, 'bill', title, message);
      
      // Show local notification
      const hasPermission = await this.requestPermissions();
      if (hasPermission) {
        await this.scheduleLocalNotification(title, message, {
          type: 'bill_reminder',
          billName,
          amount,
          currency,
          dueDate: dueDate.toISOString(),
        });
      }
    }
  }

  // Weekly financial insights
  static async createWeeklyInsight(
    userId: string,
    totalSpent: number,
    totalIncome: number,
    currency: string,
    topCategory: string,
    savingsRate: number
  ): Promise<void> {
    const netIncome = totalIncome - totalSpent;
    const title = '📊 Weekly Financial Summary';
    
    let message = `This week you spent ${currency} ${totalSpent.toLocaleString()}`;
    if (totalIncome > 0) {
      message += ` and earned ${currency} ${totalIncome.toLocaleString()}`;
      message += `\nNet: ${currency} ${netIncome.toLocaleString()}`;
    }
    
    if (topCategory) {
      message += `\nTop spending category: ${topCategory}`;
    }
    
    if (savingsRate > 0) {
      message += `\nSavings rate: ${savingsRate.toFixed(1)}%`;
    }

    await this.createNotification(userId, 'insight', title, message);
  }

  // Security alerts
  static async createSecurityAlert(
    userId: string,
    alertType: 'login' | '2fa' | 'suspicious' | 'password_change',
    details: string
  ): Promise<void> {
    const alertConfig = {
      login: { title: '🔐 New Login', icon: '🔐' },
      '2fa': { title: '🔒 2FA Update', icon: '🔒' },
      suspicious: { title: '🚨 Security Alert', icon: '🚨' },
      password_change: { title: '🔑 Password Changed', icon: '🔑' },
    };

    const config = alertConfig[alertType];
    const title = `${config.icon} ${config.title}`;
    const message = details;

    await this.createNotification(userId, 'security', title, message);
    
    // Security alerts should always show local notifications
    const hasPermission = await this.requestPermissions();
    if (hasPermission) {
      await this.scheduleLocalNotification(title, message, {
        type: 'security_alert',
        alertType,
        details,
      });
    }
  }

  // Create security alert with custom title and message
  static async createCustomSecurityAlert(
    userId: string,
    title: string,
    message: string
  ): Promise<void> {
    await this.createNotification(userId, 'security', title, message);
    
    // Security alerts should always show local notifications
    const hasPermission = await this.requestPermissions();
    if (hasPermission) {
      await this.scheduleLocalNotification(title, message, {
        type: 'security_alert',
        alertType: 'suspicious',
        details: message,
      });
    }
  }

  // Schedule local notification (for immediate display)
  static async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    if (Platform.OS === 'web') {
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

  // Schedule recurring notifications (e.g., weekly insights)
  static async scheduleRecurringNotification(
    title: string,
    body: string,
    data: any,
    hour: number = 9, // Default to 9 AM
    minute: number = 0
  ): Promise<void> {
    if (Platform.OS === 'web') return; // Web doesn't support recurring notifications

    try {
      // For now, just schedule a one-time notification
      // The actual recurring logic will be handled by the app's interval checks
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Failed to schedule recurring notification:', error);
    }
  }

  // Clear all scheduled notifications
  static async clearAllScheduledNotifications(): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to clear scheduled notifications:', error);
    }
  }

  // Get notification count for user
  static async getNotificationCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Failed to get notification count:', error);
      return 0;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  // Delete notification
  static async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }

  // Convert currency using ExchangeRateService
  static async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    try {
      if (fromCurrency === toCurrency) {
        return amount;
      }

      const convertedAmount = await ExchangeRateService.convertCurrency(
        amount,
        fromCurrency,
        toCurrency
      );

      return convertedAmount;
    } catch (error) {
      console.error('Currency conversion failed:', error);
      // Return original amount as fallback
      return amount;
    }
  }

  // Create a custom notification
  static async createCustomNotification(
    userId: string,
    type: 'budget' | 'bill' | 'insight' | 'security',
    title: string,
    message: string
  ): Promise<void> {
    try {
      await this.createNotification(userId, type, title, message);
    } catch (error) {
      console.error('Failed to create custom notification:', error);
    }
  }
}