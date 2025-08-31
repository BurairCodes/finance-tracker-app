import { Alert } from 'react-native';
import { NotificationService } from './notificationService';

export interface OTPConfig {
  userId: string;
  method: 'sms' | 'app';
  phoneNumber?: string;
  email?: string;
}

export class OTPService {
  private static currentOTP: string | null = null;
  private static currentConfig: OTPConfig | null = null;

  // Generate a random 6-digit OTP code (100000-999999)
  static generateOTP(): string {
    const min = 100000;
    const max = 999999;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  // Validate OTP format
  static validateOTPFormat(otp: string): boolean {
    return /^\d{6}$/.test(otp);
  }

  // Start OTP verification process
  static async startOTPVerification(config: OTPConfig): Promise<boolean> {
    try {
      // Generate new OTP
      const otp = this.generateOTP();
      this.currentOTP = otp;
      this.currentConfig = config;

      // Show OTP alert based on method
      if (config.method === 'sms') {
        await this.showSMSOTPAlert(otp, config.phoneNumber!);
      } else {
        await this.showAppOTPAlert(otp, config.email!);
      }

      return true;
    } catch (error) {
      console.error('Failed to start OTP verification:', error);
      return false;
    }
  }

  // Show SMS OTP alert
  static async showSMSOTPAlert(otp: string, phoneNumber: string): Promise<void> {
    return new Promise((resolve) => {
      Alert.alert(
        '🔐 SMS 2FA Verification',
        `A verification code has been sent to ${phoneNumber}\n\nYour OTP code is:\n\n${otp}\n\nEnter this code in the verification field to complete SMS 2FA setup.`,
        [
          {
            text: 'OK',
            style: 'default',
            onPress: () => resolve()
          }
        ],
        { cancelable: false }
      );
    });
  }

  // Show App OTP alert
  static async showAppOTPAlert(otp: string, email: string): Promise<void> {
    return new Promise((resolve) => {
      Alert.alert(
        '🔐 App Auth 2FA Verification',
        `A verification code has been sent to ${email}\n\nYour OTP code is:\n\n${otp}\n\nEnter this code in the verification field to complete App Auth 2FA setup.`,
        [
          {
            text: 'OK',
            style: 'default',
            onPress: () => resolve()
          }
        ],
        { cancelable: false }
      );
    });
  }

  // Verify OTP code
  static async verifyOTP(enteredOTP: string): Promise<boolean> {
    try {
      // Validate OTP format
      if (!this.validateOTPFormat(enteredOTP)) {
        Alert.alert('Invalid Code', 'Please enter a valid 6-digit code.');
        return false;
      }

      // Check if OTP matches
      if (this.currentOTP === enteredOTP && this.currentConfig) {
        // Store config before clearing
        const config = this.currentConfig;
        
        // Clear current OTP for security
        this.clearCurrentOTP();

        // Send success notification
        await this.sendSuccessNotification(config);

        Alert.alert(
          '✅ Verification Successful',
          `${config.method === 'sms' ? 'SMS' : 'App Auth'} 2FA has been successfully enabled!`,
          [{ text: 'OK' }]
        );

        return true;
      } else {
        Alert.alert(
          '❌ Verification Failed',
          'The code you entered is incorrect. Please try again.',
          [{ text: 'OK' }]
        );
        return false;
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      Alert.alert('Error', 'An error occurred during verification. Please try again.');
      return false;
    }
  }

  // Send success notification
  static async sendSuccessNotification(config: OTPConfig): Promise<void> {
    try {
      const methodName = config.method === 'sms' ? 'SMS' : 'App Auth';
      const title = `✅ ${methodName} 2FA Verified Successfully`;
      const message = `${methodName} two-factor authentication has been successfully enabled for your account.`;

      await NotificationService.createCustomSecurityAlert(
        config.userId,
        title,
        message
      );
    } catch (error) {
      console.error('Failed to send success notification:', error);
    }
  }

  // Clear current OTP (for security)
  static clearCurrentOTP(): void {
    this.currentOTP = null;
    this.currentConfig = null;
  }

  // Check if OTP verification is in progress
  static isVerificationInProgress(): boolean {
    return this.currentOTP !== null;
  }

  // Get current verification method
  static getCurrentMethod(): 'sms' | 'app' | null {
    return this.currentConfig?.method || null;
  }

  // Cancel OTP verification
  static cancelVerification(): void {
    this.clearCurrentOTP();
  }
}
