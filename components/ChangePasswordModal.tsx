import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Eye, EyeOff, Lock, Shield, AlertCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import Theme from '@/constants/Theme';

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ visible, onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      // Reset form when modal opens
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  }, [visible]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      newErrors.newPassword = 'Password must contain uppercase, lowercase, and number';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Step 1: Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        setErrors({ currentPassword: 'Current password is incorrect' });
        return;
      }

      // Step 2: Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      Alert.alert(
        'Success',
        'Password updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Password change error:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to update password. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) {
      return; // Prevent closing while loading
    }
    onClose();
  };

  const renderPasswordInput = (
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    showPassword: boolean,
    onToggleShow: () => void,
    error?: string,
    fieldName?: string
  ) => (
    <View style={styles.inputContainer}>
      <View style={[styles.inputWrapper, error && styles.inputError]}>
        <Lock size={20} color={Theme.colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={(text) => {
            onChangeText(text);
            if (error && fieldName) {
              setErrors(prev => ({ ...prev, [fieldName]: '' }));
            }
          }}
          placeholder={placeholder}
          placeholderTextColor={Theme.colors.textSecondary}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />
        <TouchableOpacity onPress={onToggleShow} style={styles.eyeIcon}>
          {showPassword ? (
            <EyeOff size={20} color={Theme.colors.textSecondary} />
          ) : (
            <Eye size={20} color={Theme.colors.textSecondary} />
          )}
        </TouchableOpacity>
      </View>
      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle size={14} color={Theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <ChevronLeft size={24} color={Theme.colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Change Password</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Shield size={48} color={Theme.colors.primary} />
          </View>

          <Text style={styles.description}>
            Update your password to keep your account secure. Your new password must be at least 6 characters long and contain uppercase, lowercase, and numeric characters.
          </Text>

          {/* Current Password */}
          {renderPasswordInput(
            currentPassword,
            setCurrentPassword,
            'Current Password',
            showCurrentPassword,
            () => setShowCurrentPassword(!showCurrentPassword),
            errors.currentPassword,
            'currentPassword'
          )}

          {/* New Password */}
          {renderPasswordInput(
            newPassword,
            setNewPassword,
            'New Password',
            showNewPassword,
            () => setShowNewPassword(!showNewPassword),
            errors.newPassword,
            'newPassword'
          )}

          {/* Confirm Password */}
          {renderPasswordInput(
            confirmPassword,
            setConfirmPassword,
            'Confirm New Password',
            showConfirmPassword,
            () => setShowConfirmPassword(!showConfirmPassword),
            errors.confirmPassword,
            'confirmPassword'
          )}

          {/* Password Requirements */}
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>Password Requirements:</Text>
            <View style={styles.requirementItem}>
              <Text style={[styles.requirementText, newPassword.length >= 6 && styles.requirementMet]}>
                • At least 6 characters
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <Text style={[styles.requirementText, /[a-z]/.test(newPassword) && styles.requirementMet]}>
                • Contains lowercase letter
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <Text style={[styles.requirementText, /[A-Z]/.test(newPassword) && styles.requirementMet]}>
                • Contains uppercase letter
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <Text style={[styles.requirementText, /\d/.test(newPassword) && styles.requirementMet]}>
                • Contains number
              </Text>
            </View>
          </View>

          {/* Future Authentication Methods (Placeholder) */}
          <View style={styles.futureAuthContainer}>
            <Text style={styles.futureAuthTitle}>Additional Security (Coming Soon)</Text>
            <View style={styles.futureAuthItem}>
              <Text style={styles.futureAuthText}>• Email verification for password changes</Text>
            </View>
            <View style={styles.futureAuthItem}>
              <Text style={styles.futureAuthText}>• SMS verification for password changes</Text>
            </View>
            <View style={styles.futureAuthItem}>
              <Text style={styles.futureAuthText}>• Two-factor authentication</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleClose}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleChangePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Theme.colors.textPrimary} size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputError: {
    borderColor: Theme.colors.error,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Theme.colors.textPrimary,
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 4,
  },
  errorText: {
    fontSize: 14,
    color: Theme.colors.error,
    marginLeft: 6,
  },
  requirementsContainer: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    marginBottom: 12,
  },
  requirementItem: {
    marginBottom: 6,
  },
  requirementText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  requirementMet: {
    color: Theme.colors.success,
    fontWeight: '500',
  },
  futureAuthContainer: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    opacity: 0.6,
  },
  futureAuthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    marginBottom: 12,
  },
  futureAuthItem: {
    marginBottom: 6,
  },
  futureAuthText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  saveButton: {
    backgroundColor: Theme.colors.primary,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
});
