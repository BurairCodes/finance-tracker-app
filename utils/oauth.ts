import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

export const OAuthUtils = {
  /**
   * Get the redirect URL for OAuth providers
   * This should match what's configured in your Supabase project
   */
  getRedirectUrl: (): string => {
    if (Platform.OS === 'web') {
      // For web, use Supabase auth callback
      return 'http://localhost:8081/auth/callback';
    }
    
    // For Android development build
    if (Platform.OS === 'android' && __DEV__) {
      // Development with Android development build
      return 'exp+finance-tracker://expo-development-client';
    }
    
    // For iOS development build
    if (Platform.OS === 'ios' && __DEV__) {
      // Development with iOS development build
      return 'exp+finance-tracker://expo-development-client';
    }
    
    // For production mobile apps
    return Linking.createURL('/auth/callback');
  },

  /**
   * Handle OAuth redirects
   * This function should be called when the app is opened via a deep link
   */
  handleOAuthRedirect: async (url: string) => {
    try {
      // Parse the URL to extract OAuth parameters
      const { queryParams } = Linking.parse(url);
      
      // Check if this is an OAuth callback
      if (queryParams?.access_token || queryParams?.refresh_token) {
        // The Supabase client will automatically handle the session
        console.log('OAuth redirect handled successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error handling OAuth redirect:', error);
      return false;
    }
  },

  /**
   * Set up OAuth redirect listener
   * This should be called in your app's root component
   */
  setupOAuthListener: () => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('Deep link received:', url);
      OAuthUtils.handleOAuthRedirect(url);
    });

    return subscription;
  },

  /**
   * Get the OAuth configuration for different platforms
   */
  getOAuthConfig: () => {
    const redirectUrl = OAuthUtils.getRedirectUrl();
    
    return {
      redirectTo: redirectUrl,
      // Additional OAuth options can be added here
    };
  },

  /**
   * Get the actual redirect URL for development builds
   */
  getDevelopmentBuildRedirectUrl: () => {
    return 'exp+finance-tracker://expo-development-client';
  },
};
