import React from 'react';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  User, 
  Globe, 
  Bell, 
  Shield, 
  FileText, 
  LogOut,
  ChevronRight,
  ChevronLeft,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import AuthScreen from '@/components/AuthScreen';
import ProfileModal from '@/components/ProfileModal';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import { PDFService } from '@/services/pdfService';
import { useTransactions } from '@/hooks/useTransactions';
import { useBudgets } from '@/hooks/useBudgets';
import { router } from 'expo-router';
import Theme from '@/constants/Theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { profile, updateProfile, loading: profileLoading, error: profileError, refetch } = useProfile(user?.id);
  const { transactions } = useTransactions(user?.id);
  const { budgets } = useBudgets(user?.id);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [dailySummary, setDailySummary] = useState(false);
  const [smsAuth, setSmsAuth] = useState(false);
  const [appAuth, setAppAuth] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    budgetAlerts: true,
    dailySummary: false,
  });

  // Load notification settings from AsyncStorage or use defaults
  useEffect(() => {
    // In a real app, you'd load these from AsyncStorage or backend
    // For now, we'll use local state
    setNotificationSettings({
      budgetAlerts: budgetAlerts,
      dailySummary: dailySummary,
    });
  }, []);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await signOut();
              if (error) {
                Alert.alert('Error', 'Failed to sign out. Please try again.');
              }
            } catch (error) {
              Alert.alert('Error', 'An unexpected error occurred during sign out.');
            }
          }
        },
      ]
    );
  };

  const handleExportData = async () => {
    Alert.alert(
      'Export Data',
      'Generate a monthly financial report?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Export', 
          onPress: async () => {
            setExportingData(true);
            try {
              // Basic validation
              if (!transactions || transactions.length === 0) {
                Alert.alert(
                  'No Data Available', 
                  'You need to have transactions to generate a report. Please add some transactions first.',
                  [{ text: 'OK' }]
                );
                return;
              }

              const currentDate = new Date();
              const currentMonth = currentDate.getMonth();
              const currentYear = currentDate.getFullYear();

              // Check if there are transactions for current month
              const monthlyTransactions = transactions.filter(t => {
                try {
                  const date = new Date(t.date);
                  const isCurrentMonth = date.getMonth() === currentMonth && date.getFullYear() === currentYear;
                  return isCurrentMonth;
                } catch (error) {
                  console.warn('Invalid transaction date:', t.date, error);
                  return false;
                }
              });

              if (monthlyTransactions.length === 0) {
                Alert.alert(
                  'No Data for Current Month',
                  `No transactions found for ${currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}. Would you like to export all transactions instead?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Export All', 
                      onPress: async () => {
                        try {
                          await PDFService.generateMonthlyReport(
                            transactions,
                            budgets || [],
                            currentMonth,
                            currentYear,
                            user?.email || profile?.email || 'Unknown User'
                          );
                          
                          Alert.alert('Success', 'Report generated and shared successfully!');
                        } catch (error) {
                          console.error('Export all error:', error);
                          Alert.alert('Error', `Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`);
                        }
                      }
                    }
                  ]
                );
                return;
              }

              await PDFService.generateMonthlyReport(
                transactions,
                budgets || [],
                currentMonth,
                currentYear,
                user?.email || profile?.email || 'Unknown User'
              );
              
              Alert.alert(
                'Success', 
                'Report generated and shared successfully! You can find it in your downloads or shared files.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Export error:', error);
              
              // Provide more specific error messages
              let errorMessage = 'Failed to generate report. Please try again.';
              
              if (error instanceof Error) {
                if (error.message.includes('No transactions found')) {
                  errorMessage = 'No transactions found for the selected month. Please add some transactions first.';
                } else if (error.message.includes('User email is required')) {
                  errorMessage = 'User information is missing. Please try logging out and back in.';
                } else if (error.message.includes('Sharing is not available')) {
                  errorMessage = 'File sharing is not available on this device. Please try on a different device.';
                } else if (error.message.includes('Unable to access file system')) {
                  errorMessage = 'Unable to access file system. Please check your device permissions.';
                } else {
                  errorMessage = `Export failed: ${error.message}`;
                }
              }
              
              Alert.alert('Export Failed', errorMessage, [{ text: 'OK' }]);
            } finally {
              setExportingData(false);
            }
          }
        },
      ]
    );
  };

  const handleProfileUpdate = async (updates: {
    full_name?: string | null;
    base_currency?: string;
  }) => {
    try {
      const { error } = await updateProfile(updates);
      if (error) {
        throw new Error(error);
      }
      // Refresh profile data to ensure UI updates
      await refetch();
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
      throw error; // Re-throw to let ProfileModal handle it
    }
  };

  const handleNotificationSettings = () => {
    setShowNotificationModal(true);
  };

  const handleCurrencySettings = () => {
    setShowProfileModal(true);
  };

  const handle2FASettings = () => {
    setShowSecurityModal(true);
  };

  const handleNotificationToggle = (setting: 'budgetAlerts' | 'dailySummary') => {
    const newSettings = {
      ...notificationSettings,
      [setting]: !notificationSettings[setting]
    };
    setNotificationSettings(newSettings);
    
    // In a real app, you'd save these to AsyncStorage or backend
  };

  const handleSecurityToggle = (setting: 'smsAuth' | 'appAuth') => {
    if (setting === 'smsAuth') {
      setSmsAuth(!smsAuth);
      Alert.alert(
        'SMS Authentication',
        smsAuth ? 'SMS authentication disabled' : 'SMS authentication enabled',
        [{ text: 'OK' }]
      );
    } else {
      setAppAuth(!appAuth);
      Alert.alert(
        'App Authentication',
        appAuth ? 'App authentication disabled' : 'App authentication enabled',
        [{ text: 'OK' }]
      );
    }
  };

  const handleChangePassword = () => {
    setShowChangePasswordModal(true);
  };

  if (!user) {
    return <AuthScreen />;
  }

  const settingsItems = [
    {
      title: 'Profile',
      subtitle: 'Manage your account information',
      icon: User,
      onPress: () => setShowProfileModal(true),
      badge: profileError ? 'Error' : undefined,
    },
    {
      title: 'Currency',
      subtitle: 'Set your default currency',
      icon: Globe,
      onPress: handleCurrencySettings,
    },
    {
      title: 'Notifications',
      subtitle: 'Manage budget alerts and reminders',
      icon: Bell,
      onPress: handleNotificationSettings,
    },
    {
      title: 'Security',
      subtitle: 'Password and 2FA settings',
      icon: Shield,
      onPress: handle2FASettings,
    },
    {
      title: 'Export Data',
      subtitle: 'Download your financial reports',
      icon: FileText,
      onPress: handleExportData,
      loading: exportingData,
    },
    {
      title: 'Admin Panel',
      subtitle: 'View system analytics (Demo)',
      icon: Shield,
      onPress: () => router.push('/admin'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* User Info */}
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            {profileLoading ? (
              <ActivityIndicator size="small" color={Theme.colors.primary} />
            ) : profileError ? (
              <AlertCircle size={32} color={Theme.colors.error} />
            ) : (
              <User size={32} color="#6B7280" />
            )}
          </View>
          <View style={styles.userInfo}>
            {profileLoading ? (
              <Text style={styles.userName}>Loading...</Text>
            ) : profileError ? (
              <Text style={styles.userName}>Error loading profile</Text>
            ) : (
              <>
                <Text style={styles.userName}>
                  {profile?.full_name || user.user_metadata?.full_name || 'User'}
                </Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <Text style={styles.userCurrency}>
                  Base Currency: {profile?.base_currency || 'PKR'}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Settings List */}
        <View style={styles.settingsList}>
          {settingsItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.settingsItem}
              onPress={item.onPress}
              disabled={item.loading}
            >
              <View style={styles.settingsIcon}>
                {item.loading ? (
                  <ActivityIndicator size="small" color={Theme.colors.primary} />
                ) : (
                  <item.icon size={20} color="#6B7280" />
                )}
              </View>
              <View style={styles.settingsContent}>
                <View style={styles.settingsTitleRow}>
                  <Text style={styles.settingsTitle}>{item.title}</Text>
                  {item.badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.settingsSubtitle}>{item.subtitle}</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color="#DC2626" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>v1.0.0</Text>
        </View>
      </ScrollView>

      <ProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSave={handleProfileUpdate}
        profile={profile}
      />

      <ChangePasswordModal
        visible={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />

      {/* Notification Settings Modal */}
      <Modal
        visible={showNotificationModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNotificationModal(false)}>
              <ChevronLeft size={24} color={Theme.colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Notification Settings</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>Budget Alerts</Text>
                <Text style={styles.settingDescription}>
                  Get notified when you approach or exceed your budget limits
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, notificationSettings.budgetAlerts && styles.toggleActive]}
                onPress={() => handleNotificationToggle('budgetAlerts')}
              >
                <View style={[styles.toggleThumb, notificationSettings.budgetAlerts && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>Daily Summary</Text>
                <Text style={styles.settingDescription}>
                  Receive daily spending summaries and insights
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, notificationSettings.dailySummary && styles.toggleActive]}
                onPress={() => handleNotificationToggle('dailySummary')}
              >
                <View style={[styles.toggleThumb, notificationSettings.dailySummary && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                These settings control your notification preferences. Changes are saved automatically.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Security Settings Modal */}
      <Modal
        visible={showSecurityModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSecurityModal(false)}>
              <ChevronLeft size={24} color={Theme.colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Security Settings</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>SMS Authentication</Text>
                <Text style={styles.settingDescription}>
                  Enable two-factor authentication via SMS
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, smsAuth && styles.toggleActive]}
                onPress={() => handleSecurityToggle('smsAuth')}
              >
                <View style={[styles.toggleThumb, smsAuth && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>App Authentication</Text>
                <Text style={styles.settingDescription}>
                  Use authenticator app for two-factor authentication
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, appAuth && styles.toggleActive]}
                onPress={() => handleSecurityToggle('appAuth')}
              >
                <View style={[styles.toggleThumb, appAuth && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.changePasswordButton} onPress={handleChangePassword}>
              <Text style={styles.changePasswordText}>Change Password</Text>
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Security features help protect your financial data. Two-factor authentication adds an extra layer of security to your account.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  title: {
    fontSize: Theme.typography.fontSize['2xl'],
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily.bold,
  },
  content: {
    flex: 1,
    paddingBottom: Platform.OS === 'ios' ? 95 : 70,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Theme.spacing.lg,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    ...Theme.cards.card,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: Theme.typography.fontSize.lg,
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.xs,
    fontFamily: Theme.typography.fontFamily.bold,
  },
  userEmail: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  userCurrency: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily.regular,
    marginTop: Theme.spacing.xs,
  },
  settingsList: {
    marginHorizontal: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: Theme.spacing.lg,
    ...Theme.cards.card,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.md,
  },
  settingsContent: {
    flex: 1,
  },
  settingsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  settingsTitle: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily.semiBold,
    flex: 1,
  },
  badge: {
    backgroundColor: Theme.colors.error,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontFamily: Theme.typography.fontFamily.medium,
  },
  settingsSubtitle: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginHorizontal: Theme.spacing.lg,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  signOutText: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.error,
    marginLeft: Theme.spacing.sm,
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  appInfo: {
    alignItems: 'center',
    padding: Theme.spacing.md,
    paddingTop: Theme.spacing.xs,
  },
  appVersion: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.xs,
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  modalTitle: {
    fontSize: Theme.typography.fontSize.lg,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily.bold,
  },
  modalContent: {
    flex: 1,
    padding: Theme.spacing.lg,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
    ...Theme.cards.card,
  },
  settingInfo: {
    flex: 1,
    marginRight: Theme.spacing.md,
  },
  settingName: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.xs,
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  settingDescription: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: Theme.colors.surface,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: Theme.colors.primary,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Theme.colors.textPrimary,
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  changePasswordButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    marginTop: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  changePasswordText: {
    color: Theme.colors.primary,
    fontSize: Theme.typography.fontSize.base,
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  infoBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginTop: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  infoText: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.info,
    lineHeight: 20,
    fontFamily: Theme.typography.fontFamily.regular,
  },
});