import { OTPService } from './otpService';

// Simple test to verify OTP service functionality
describe('OTPService', () => {
  test('generateOTP should return a 6-digit number', () => {
    const otp = OTPService.generateOTP();
    expect(otp).toMatch(/^\d{6}$/);
    expect(parseInt(otp)).toBeGreaterThanOrEqual(100000);
    expect(parseInt(otp)).toBeLessThanOrEqual(999999);
  });

  test('validateOTPFormat should validate correct format', () => {
    expect(OTPService.validateOTPFormat('123456')).toBe(true);
    expect(OTPService.validateOTPFormat('000000')).toBe(true);
    expect(OTPService.validateOTPFormat('999999')).toBe(true);
  });

  test('validateOTPFormat should reject invalid format', () => {
    expect(OTPService.validateOTPFormat('12345')).toBe(false); // too short
    expect(OTPService.validateOTPFormat('1234567')).toBe(false); // too long
    expect(OTPService.validateOTPFormat('abcdef')).toBe(false); // non-numeric
    expect(OTPService.validateOTPFormat('')).toBe(false); // empty
  });

  test('clearCurrentOTP should reset state', () => {
    // Set some state
    (OTPService as any).currentOTP = '123456';
    (OTPService as any).currentConfig = { userId: 'test', method: 'sms' };
    
    OTPService.clearCurrentOTP();
    
    expect(OTPService.isVerificationInProgress()).toBe(false);
    expect(OTPService.getCurrentMethod()).toBe(null);
  });
});
