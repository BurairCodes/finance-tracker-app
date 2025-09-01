import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LLMService } from '../services/llmService';
import Constants from 'expo-constants';

export default function LLMTest() {
  const [isTesting, setIsTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const testLLMService = async () => {
    setIsTesting(true);
    try {
      console.log('🧪 Starting LLM service test...');
      
                          // First, let's check what's available in Constants
                    console.log('📋 Expo Constants check:');
                    console.log('Constants.expoConfig?.extra:', Constants.expoConfig?.extra);
                    console.log('Google AI Key available:', !!Constants.expoConfig?.extra?.googleAiApiKey);
      
      // Test the LLM service
      const testResults = await LLMService.testLLMService();
      setResults(testResults);
      
      console.log('✅ LLM service test completed:', testResults);
      
                          // Show results in alert
                    const summary = `Google Gemini 2.5 Flash: ${testResults.google ? '✅' : '❌'}`;
                    Alert.alert('Google Gemini 2.5 Flash Test Results', summary);
      
    } catch (error) {
      console.error('❌ LLM service test failed:', error);
      Alert.alert('Test Failed', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <View style={styles.container}>
                      <Text style={styles.title}>Google Gemini 2.5 Flash Test</Text>
      
                          <TouchableOpacity 
                      style={[styles.button, isTesting && styles.buttonDisabled]} 
                      onPress={testLLMService}
                      disabled={isTesting}
                    >
                      <Text style={styles.buttonText}>
                        {isTesting ? 'Testing...' : 'Test Google Gemini 2.5 Flash'}
                      </Text>
                    </TouchableOpacity>
      
                          {results && (
                      <View style={styles.results}>
                        <Text style={styles.resultsTitle}>Test Results:</Text>
                        <Text>Google Gemini 2.5 Flash: {results.google ? '✅ Success' : '❌ Failed'}</Text>
                        
                        <Text style={styles.detailsTitle}>Details:</Text>
                        <Text>Google Gemini 2.5 Flash: {results.details.google}</Text>
                      </View>
                    )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  results: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
  },
});
