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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, AlertCircle } from 'lucide-react-native';
import CurrencyPicker from './CurrencyPicker';
import { ValidationUtils } from '@/utils/validation';
import { Database } from '@/types/database';
import Theme from '@/constants/Theme';

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
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        base_currency: profile.base_currency || 'PKR',
      });
    }
    // Clear errors when modal opens
    setErrors({});
  }, [profile, visible]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = 'Full name must be at least 2 characters';
    } else if (formData.full_name.trim().length > 50) {
      newErrors.full_name = 'Full name must be less than 50 characters';
    }

    if (!formData.base_currency) {
      newErrors.base_currency = 'Base currency is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSave({
        full_name: ValidationUtils.sanitizeInput(formData.full_name.trim()),
        base_currency: formData.base_currency,
      });
      onClose();
    } catch (error) {
      console.error('Profile update error:', error);
      // Error is already handled by the parent component
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return; // Prevent closing while saving
    setErrors({});
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} disabled={loading}>
            <ChevronLeft size={24} color={Theme.colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color={Theme.colors.primary} />
            ) : (
              <Text style={styles.saveButton}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={[
                styles.textInput,
                errors.full_name && styles.textInputError
              ]}
              placeholder="Enter your full name"
              placeholderTextColor={Theme.colors.textTertiary}
              value={formData.full_name}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, full_name: text }));
                if (errors.full_name) {
                  setErrors(prev => ({ ...prev, full_name: '' }));
                }
              }}
              autoCapitalize="words"
              maxLength={50}
              editable={!loading}
            />
            {errors.full_name && (
              <View style={styles.errorContainer}>
                <AlertCircle size={14} color={Theme.colors.error} />
                <Text style={styles.errorText}>{errors.full_name}</Text>
              </View>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Base Currency *</Text>
            <CurrencyPicker
              selectedCurrency={formData.base_currency}
              onCurrencyChange={(value) => {
                setFormData(prev => ({ ...prev, base_currency: value }));
                if (errors.base_currency) {
                  setErrors(prev => ({ ...prev, base_currency: '' }));
                }
              }}
              style={[
                styles.currencyPicker,
                errors.base_currency && styles.textInputError
              ]}
              disabled={loading}
            />
            {errors.base_currency && (
              <View style={styles.errorContainer}>
                <AlertCircle size={14} color={Theme.colors.error} />
                <Text style={styles.errorText}>{errors.base_currency}</Text>
              </View>
            )}
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
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Theme.colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    minHeight: 60,
  },
  title: {
    fontSize: 20,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily.bold,
  },
  saveButton: {
    color: Theme.colors.primary,
    fontSize: 18,
    fontFamily: Theme.typography.fontFamily.semiBold,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: Theme.colors.textPrimary,
    marginBottom: 12,
    fontFamily: Theme.typography.fontFamily.semiBold,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
    fontSize: 18,
    fontFamily: Theme.typography.fontFamily.regular,
    color: '#FFFFFF',
    minHeight: 56,
  },
  textInputError: {
    borderColor: Theme.colors.error,
    borderWidth: 2,
  },
  currencyPicker: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    minHeight: 56,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  errorText: {
    color: Theme.colors.error,
    fontSize: 14,
    marginLeft: 6,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  infoBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    marginTop: 24,
  },
  infoText: {
    fontSize: 14,
    color: Theme.colors.info,
    lineHeight: 20,
    fontFamily: Theme.typography.fontFamily.regular,
  },
});