import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { NativeGoogleAuth } from '@/config/nativeGoogleAuth';
import Theme from '@/constants/Theme';

export default function NativeGoogleSignInTest() {
  const [testResults, setTestResults] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const runConfigurationTest = async () => {
    setIsLoading(true);
    setTestResults('Running native Google Sign-In configuration test...\n\n');
    
    try {
      const result = await NativeGoogleAuth.testConfiguration();
      
      let output = '🧪 Native Google Sign-In Configuration Test Results:\n\n';
      
      if (result.error) {
        output += `❌ Test Failed: ${result.error}\n`;
      } else {
        output += `✅ Google Play Services: ${result.hasPlayServices ? 'Available' : 'Not Available'}\n`;
        output += `🔐 Currently Signed In: ${result.isSignedIn ? 'Yes' : 'No'}\n`;
        output += `🔑 Client ID: ${result.clientIdConfigured ? 'Configured' : 'Not Configured'}\n`;
        output += `📦 Package Name: ${result.packageName || 'Not Set'}\n`;
        output += `🤖 Platform: Android\n\n`;
        
        if (result.hasPlayServices && result.clientIdConfigured) {
          output += '✅ Native Google Sign-In should work!\n';
        } else {
          output += '⚠️ Issues found:\n';
          if (!result.hasPlayServices) output += '  - Google Play Services not available\n';
          if (!result.clientIdConfigured) output += '  - Google Client ID not configured\n';
        }
      }
      
      setTestResults(output);
    } catch (error) {
      setTestResults(`❌ Test failed with error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testSignIn = async () => {
    setIsLoading(true);
    setTestResults('Testing native Google Sign-In...\n\n');
    
    try {
      const result = await NativeGoogleAuth.signIn();
      
      if (result.success) {
        setTestResults(prev => prev + '✅ Native Google Sign-In successful!\n');
        setTestResults(prev => prev + `👤 User: ${result.userInfo?.user?.name}\n`);
        setTestResults(prev => prev + `📧 Email: ${result.userInfo?.user?.email}\n`);
      } else {
        setTestResults(prev => prev + `❌ Sign-In failed: ${result.error}\n`);
      }
    } catch (error) {
      setTestResults(prev => prev + `❌ Sign-In error: ${error}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  const testSignOut = async () => {
    setIsLoading(true);
    setTestResults('Testing native Google Sign-Out...\n\n');
    
    try {
      const result = await NativeGoogleAuth.signOut();
      
      if (result.success) {
        setTestResults(prev => prev + '✅ Native Google Sign-Out successful!\n');
      } else {
        setTestResults(prev => prev + `❌ Sign-Out failed: ${result.error}\n`);
      }
    } catch (error) {
      setTestResults(prev => prev + `❌ Sign-Out error: ${error}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🤖 Native Google Sign-In Test</Text>
      <Text style={styles.subtitle}>Test native Android Google Sign-In (no browser!)</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={runConfigurationTest}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Testing...' : 'Test Configuration'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.successButton]}
          onPress={testSignIn}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Signing In...' : 'Test Sign In'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.warningButton]}
          onPress={testSignOut}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Signing Out...' : 'Test Sign Out'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={clearResults}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {testResults ? (
        <ScrollView style={styles.resultsContainer}>
          <Text style={styles.resultsText}>{testResults}</Text>
        </ScrollView>
      ) : null}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>📱 What to Expect:</Text>
        <Text style={styles.infoText}>• No browser or web view opens</Text>
        <Text style={styles.infoText}>• Native Android Google Sign-In UI</Text>
        <Text style={styles.infoText}>• Uses Google Play Services</Text>
        <Text style={styles.infoText}>• Seamless user experience</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  title: {
    fontSize: Theme.typography.fontSize.lg,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.xs,
  },
  subtitle: {
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.regular,
    color: Theme.colors.textTertiary,
    marginBottom: Theme.spacing.md,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  button: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.sm,
    flex: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: Theme.colors.primary,
  },
  successButton: {
    backgroundColor: Theme.colors.success,
  },
  warningButton: {
    backgroundColor: Theme.colors.warning,
  },
  secondaryButton: {
    backgroundColor: Theme.colors.textTertiary,
  },
  buttonText: {
    color: Theme.colors.textPrimary,
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  resultsContainer: {
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borderRadius.sm,
    padding: Theme.spacing.md,
    maxHeight: 200,
    marginBottom: Theme.spacing.md,
  },
  resultsText: {
    fontSize: Theme.typography.fontSize.xs,
    fontFamily: 'monospace',
    color: Theme.colors.textSecondary,
    lineHeight: 16,
  },
  infoContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  infoTitle: {
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.semiBold,
    color: Theme.colors.info,
    marginBottom: Theme.spacing.xs,
  },
  infoText: {
    fontSize: Theme.typography.fontSize.xs,
    fontFamily: Theme.typography.fontFamily.regular,
    color: Theme.colors.info,
    marginBottom: 2,
  },
});
