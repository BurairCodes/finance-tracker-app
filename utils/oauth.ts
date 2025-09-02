import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const OAuthUtils = {
  /**
   * Get the redirect URL for OAuth providers (Android optimized)
   * This should match what's configured in your Supabase project
   */
  getRedirectUrl: (): string => {
    if (Platform.OS === 'web') {
      // For web, use Supabase auth callback
      return 'http://localhost:8081/auth/callback';
    }
    
    // Android-specific redirect URLs
    // For development builds, use Supabase's redirect URL
    // Supabase will handle the OAuth flow and redirect back to your app
    if (Platform.OS === 'android') {
      return 'https://dcsbptgsewbjdxcsjpcn.supabase.co/auth/v1/callback';
    }
    
    // iOS fallback (if you ever support iOS)
    if (Platform.OS === 'ios') {
      return 'https://dcsbptgsewbjdxcsjpcn.supabase.co/auth/v1/callback';
    }
    
    // Default fallback
    return 'https://dcsbptgsewbjdxcsjpcn.supabase.co/auth/v1/callback';
  },

  /**
   * Handle OAuth redirects for Android
   * This function should be called when the app is opened via a deep link
   */
  handleOAuthRedirect: async (url: string) => {
    try {
      console.log('🔗 Android OAuth redirect received:', url);
      
      // Parse the URL to extract OAuth parameters
      const { queryParams } = Linking.parse(url);
      
      // Check if this is an OAuth callback
      if (queryParams?.access_token || queryParams?.refresh_token) {
        // The Supabase client will automatically handle the session
        console.log('✅ Android OAuth redirect handled successfully');
        return true;
      }
      
      // Check for error parameters
      if (queryParams?.error) {
        console.error('❌ Android OAuth error:', queryParams.error);
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error handling Android OAuth redirect:', error);
      return false;
    }
  },

  /**
   * Set up OAuth redirect listener for Android
   * This should be called in your app's root component
   */
  setupOAuthListener: () => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('🔗 Android deep link received:', url);
      OAuthUtils.handleOAuthRedirect(url);
    });

    return subscription;
  },

  /**
   * Get the OAuth configuration for Android
   */
  getOAuthConfig: () => {
    const redirectUrl = OAuthUtils.getRedirectUrl();
    
    return {
      redirectTo: redirectUrl,
      platform: Platform.OS,
      isAndroid: Platform.OS === 'android',
      isDevelopment: __DEV__,
      // Additional OAuth options can be added here
    };
  },

  /**
   * Get the actual redirect URL for Android development builds
   */
  getDevelopmentBuildRedirectUrl: () => {
    // For development builds, use Supabase's redirect URL
    // Supabase will handle the OAuth flow and redirect back to your app
    return 'https://dcsbptgsewbjdxcsjpcn.supabase.co/auth/v1/callback';
  },

  /**
   * Get the correct redirect URL based on platform and environment (Android focused)
   */
    getPlatformSpecificRedirectUrl: (): string => {
    if (Platform.OS === 'web') {
      return `${window.location.origin}/auth/callback`;
    }
    
    if (Platform.OS === 'android') {
      // For development builds, use Supabase's redirect URL
      // Supabase will handle the OAuth flow and redirect back to your app
      return 'https://dcsbptgsewbjdxcsjpcn.supabase.co/auth/v1/callback';
    }
    
    // iOS fallback
    if (Platform.OS === 'ios') {
      return 'https://dcsbptgsewbjdxcsjpcn.supabase.co/auth/v1/callback';
    }
    
    // Default fallback
    return 'https://dcsbptgsewbjdxcsjpcn.supabase.co/auth/v1/callback';
  },

  /**
   * Validate OAuth configuration for Android
   */
  validateOAuthConfig: () => {
    const redirectUrl = OAuthUtils.getPlatformSpecificRedirectUrl();
    console.log('🔗 Android OAuth Redirect URL:', redirectUrl);
    console.log('📱 Platform:', Platform.OS);
    console.log('🔧 Development Mode:', __DEV__);
    console.log('🏷️ App Scheme:', Constants.expoConfig?.scheme);
    console.log('🤖 Package Name:', Constants.expoConfig?.android?.package);
    
    // Android-specific validation
    if (Platform.OS === 'android') {
      if (!Constants.expoConfig?.android?.package) {
        console.warn('⚠️ Android package name not configured');
      }
      
      if (!Constants.expoConfig?.scheme) {
        console.warn('⚠️ App scheme not configured');
      }
    }
    
    return {
      redirectUrl,
      platform: Platform.OS,
      isDev: __DEV__,
      scheme: Constants.expoConfig?.scheme,
      packageName: Constants.expoConfig?.android?.package,
    };
  },

  /**
   * Test Android OAuth configuration
   */
  testAndroidOAuthConfig: () => {
    console.log('🧪 Testing Android OAuth Configuration...');
    
    const config = OAuthUtils.validateOAuthConfig();
    const redirectUrl = OAuthUtils.getRedirectUrl();
    
    console.log('📋 Configuration Summary:');
    console.log('  - Platform:', config.platform);
    console.log('  - Development Mode:', config.isDev);
    console.log('  - App Scheme:', config.scheme);
    console.log('  - Package Name:', config.packageName);
    console.log('  - Redirect URL:', redirectUrl);
    
    // Check for common Android OAuth issues
    const issues: string[] = [];
    
    if (!config.scheme) {
      issues.push('App scheme not configured');
    }
    
    if (!config.packageName) {
      issues.push('Android package name not configured');
    }
    
    if (!redirectUrl.includes('supabase.co') && !redirectUrl.includes('kharchax')) {
      issues.push('Redirect URL must be either Supabase callback or app scheme');
    }
    
    if (issues.length > 0) {
      console.warn('⚠️ Android OAuth Configuration Issues:');
      issues.forEach(issue => console.warn(`  - ${issue}`));
    } else {
      console.log('✅ Android OAuth Configuration looks good!');
    }
    
    return {
      config,
      redirectUrl,
      issues,
      isValid: issues.length === 0,
    };
  }
};
