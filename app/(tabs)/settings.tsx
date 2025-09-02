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
  Image,
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
  AlertCircle,
  CheckCircle
} from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import AuthScreen from '@/components/AuthScreen';
import ProfileModal from '@/components/ProfileModal';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import NotificationsList from '@/components/NotificationsList';
import TwoFactorAuthModal from '@/components/TwoFactorAuthModal';
import { NotificationService } from '@/services/notificationService';
import { OTPService, OTPConfig } from '@/services/otpService';

// Removed unused PDFService import
import { ExportService } from '@/services/exportService';
import { ExchangeRateService } from '@/services/exchangeRateService';
import { useTransactions } from '@/hooks/useTransactions';
import { useBudgets } from '@/hooks/useBudgets';
import { router } from 'expo-router';
import Theme from '@/constants/Theme';
import GoogleOAuthTest from '@/components/GoogleOAuthTest';
import NativeGoogleSignInTest from '@/components/NativeGoogleSignInTest';

// Removed unused screen dimensions

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { profile, updateProfile, loading: profileLoading, error: profileError, refetch } = useProfile(user?.id);
  const { transactions } = useTransactions(user?.id);
  const { budgets } = useBudgets(user?.id);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [budgetAlerts] = useState(true);
  const [dailySummary] = useState(false);
  const [smsAuth, setSmsAuth] = useState(false);
  const [appAuth, setAppAuth] = useState(false);
  const [current2FAConfig, setCurrent2FAConfig] = useState<OTPConfig | null>(null);
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
  }, [budgetAlerts, dailySummary]);

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



  // Removed unused handleClearAllNotifications function

  const handleExportData = async () => {
    setExportingData(true);
    try {
      Alert.alert(
        'Export Data',
        'Choose what to export:',
        [
          {
            text: 'Transactions (CSV)',
            onPress: async () => {
              try {
                await ExportService.exportTransactionsToCSV(transactions);
                Alert.alert('Success', 'Transactions exported successfully!');
              } catch {
                Alert.alert('Error', 'Failed to export transactions');
              }
            }
          },
          {
            text: 'Budgets (CSV)',
            onPress: async () => {
              try {
                await ExportService.exportBudgetsToCSV(budgets);
                Alert.alert('Success', 'Budgets exported successfully!');
              } catch {
                Alert.alert('Error', 'Failed to export budgets');
              }
            }
          },
          {
            text: 'Monthly Report',
            onPress: async () => {
              try {
                const report = ExportService.generateMonthlyReport(transactions);
                Alert.alert(
                  'Monthly Report',
                  `Income: ${ExchangeRateService.formatCurrency(report.totalIncome, 'USD')}\nExpenses: ${ExchangeRateService.formatCurrency(report.totalExpenses, 'USD')}\nNet Savings: ${ExchangeRateService.formatCurrency(report.netSavings, 'USD')}\n\nTop Categories:\n${report.topCategories.map(cat => `• ${cat.category}: ${ExchangeRateService.formatCurrency(cat.amount, 'USD')}`).join('\n')}`
                );
              } catch {
                Alert.alert('Error', 'Failed to generate report');
              }
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } catch {
      Alert.alert('Error', 'Failed to export data');
    } finally {
      setExportingData(false);
    }
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
      
             // Show success message with currency change notification if applicable
       if (updates.base_currency) {
         Alert.alert(
           'Success', 
           `Profile updated successfully! Your base currency has been changed to ${updates.base_currency}. All amounts will now be displayed in ${updates.base_currency}.`,
           [
             { 
               text: 'Restart App', 
               onPress: () => {
                 // In a real app, you might want to trigger an app restart
                 Alert.alert(
                   'Restart Required',
                   'Please restart the app for all currency changes to take effect across all screens.',
                   [{ text: 'OK' }]
                 );
               }
             },
             { text: 'OK' }
           ]
         );
       } else {
         Alert.alert('Success', 'Profile updated successfully!');
       }
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
    // Currency settings are now handled in the Profile tab
    setShowProfileModal(true);
  };

  const handle2FASettings = () => {
    setShowSecurityModal(true);
  };

  // Removed unused handleNotificationToggle function

  const handleSecurityToggle = async (setting: 'smsAuth' | 'appAuth') => {
    if (!user) return;

    // If turning off, show confirmation dialog
    if ((setting === 'smsAuth' && smsAuth) || (setting === 'appAuth' && appAuth)) {
      const methodName = setting === 'smsAuth' ? 'SMS' : 'App Auth';
      
      Alert.alert(
        `Disable ${methodName} 2FA`,
        `Are you sure you want to disable ${methodName} two-factor authentication?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Disable', 
            style: 'destructive',
            onPress: async () => {
              if (setting === 'smsAuth') {
                setSmsAuth(false);
              } else {
                setAppAuth(false);
              }
              
              // Trigger disable notification
              const notificationMessage = `❌ ${methodName} 2FA disabled successfully`;
              try {
                await NotificationService.createNotification(
                  user.id,
                  'security',
                  'Two-Factor Authentication',
                  notificationMessage
                );
              } catch (error) {
                console.error('Failed to create disable notification:', error);
              }
            }
          }
        ]
      );
      return;
    }

    // If turning on, start 2FA setup
    const config: OTPConfig = {
      userId: user.id,
      method: setting === 'smsAuth' ? 'sms' : 'app',
    };

    setCurrent2FAConfig(config);
    setShow2FAModal(true);
  };

  const handle2FASuccess = async (method: 'sms' | 'app') => {
    if (!user) return;
    
    if (method === 'sms') {
      setSmsAuth(true);
    } else {
      setAppAuth(true);
    }
    
    setShow2FAModal(false);
    setCurrent2FAConfig(null);
    
    // Success notification is already handled in the modal
    // This ensures the state is properly updated
  };

  const handle2FAClose = () => {
    setShow2FAModal(false);
    setCurrent2FAConfig(null);
    OTPService.cancelVerification();
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
      subtitle: 'Set your default currency (via Profile)',
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
      subtitle: 'View system analytics',
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
                  Base Currency: {profile?.base_currency || 'PKR'} ({ExchangeRateService.getCurrencySymbol(profile?.base_currency || 'PKR')})
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



        {/* Native Google Sign-In Test Section */}
        <View style={styles.oauthTestSection}>
          <Text style={styles.oauthTestTitle}>Native Google Sign-In</Text>
          <Text style={styles.oauthTestSubtitle}>Test native Android Google Sign-In (no browser!)</Text>
          <NativeGoogleSignInTest />
        </View>

        {/* Google OAuth Test Section */}
        <View style={styles.oauthTestSection}>
          <Text style={styles.oauthTestTitle}>Web-Based Google OAuth</Text>
          <Text style={styles.oauthTestSubtitle}>Test web-based Google OAuth (opens browser)</Text>
          <GoogleOAuthTest />
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color="#DC2626" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Image
            source={require('@/assets/images/kharchax-logo.png')}
            style={styles.appLogo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>KharchaX</Text>
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

      {/* Two-Factor Authentication Modal */}
      <TwoFactorAuthModal
        visible={show2FAModal}
        onClose={handle2FAClose}
        onSuccess={handle2FASuccess}
        config={current2FAConfig}
      />

      {/* Notifications Page */}
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
            <Text style={styles.modalTitle}>Notifications</Text>
            <View style={{ width: 24 }} />
          </View>

          <NotificationsList />
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
            {/* Security Status Summary */}
            <View style={styles.securityStatusContainer}>
              <Text style={styles.securityStatusTitle}>Security Status</Text>
              <View style={styles.securityStatusItem}>
                <Text style={styles.securityStatusLabel}>SMS 2FA:</Text>
                <Text style={[styles.securityStatusValue, smsAuth && styles.securityStatusActive]}>
                  {smsAuth ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
              <View style={styles.securityStatusItem}>
                <Text style={styles.securityStatusLabel}>App Auth 2FA:</Text>
                <Text style={[styles.securityStatusValue, appAuth && styles.securityStatusActive]}>
                  {appAuth ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>SMS Authentication</Text>
                <Text style={styles.settingDescription}>
                  {smsAuth 
                    ? '✅ SMS 2FA is enabled and active'
                    : 'Enable two-factor authentication via SMS'
                  }
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
                  {appAuth 
                    ? '✅ App Auth 2FA is enabled and active'
                    : 'Use authenticator app for two-factor authentication'
                  }
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
  appLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: Theme.spacing.sm,
  },
  appName: {
    fontSize: Theme.typography.fontSize.lg,
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.xs,
    fontFamily: Theme.typography.fontFamily.bold,
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
  securityStatusContainer: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  securityStatusTitle: {
    fontSize: Theme.typography.fontSize.lg,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily.bold,
    marginBottom: Theme.spacing.md,
  },
  securityStatusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  securityStatusLabel: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily.medium,
  },
  securityStatusValue: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  securityStatusActive: {
    color: Theme.colors.success,
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.primary,
    fontFamily: 'Inter-SemiBold',
  },
  oauthTestSection: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  oauthTestTitle: {
    fontSize: Theme.typography.fontSize.lg,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily.bold,
    marginBottom: Theme.spacing.sm,
  },
  oauthTestSubtitle: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily.regular,
    marginBottom: Theme.spacing.md,
  },

});