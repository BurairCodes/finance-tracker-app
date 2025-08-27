import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Chrome } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { ValidationUtils } from '@/utils/validation';
import Theme from '@/constants/Theme';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!ValidationUtils.isValidEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!ValidationUtils.isValidPassword(password)) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (!isLogin && !fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          Alert.alert('Login Error', error.message || 'Failed to sign in');
        }
      } else {
        const { error } = await signUp(email, password, fullName.trim());
        if (error) {
          Alert.alert('Signup Error', error.message || 'Failed to create account');
        } else {
          Alert.alert('Success', 'Account created successfully! Please sign in.');
          setIsLogin(true);
          setPassword(''); // Clear password for security
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        console.error('Google Sign-In Error:', error);
        Alert.alert(
          'Google Sign-In Error', 
          error.message || 'Failed to sign in with Google. Please try again.'
        );
      } else {
        // Success - the user will be automatically redirected
        console.log('Google Sign-In initiated successfully');
      }
    } catch (error) {
      console.error('Google Sign-In Exception:', error);
      Alert.alert(
        'Error', 
        'Something went wrong with Google Sign-In. Please try again.'
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.gradient}>
        <View style={styles.blurContainer}>
          <View style={styles.formContainer}>
            <Text style={styles.title}>Smart Finance</Text>
            <Text style={styles.subtitle}>
              {isLogin ? 'Welcome back' : 'Create your account'}
            </Text>

            {!isLogin && (
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoComplete="name"
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Theme.colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={Theme.colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={isLogin ? "current-password" : "new-password"}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Sign Up')}
              </Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity
              style={[styles.googleButton, googleLoading && styles.buttonDisabled]}
              onPress={handleGoogleSignIn}
              disabled={googleLoading}
            >
              <Chrome size={20} color="#4285F4" />
              <Text style={styles.googleButtonText}>
                {googleLoading ? 'Loading...' : 'Continue with Google'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => setIsLogin(!isLogin)}
            >
              <Text style={styles.linkText}>
                {isLogin 
                  ? "Don't have an account? Sign Up" 
                  : 'Already have an account? Sign In'
                }
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: Theme.spacing.lg,
  },
  formContainer: {
    backgroundColor: Theme.colors.card,
    padding: Theme.spacing['2xl'],
    borderRadius: Theme.borderRadius.lg,
    ...Theme.shadows.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily.bold,
  },
  subtitle: {
    fontSize: Theme.typography.fontSize.base,
    textAlign: 'center',
    marginBottom: Theme.spacing['2xl'],
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  input: {
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    fontSize: Theme.typography.fontSize.base,
    fontFamily: Theme.typography.fontFamily.regular,
    color: '#FFFFFF',
  },
  button: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Theme.colors.textPrimary,
    fontSize: Theme.typography.fontSize.base,
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  linkButton: {
    alignItems: 'center',
  },
  linkText: {
    color: Theme.colors.primary,
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Theme.spacing.md,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    marginHorizontal: Theme.spacing.sm,
    color: Theme.colors.textTertiary,
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginTop: Theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  googleButtonText: {
    marginLeft: Theme.spacing.sm,
    color: Theme.colors.textPrimary,
    fontSize: Theme.typography.fontSize.base,
    fontFamily: Theme.typography.fontFamily.regular,
  },
});