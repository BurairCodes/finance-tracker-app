import { Platform } from 'react-native';
import Constants from 'expo-constants';

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scopes: string[];
  additionalParams: Record<string, string>;
}

export const GoogleOAuthConfig: GoogleOAuthConfig = {
  // These will be set from environment variables
  clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  
  // Redirect URI configuration - Android specific
  redirectUri: getAndroidRedirectUri(),
  
  // OAuth scopes for Android
  scopes: [
    'openid',
    'profile',
    'email',
  ],
  
  // Additional OAuth parameters optimized for Android
  additionalParams: {
    access_type: 'offline',
    prompt: 'consent',
    response_type: 'code',
  },
};

/**
 * Get the correct redirect URI for Android
 */
function getAndroidRedirectUri(): string {
  const scheme = Constants.expoConfig?.scheme || 'kharchax';
  
  if (Platform.OS === 'web') {
    // Web platform (if you ever deploy to web)
    if (__DEV__) {
      return 'http://localhost:8081/auth/callback';
    }
    return process.env.EXPO_PUBLIC_WEB_REDIRECT_URI || 'https://yourdomain.com/auth/callback';
  }
  
  if (Platform.OS === 'android') {
    // For development builds, use Supabase's redirect URL
    // Supabase will handle the OAuth flow and redirect back to your app
    return 'https://dcsbptgsewbjdxcsjpcn.supabase.co/auth/v1/callback';
  }
  
  // iOS fallback (if you ever support iOS)
  if (Platform.OS === 'ios') {
    return 'https://dcsbptgsewbjdxcsjpcn.supabase.co/auth/v1/callback';
  }
  
  // Default fallback
  return 'https://dcsbptgsewbjdxcsjpcn.supabase.co/auth/v1/callback';
}

/**
 * Validate Google OAuth configuration for Android
 */
export function validateGoogleOAuthConfig(): {
  isValid: boolean;
  errors: string[];
  config: GoogleOAuthConfig;
  platform: string;
} {
  const errors: string[] = [];
  
  if (!GoogleOAuthConfig.clientId) {
    errors.push('Google Client ID is not configured');
  }
  
  if (!GoogleOAuthConfig.redirectUri) {
    errors.push('Redirect URI is not configured');
  }
  
  if (GoogleOAuthConfig.scopes.length === 0) {
    errors.push('OAuth scopes are not configured');
  }
  
  // Android-specific validation
  if (Platform.OS === 'android') {
    if (!GoogleOAuthConfig.redirectUri.includes('supabase.co') && !GoogleOAuthConfig.redirectUri.includes('kharchax')) {
      errors.push('Android redirect URI must be either Supabase callback or app scheme');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    config: GoogleOAuthConfig,
    platform: Platform.OS,
  };
}

/**
 * Get OAuth URL for Google (Android optimized)
 */
export function getGoogleOAuthUrl(): string {
  const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const params = new URLSearchParams({
    client_id: GoogleOAuthConfig.clientId,
    redirect_uri: GoogleOAuthConfig.redirectUri,
    scope: GoogleOAuthConfig.scopes.join(' '),
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
  });
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Log configuration for debugging (Android focused)
 */
export function logGoogleOAuthConfig(): void {
  console.log('🔑 Google OAuth Configuration (Android):');
  console.log('📱 Platform:', Platform.OS);
  console.log('🔧 Development Mode:', __DEV__);
  console.log('🏷️ App Scheme:', Constants.expoConfig?.scheme);
  console.log('🔗 Redirect URI:', GoogleOAuthConfig.redirectUri);
  console.log('🆔 Client ID:', GoogleOAuthConfig.clientId ? 'Configured' : 'Not configured');
  console.log('🔒 Scopes:', GoogleOAuthConfig.scopes);
  
  // Android-specific logging
  if (Platform.OS === 'android') {
    console.log('🤖 Android-specific checks:');
    console.log('  - Package name:', Constants.expoConfig?.android?.package || 'Not set');
    console.log('  - App scheme:', Constants.expoConfig?.scheme || 'Not set');
    console.log('  - Development build:', __DEV__ ? 'Yes' : 'No');
  }
  
  const validation = validateGoogleOAuthConfig();
  if (!validation.isValid) {
    console.warn('⚠️ Google OAuth Configuration Issues:');
    validation.errors.forEach(error => console.warn(`  - ${error}`));
  } else {
    console.log('✅ Google OAuth Configuration is valid for Android');
  }
}

/**
 * Get Android-specific OAuth configuration
 */
export function getAndroidOAuthConfig() {
  return {
    clientId: GoogleOAuthConfig.clientId,
    redirectUri: GoogleOAuthConfig.redirectUri,
    scopes: GoogleOAuthConfig.scopes,
    platform: 'android',
    isDevelopment: __DEV__,
    appScheme: Constants.expoConfig?.scheme || 'kharchax',
    packageName: Constants.expoConfig?.android?.package || 'com.kharchax.app',
  };
}
