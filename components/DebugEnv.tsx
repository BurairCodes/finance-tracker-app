import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Constants from 'expo-constants';

export default function DebugEnv() {
  const extra = Constants.expoConfig?.extra;
  const hasGoogleKey = !!extra?.googleAiApiKey;
  const googleKeyLength = extra?.googleAiApiKey?.length || 0;
  const googleKeyPreview = extra?.googleAiApiKey ? 
    `${extra.googleAiApiKey.substring(0, 10)}...` : 'Not set';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Environment Variables Debug</Text>
      
      <View style={styles.item}>
        <Text style={styles.label}>Google AI API Key Available:</Text>
        <Text style={[styles.value, hasGoogleKey ? styles.success : styles.error]}>
          {hasGoogleKey ? '✅ Yes' : '❌ No'}
        </Text>
      </View>

      <View style={styles.item}>
        <Text style={styles.label}>Google AI API Key Length:</Text>
        <Text style={styles.value}>{googleKeyLength} characters</Text>
      </View>

      <View style={styles.item}>
        <Text style={styles.label}>Google AI API Key Preview:</Text>
        <Text style={styles.value}>{googleKeyPreview}</Text>
      </View>

      <View style={styles.item}>
        <Text style={styles.label}>All Extra Config Keys:</Text>
        <Text style={styles.value}>
          {Object.keys(extra || {}).join(', ')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  value: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  success: {
    color: 'green',
  },
  error: {
    color: 'red',
  },
});
