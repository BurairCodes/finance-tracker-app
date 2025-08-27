import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import Theme from '@/constants/Theme';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the OAuth callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.replace('/');
          return;
        }

        if (data.session) {
          console.log('Authentication successful');
          router.replace('/(tabs)');
        } else {
          console.log('No session found');
          router.replace('/');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.replace('/');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: Theme.colors.background,
    }}>
      <ActivityIndicator size="large" color={Theme.colors.primary} />
      <Text style={{
        marginTop: 16,
        fontSize: Theme.typography.fontSize.base,
        color: Theme.colors.textPrimary,
        fontFamily: Theme.typography.fontFamily.medium,
      }}>
        Completing sign in...
      </Text>
    </View>
  );
}
