import { useEffect, useState } from 'react';
import { Platform, Linking } from 'react-native';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { OAuthUtils } from '@/utils/oauth';
import { GoogleOAuthConfig, logGoogleOAuthConfig, validateGoogleOAuthConfig } from '@/config/googleOAuth';
import { NotificationService } from '@/services/notificationService';
import * as WebBrowser from 'expo-web-browser';
import { NativeGoogleAuth } from '@/config/nativeGoogleAuth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const previousUser = user;
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Security alerts for suspicious activities only
      if (session?.user && previousUser?.id !== session.user.id) {
        // Only create security alert for suspicious activities, not regular logins
        // This will be handled by actual security events (failed login attempts, etc.)
        console.log('User logged in:', session.user.email);
      }
    });

    // Set up OAuth redirect listener
    const oauthSubscription = OAuthUtils.setupOAuthListener();

    return () => {
      subscription.unsubscribe();
      oauthSubscription?.remove();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { data, error };
  };

  const signInWithGoogle = async () => {
    try {
      console.log('🤖 Starting Native Google Sign-In...');
      
      // Use native Google Sign-In
      const result = await NativeGoogleAuth.signIn();
      
      if (result.success) {
        console.log('✅ Native Google Sign-In successful');
        return { data: result.data, error: null };
      } else {
        console.error('❌ Native Google Sign-In failed:', result.error);
        return { data: null, error: { message: result.error } };
      }
    } catch (error) {
      console.error('❌ Native Google Sign-In Exception:', error);
      return { 
        data: null, 
        error: { 
          message: error instanceof Error ? error.message : 'Unknown error occurred' 
        } 
      };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };
}