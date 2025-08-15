import React from 'react';
import { useState } from 'react';
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
  X
} from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import AuthScreen from '@/components/AuthScreen';
import ProfileModal from '@/components/ProfileModal';
import { PDFService } from '@/services/pdfService';
import { useTransactions } from '@/hooks/useTransactions';
import { useBudgets } from '@/hooks/useBudgets';
import { router } from 'expo-router';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { profile, updateProfile } = useProfile(user?.id);
  const { transactions } = useTransactions(user?.id);
  const { budgets } = useBudgets(user?.id);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [dailySummary, setDailySummary] = useState(false);
  const [smsAuth, setSmsAuth] = useState(false);
  const [appAuth, setAppAuth] = useState(false);

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
            const { error } = await signOut();
            if (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          }
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Generate a monthly financial report?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: async () => {
          try {
            const currentDate = new Date();
            await PDFService.generateMonthlyReport(
              transactions,
              budgets,
              currentDate.getMonth(),
              currentDate.getFullYear(),
              user?.email || ''
            );
          } catch (error) {
            Alert.alert('Error', 'Failed to generate report');
          }
        }},
      ]
    );
  };

  const handleProfileUpdate = async (updates: any) => {
    const { error } = await updateProfile(updates);
    if (error) {
      throw new Error(error);
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

  if (!user) {
    return <AuthScreen />;
  }

  const settingsItems = [
    {
      title: 'Profile',
      subtitle: 'Manage your account information',
      icon: User,
      onPress: () => setShowProfileModal(true),
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
            <User size={32} color="#6B7280" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {profile?.full_name || user.user_metadata?.full_name || 'User'}
            </Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.userCurrency}>
              Base Currency: {profile?.base_currency || 'PKR'}
            </Text>
          </View>
        </View>

        {/* Settings List */}
        <View style={styles.settingsList}>
          {settingsItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.settingsItem}
              onPress={item.onPress}
            >
              <View style={styles.settingsIcon}>
                <item.icon size={20} color="#6B7280" />
              </View>
              <View style={styles.settingsContent}>
                <Text style={styles.settingsTitle}>{item.title}</Text>
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

      {/* Notification Settings Modal */}
      <Modal
        visible={showNotificationModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNotificationModal(false)}>
              <X size={24} color="#6B7280" />
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
                style={[styles.toggle, budgetAlerts && styles.toggleActive]}
                onPress={() => setBudgetAlerts(!budgetAlerts)}
              >
                <View style={[styles.toggleThumb, budgetAlerts && styles.toggleThumbActive]} />
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
                style={[styles.toggle, dailySummary && styles.toggleActive]}
                onPress={() => setDailySummary(!dailySummary)}
              >
                <View style={[styles.toggleThumb, dailySummary && styles.toggleThumbActive]} />
              </TouchableOpacity>
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
              <X size={24} color="#6B7280" />
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
                onPress={() => setSmsAuth(!smsAuth)}
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
                onPress={() => setAppAuth(!appAuth)}
              >
                <View style={[styles.toggleThumb, appAuth && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.changePasswordButton}>
              <Text style={styles.changePasswordText}>Change Password</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    fontFamily: 'Inter-Bold',
  },
  content: {
    flex: 1,
    paddingBottom: Platform.OS === 'ios' ? 95 : 70,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
    fontFamily: 'Inter-Bold',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  userCurrency: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  settingsList: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsContent: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
    fontFamily: 'Inter-SemiBold',
  },
  settingsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 8,
    fontFamily: 'Inter-SemiBold',
  },
  appInfo: {
    alignItems: 'center',
    padding: 12,
    paddingTop: 4,
  },
  appVersion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  appDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    fontFamily: 'Inter-Bold',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#2563EB',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'white',
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  changePasswordButton: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  changePasswordText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});