import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Shield, Smartphone, Mail, CheckCircle, AlertCircle } from 'lucide-react-native';
import { OTPService, OTPConfig } from '@/services/otpService';
import { NotificationService } from '@/services/notificationService';
import Theme from '@/constants/Theme';

interface TwoFactorAuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (method: 'sms' | 'app') => void;
  config: OTPConfig | null;
}

type Step = 'contact' | 'otp' | 'success';

export default function TwoFactorAuthModal({
  visible,
  onClose,
  onSuccess,
  config,
}: TwoFactorAuthModalProps) {
  const [step, setStep] = useState<Step>('contact');
  const [contactInfo, setContactInfo] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpGenerated, setOtpGenerated] = useState(false);

  const isSMS = config?.method === 'sms';
  const MethodIcon = isSMS ? Smartphone : Mail;
  const methodName = isSMS ? 'SMS' : 'App Auth';
  const contactLabel = isSMS ? 'Phone Number' : 'Email Address';
  const contactPlaceholder = isSMS ? '+1234567890' : 'your@email.com';

  useEffect(() => {
    if (visible && config) {
      setStep('contact');
      setContactInfo('');
      setOtpCode('');
      setError('');
      setOtpGenerated(false);
    }
  }, [visible, config]);

  const validateContact = (contact: string): boolean => {
    if (isSMS) {
      // Basic phone validation
      return /^\+?[\d\s\-\(\)]{10,}$/.test(contact);
    } else {
      // Basic email validation
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    }
  };

  const handleContactSubmit = async () => {
    if (!config || !contactInfo.trim()) {
      setError(`${contactLabel} is required`);
      return;
    }

    if (!validateContact(contactInfo.trim())) {
      setError(`Please enter a valid ${contactLabel.toLowerCase()}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Update config with contact info
      const updatedConfig: OTPConfig = {
        ...config,
        phoneNumber: isSMS ? contactInfo.trim() : undefined,
        email: !isSMS ? contactInfo.trim() : undefined,
      };

      // Generate and show OTP
      const success = await OTPService.startOTPVerification(updatedConfig);
      
      if (success) {
        setOtpGenerated(true);
        setStep('otp');
        // setCurrent2FAConfig(updatedConfig); // This line was not in the new_code, so I'm removing it.
      } else {
        setError('Failed to generate OTP. Please try again.');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async () => {
    if (!otpCode.trim()) {
      setError('Please enter the OTP code');
      return;
    }

    if (!OTPService.validateOTPFormat(otpCode.trim())) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    if (!config) {
      setError('Configuration error. Please try again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const isValid = await OTPService.verifyOTP(otpCode.trim());
      
      if (isValid) {
        setStep('success');
        
        // Call success handler after a brief delay
        setTimeout(() => {
          onSuccess(config.method);
        }, 1500);
      } else {
        setError('Invalid OTP code. Please try again.');
        setOtpCode('');
      }
    } catch (error) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!config) {
      setError('Configuration error. Please try again.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const updatedConfig: OTPConfig = {
        ...config,
        phoneNumber: isSMS ? contactInfo.trim() : undefined,
        email: !isSMS ? contactInfo.trim() : undefined,
      };

      const success = await OTPService.startOTPVerification(updatedConfig);
      
      if (success) {
        setOtpGenerated(true);
        // Don't show additional alert - the OTP service will show the main alert
      } else {
        setError('Failed to resend OTP. Please try again.');
      }
    } catch (error) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    
    if (step === 'otp' && otpGenerated) {
      Alert.alert(
        'Cancel Verification',
        'Are you sure you want to cancel? You will need to start over.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes, Cancel', style: 'destructive', onPress: onClose }
        ]
      );
    } else {
      onClose();
    }
  };

  if (!visible || !config) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} disabled={loading}>
              <X size={24} color={Theme.colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.title}>{methodName} Authentication</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Method Info */}
            <View style={styles.methodInfo}>
              <View style={styles.methodIcon}>
                <MethodIcon size={32} color={Theme.colors.primary} />
              </View>
              <Text style={styles.methodTitle}>
                {methodName} Two-Factor Authentication
              </Text>
              <Text style={styles.methodDescription}>
                {isSMS 
                  ? 'Enter your phone number to receive a verification code via SMS.'
                  : 'Enter your email address to receive a verification code.'
                }
              </Text>
            </View>

            {/* Contact Input Step */}
            {step === 'contact' && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Step 1: Enter {contactLabel}</Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{contactLabel}</Text>
                  <TextInput
                    style={[styles.input, error && styles.inputError]}
                    value={contactInfo}
                    onChangeText={setContactInfo}
                    placeholder={contactPlaceholder}
                    placeholderTextColor={Theme.colors.textTertiary}
                    keyboardType={isSMS ? 'phone-pad' : 'email-address'}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                  {error && <Text style={styles.errorText}>{error}</Text>}
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleContactSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={Theme.colors.white} />
                  ) : (
                    <Text style={styles.buttonText}>Continue</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* OTP Input Step */}
            {step === 'otp' && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Step 2: Enter Verification Code</Text>
                
                <View style={styles.otpInfo}>
                  <CheckCircle size={20} color={Theme.colors.success} />
                  <Text style={styles.otpInfoText}>
                    Verification code sent to {contactInfo}
                  </Text>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>6-Digit Code</Text>
                  <TextInput
                    style={[styles.input, styles.otpInput, error && styles.inputError]}
                    value={otpCode}
                    onChangeText={setOtpCode}
                    placeholder="123456"
                    placeholderTextColor={Theme.colors.textTertiary}
                    keyboardType="numeric"
                    maxLength={6}
                    editable={!loading}
                  />
                  {error && <Text style={styles.errorText}>{error}</Text>}
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleOTPSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={Theme.colors.white} />
                  ) : (
                    <Text style={styles.buttonText}>Verify</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleResendOTP}
                  disabled={loading}
                >
                  <Text style={styles.resendText}>Resend Code</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Success Step */}
            {step === 'success' && (
              <View style={styles.stepContainer}>
                <View style={styles.successContainer}>
                  <CheckCircle size={64} color={Theme.colors.success} />
                  <Text style={styles.successTitle}>Verification Successful!</Text>
                  <Text style={styles.successDescription}>
                    {methodName} two-factor authentication has been enabled for your account.
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  title: {
    fontSize: Theme.typography.fontSize.lg,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily.bold,
  },
  content: {
    flex: 1,
    padding: Theme.spacing.lg,
  },
  methodInfo: {
    alignItems: 'center',
    marginBottom: Theme.spacing['2xl'],
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
  },
  methodIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  methodTitle: {
    fontSize: Theme.typography.fontSize.lg,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily.bold,
    marginBottom: Theme.spacing.sm,
    textAlign: 'center',
  },
  methodDescription: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: Theme.typography.fontSize.lg,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily.bold,
    marginBottom: Theme.spacing.lg,
  },
  inputContainer: {
    marginBottom: Theme.spacing.lg,
  },
  inputLabel: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.sm,
    fontFamily: Theme.typography.fontFamily.medium,
  },
  input: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.textPrimary,
    backgroundColor: Theme.colors.surface,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  otpInput: {
    textAlign: 'center',
    fontSize: Theme.typography.fontSize['2xl'],
    fontFamily: Theme.typography.fontFamily.bold,
    letterSpacing: 8,
  },
  inputError: {
    borderColor: Theme.colors.error,
  },
  errorText: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.error,
    marginTop: Theme.spacing.sm,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  button: {
    backgroundColor: Theme.colors.primary,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  buttonDisabled: {
    backgroundColor: Theme.colors.textTertiary,
  },
  buttonText: {
    color: Theme.colors.white,
    fontSize: Theme.typography.fontSize.base,
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  resendButton: {
    alignItems: 'center',
    padding: Theme.spacing.md,
  },
  resendText: {
    color: Theme.colors.primary,
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.medium,
  },
  otpInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.lg,
  },
  otpInfoText: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.success,
    marginLeft: Theme.spacing.sm,
    fontFamily: Theme.typography.fontFamily.medium,
  },
  successContainer: {
    alignItems: 'center',
    padding: Theme.spacing['2xl'],
  },
  successTitle: {
    fontSize: Theme.typography.fontSize.xl,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily.bold,
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    textAlign: 'center',
  },
  successDescription: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: Theme.typography.fontFamily.regular,
  },
});
