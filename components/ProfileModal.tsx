import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import CurrencyPicker from './CurrencyPicker';
import { ValidationUtils } from '@/utils/validation';
import { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Profile>) => Promise<void>;
  profile: Profile | null;
}

export default function ProfileModal({ 
  visible, 
  onClose, 
  onSave, 
  profile 
}: ProfileModalProps) {
  const [formData, setFormData] = useState({
    full_name: '',
    base_currency: 'PKR',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        base_currency: profile.base_currency || 'PKR',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!formData.full_name.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        full_name: ValidationUtils.sanitizeInput(formData.full_name),
        base_currency: formData.base_currency,
      });
      onClose();
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Text style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your full name"
              value={formData.full_name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, full_name: text }))}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Base Currency *</Text>
            <CurrencyPicker
              selectedCurrency={formData.base_currency}
              onCurrencyChange={(value) => setFormData(prev => ({ ...prev, base_currency: value }))}
              style={styles.currencyPicker}
            />
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Your base currency is used for analytics and reporting. All transactions will be converted to this currency for calculations.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    fontFamily: 'Inter-Bold',
  },
  saveButton: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  currencyPicker: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginTop: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
});