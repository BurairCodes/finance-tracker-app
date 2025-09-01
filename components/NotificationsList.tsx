import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Bell,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Shield,
  Trash2,
  Check,
  Clock,
} from 'lucide-react-native';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationService } from '@/services/notificationService';
import { useAuth } from '@/hooks/useAuth';
import Theme from '@/constants/Theme';

const NotificationsList: React.FC = () => {
  const { user } = useAuth();
  const {
    notifications,
    loading,
    error,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotifications();

  // Remove automatic notification generation - notifications should only be created based on real events

  const handleMarkAllAsRead = () => {
    Alert.alert(
      'Mark All as Read',
      'Are you sure you want to mark all notifications as read?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark All Read', onPress: markAllAsRead },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to delete all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearAllNotifications },
      ]
    );
  };

  const handleDeleteNotification = (notificationId: string, title: string) => {
    Alert.alert(
      'Delete Notification',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteNotification(notificationId) },
      ]
    );
  };



  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'budget':
        return <AlertTriangle size={20} color={Theme.colors.warning} />;
      case 'bill':
        return <Calendar size={20} color={Theme.colors.info} />;
      case 'insight':
        return <TrendingUp size={20} color={Theme.colors.success} />;
      case 'security':
        return <Shield size={20} color={Theme.colors.error} />;
      default:
        return <Bell size={20} color={Theme.colors.textSecondary} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'budget':
        return Theme.colors.warningLight;
      case 'bill':
        return Theme.colors.infoLight;
      case 'insight':
        return Theme.colors.successLight;
      case 'security':
        return Theme.colors.errorLight;
      default:
        return Theme.colors.backgroundSecondary;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchNotifications}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Bell size={48} color={Theme.colors.textSecondary} />
        <Text style={styles.emptyTitle}>No notifications yet</Text>
        <Text style={styles.emptyText}>
          You&apos;ll see budget alerts, bill reminders, and financial insights here
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Actions */}
      <View style={styles.headerActions}>
        <View style={styles.unreadInfo}>
          <Text style={styles.unreadCount}>{unreadCount} unread</Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleMarkAllAsRead}>
            <Check size={16} color={Theme.colors.primary} />
            <Text style={styles.actionButtonText}>Mark All Read</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleClearAll}>
            <Trash2 size={16} color={Theme.colors.error} />
            <Text style={[styles.actionButtonText, { color: Theme.colors.error }]}>Clear All</Text>
          </TouchableOpacity>
        </View>
      </View>



      {/* Notifications List */}
      <ScrollView
        style={styles.notificationsList}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchNotifications} />
        }
      >
        {notifications.map((notification) => (
          <TouchableOpacity
            key={notification.id}
            style={[
              styles.notificationItem,
              !notification.is_read && styles.unreadNotification,
            ]}
            onPress={() => !notification.is_read && markAsRead(notification.id)}
          >
            {/* Notification Icon */}
            <View style={[styles.notificationIcon, { backgroundColor: getNotificationColor(notification.type) }]}>
              {getNotificationIcon(notification.type)}
            </View>

            {/* Notification Content */}
            <View style={styles.notificationContent}>
              <View style={styles.notificationHeader}>
                <Text style={[
                  styles.notificationTitle,
                  !notification.is_read && styles.unreadTitle
                ]}>
                  {notification.title}
                </Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteNotification(notification.id, notification.title)}
                >
                  <Trash2 size={14} color={Theme.colors.textTertiary} />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.notificationMessage}>
                {notification.message}
              </Text>
              
              <View style={styles.notificationFooter}>
                <View style={styles.timestampContainer}>
                  <Clock size={12} color={Theme.colors.textTertiary} />
                  <Text style={styles.timestamp}>
                    {formatTimestamp(notification.created_at)}
                  </Text>
                </View>
                
                {!notification.is_read && (
                  <View style={styles.unreadIndicator}>
                    <Text style={styles.unreadIndicatorText}>New</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  unreadInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadCount: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    fontFamily: 'Inter-Regular',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: Theme.colors.backgroundSecondary,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    color: Theme.colors.primary,
    fontFamily: 'Inter-SemiBold',
  },
  notificationsList: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    backgroundColor: Theme.colors.background,
  },
  unreadNotification: {
    backgroundColor: Theme.colors.primaryLight,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  deleteButton: {
    padding: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timestamp: {
    fontSize: 12,
    color: Theme.colors.textTertiary,
    fontFamily: 'Inter-Regular',
  },
  unreadIndicator: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadIndicatorText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Theme.colors.textSecondary,
    fontFamily: 'Inter-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: Theme.colors.error,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    fontFamily: 'Inter-SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },

});

export default NotificationsList;
