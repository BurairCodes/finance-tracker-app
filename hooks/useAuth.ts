import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { OAuthUtils } from '@/utils/oauth';
import { NotificationService } from '@/services/notificationService';

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
      
      // Security alerts for suspicious activities
      if (session?.user && previousUser?.id !== session.user.id) {
        try {
          // New login detected
          await NotificationService.createSecurityAlert(
            session.user.id,
            'login',
            `New login detected from ${Platform.OS} device. If this wasn't you, please review your account security.`
          );
        } catch (error) {
          console.error('Failed to create security alert:', error);
        }
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
    const oauthConfig = OAuthUtils.getOAuthConfig();
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: oauthConfig.redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    return { data, error };
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