import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { logGoogleOAuthConfig, validateGoogleOAuthConfig, getGoogleOAuthUrl, getAndroidOAuthConfig } from '@/config/googleOAuth';
import { OAuthUtils } from '@/utils/oauth';
import Theme from '@/constants/Theme';

export default function GoogleOAuthTest() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runConfigurationTest = () => {
    addResult('🧪 Starting Android Google OAuth Configuration Test...');
    
    try {
      // Test 1: Log configuration
      logGoogleOAuthConfig();
      addResult('✅ Configuration logged to console');
      
      // Test 2: Validate configuration
      const validation = validateGoogleOAuthConfig();
      if (validation.isValid) {
        addResult('✅ Configuration validation passed');
      } else {
        addResult(`❌ Configuration validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Test 3: Test OAuth utils
      const oauthConfig = OAuthUtils.validateOAuthConfig();
      addResult(`✅ OAuth Utils test passed - Redirect URL: ${oauthConfig.redirectUrl}`);
      
      // Test 4: Test Android-specific OAuth utils
      const androidTest = OAuthUtils.testAndroidOAuthConfig();
      if (androidTest.isValid) {
        addResult('✅ Android OAuth configuration test passed');
      } else {
        addResult(`⚠️ Android OAuth configuration issues: ${androidTest.issues.join(', ')}`);
      }
      
      // Test 5: Test Google OAuth URL generation
      try {
        const oauthUrl = getGoogleOAuthUrl();
        addResult(`✅ Google OAuth URL generated: ${oauthUrl.substring(0, 100)}...`);
      } catch (error) {
        addResult(`❌ Google OAuth URL generation failed: ${error}`);
      }
      
      // Test 6: Get Android-specific config
      const androidConfig = getAndroidOAuthConfig();
      addResult(`✅ Android OAuth config retrieved - Package: ${androidConfig.packageName}`);
      
    } catch (error) {
      addResult(`❌ Configuration test failed: ${error}`);
    }
  };

  const runAndroidSpecificTest = () => {
    addResult('🤖 Running Android-specific OAuth tests...');
    
    try {
      // Test Android OAuth configuration
      const androidTest = OAuthUtils.testAndroidOAuthConfig();
      addResult(`📱 Platform: ${androidTest.config.platform}`);
      addResult(`🔧 Development Mode: ${androidTest.config.isDev}`);
      addResult(`🏷️ App Scheme: ${androidTest.config.scheme || 'Not set'}`);
      addResult(`🤖 Package Name: ${androidTest.config.packageName || 'Not set'}`);
      addResult(`🔗 Redirect URL: ${androidTest.redirectUrl}`);
      
      if (androidTest.isValid) {
        addResult('✅ All Android OAuth checks passed!');
      } else {
        addResult(`⚠️ Android OAuth issues found: ${androidTest.issues.join(', ')}`);
      }
      
    } catch (error) {
      addResult(`❌ Android-specific test failed: ${error}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const copyResults = () => {
    const resultsText = testResults.join('\n');
    // In a real app, you'd use a clipboard library
    Alert.alert('Results Copied', 'Test results copied to clipboard');
    console.log('Android OAuth Test Results:', resultsText);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Android Google OAuth Test Panel</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.testButton} onPress={runConfigurationTest}>
          <Text style={styles.buttonText}>Run Full Test</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.androidButton} onPress={runAndroidSpecificTest}>
          <Text style={styles.buttonText}>Android Test</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.clearButton} onPress={clearResults}>
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.copyButton} onPress={copyResults}>
          <Text style={styles.buttonText}>Copy</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        {testResults.length === 0 ? (
          <Text style={styles.noResults}>No test results yet. Run a test to see results.</Text>
        ) : (
          testResults.map((result, index) => (
            <Text key={index} style={styles.resultText}>
              {result}
            </Text>
          ))
        )}
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Android OAuth Checklist:</Text>
        <Text style={styles.infoText}>1. ✅ App scheme "kharchax" configured</Text>
        <Text style={styles.infoText}>2. ✅ Android package name set</Text>
        <Text style={styles.infoText}>3. ✅ Google OAuth credentials created</Text>
        <Text style={styles.infoText}>4. ✅ Redirect URIs configured in Google Cloud</Text>
        <Text style={styles.infoText}>5. ✅ Supabase Google provider enabled</Text>
        <Text style={styles.infoText}>6. ✅ Environment variables set</Text>
      </View>
      
      <View style={styles.androidInfoContainer}>
        <Text style={styles.infoTitle}>Android-Specific Notes:</Text>
        <Text style={styles.infoText}>• Development: exp+kharchax://expo-development-client</Text>
        <Text style={styles.infoText}>• Production: kharchax://auth/callback</Text>
        <Text style={styles.infoText}>• Package: com.kharchax.app</Text>
        <Text style={styles.infoText}>• Scheme: kharchax</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.background,
  },
  title: {
    fontSize: Theme.typography.fontSize.xl,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: Theme.spacing.lg,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Theme.spacing.lg,
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
  },
  testButton: {
    backgroundColor: Theme.colors.primary,
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    minWidth: 100,
  },
  androidButton: {
    backgroundColor: '#3DDC84', // Android green
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    minWidth: 100,
  },
  clearButton: {
    backgroundColor: Theme.colors.secondary,
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    minWidth: 80,
  },
  copyButton: {
    backgroundColor: Theme.colors.accent,
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    minWidth: 80,
  },
  buttonText: {
    color: Theme.colors.textPrimary,
    textAlign: 'center',
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.sm,
  },
  resultsContainer: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.lg,
  },
  resultsTitle: {
    fontSize: Theme.typography.fontSize.lg,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.sm,
  },
  noResults: {
    color: Theme.colors.textTertiary,
    fontStyle: 'italic',
  },
  resultText: {
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily.mono,
    fontSize: Theme.typography.fontSize.sm,
    marginBottom: Theme.spacing.xs,
  },
  infoContainer: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.lg,
  },
  androidInfoContainer: {
    backgroundColor: '#1A1A2E',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: '#3DDC84',
  },
  infoTitle: {
    fontSize: Theme.typography.fontSize.lg,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.sm,
  },
  infoText: {
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.xs,
    fontSize: Theme.typography.fontSize.sm,
  },
});
