import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';
import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';

export class NativeGoogleAuth {
  /**
   * Configure Google Sign-In for Android
   */
  static configure() {
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
    console.log('🔧 Configuring Native Google Sign-In...');
    console.log('🆔 Client ID:', clientId ? 'Configured' : 'Missing');
    console.log('📦 Package:', Constants.expoConfig?.android?.package);
    
    GoogleSignin.configure({
      // Your Google Cloud Console Android OAuth Client ID
      webClientId: clientId,
      offlineAccess: true,
      hostedDomain: '', // Optional: restrict to specific domain
      forceCodeForRefreshToken: true,
      scopes: ['openid', 'profile', 'email'],
    });
    
    console.log('🤖 Native Google Sign-In configured for Android');
  }

  /**
   * Sign in with Google using native Android flow
   */
  static async signIn() {
    try {
      console.log('🚀 Starting native Google Sign-In...');
      
      // Check if Google Play Services are available
      await GoogleSignin.hasPlayServices();
      console.log('✅ Google Play Services available');
      
      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();
      console.log('✅ Google Sign-In successful:', {
        id: userInfo.user.id,
        email: userInfo.user.email,
        name: userInfo.user.name,
      });
      
      // Get the ID token for Supabase
      const tokens = await GoogleSignin.getTokens();
      console.log('🔑 Got Google tokens');
      
      if (tokens.idToken) {
        // Sign in to Supabase using the Google ID token
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: tokens.idToken,
        });
        
        if (error) {
          console.error('❌ Supabase sign-in error:', error);
          return { success: false, error: error.message };
        }
        
        console.log('✅ Supabase sign-in successful');
        return { success: true, data, userInfo };
      } else {
        console.error('❌ No ID token received from Google');
        return { success: false, error: 'No ID token received' };
      }
      
    } catch (error: any) {
      console.error('❌ Native Google Sign-In error:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return { success: false, error: 'Sign-in cancelled by user' };
      } else if (error.code === statusCodes.IN_PROGRESS) {
        return { success: false, error: 'Sign-in already in progress' };
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return { success: false, error: 'Google Play Services not available' };
      } else {
        return { success: false, error: error.message || 'Unknown error' };
      }
    }
  }

  /**
   * Sign out from Google
   */
  static async signOut() {
    try {
      await GoogleSignin.signOut();
      console.log('✅ Native Google Sign-Out successful');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Native Google Sign-Out error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user is signed in
   */
  static async isSignedIn() {
    try {
      const isSignedIn = await GoogleSignin.isSignedIn();
      return isSignedIn;
    } catch (error) {
      console.error('❌ Error checking Google Sign-In status:', error);
      return false;
    }
  }

  /**
   * Get current user info
   */
  static async getCurrentUser() {
    try {
      const userInfo = await GoogleSignin.signInSilently();
      return userInfo;
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      return null;
    }
  }

  /**
   * Test native Google Sign-In configuration
   */
  static async testConfiguration() {
    console.log('🧪 Testing Native Google Sign-In Configuration...');
    
    try {
      const hasPlayServices = await GoogleSignin.hasPlayServices();
      console.log('✅ Google Play Services:', hasPlayServices ? 'Available' : 'Not Available');
      
      const isSignedIn = await this.isSignedIn();
      console.log('🔐 Currently signed in:', isSignedIn ? 'Yes' : 'No');
      
      console.log('🔧 Configuration Details:');
      console.log('  - Full Client ID:', process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 'Not configured');
      console.log('  - Package Name:', Constants.expoConfig?.android?.package || 'Not set');
      console.log('  - App Scheme:', Constants.expoConfig?.scheme || 'Not set');
      console.log('  - Platform:', 'Android');
      console.log('  - Development Mode:', __DEV__);
      
      // Try to get current configuration from GoogleSignin
      try {
        const currentUser = await GoogleSignin.getCurrentUser();
        console.log('👤 Current User:', currentUser ? 'Signed in' : 'Not signed in');
      } catch (configError) {
        console.log('⚠️ GoogleSignin status check:', configError.message);
      }
      
      return {
        hasPlayServices,
        isSignedIn,
        clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
        packageName: Constants.expoConfig?.android?.package,
        scheme: Constants.expoConfig?.scheme,
        isDev: __DEV__,
      };
    } catch (error) {
      console.error('❌ Configuration test failed:', error);
      return { error: error };
    }
  }
}

// Auto-configure when imported
NativeGoogleAuth.configure();
