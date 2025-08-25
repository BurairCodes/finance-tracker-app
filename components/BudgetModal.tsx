import React, { useState } from 'react';
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
import { Picker } from '@react-native-picker/picker';
import { X } from 'lucide-react-native';
import { EXPENSE_CATEGORIES, CURRENCIES } from '@/constants/Categories';
import CurrencyPicker from './CurrencyPicker';
import { ValidationUtils } from '@/utils/validation';
import Theme from '@/constants/Theme';

interface BudgetModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (budget: {
    category: string;
    amount: number;
    currency: string;
    period: 'monthly' | 'weekly' | 'yearly';
  }) => Promise<void>;
  existingCategories: string[];
}

export default function BudgetModal({ visible, onClose, onSave, existingCategories }: BudgetModalProps) {
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    currency: 'PKR',
    period: 'monthly' as 'monthly' | 'weekly' | 'yearly',
  });
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setFormData({
      category: '',
      amount: '',
      currency: 'PKR',
      period: 'monthly',
    });
  };

  const handleSave = async () => {
    if (!formData.category.trim() || !formData.amount.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!ValidationUtils.isValidAmount(formData.amount)) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const amount = parseFloat(formData.amount);

    if (existingCategories.includes(formData.category)) {
      Alert.alert('Error', 'Budget already exists for this category');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        category: formData.category,
        amount,
        currency: formData.currency,
        period: formData.period,
      });
      onClose();
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to save budget');
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
          <Text style={styles.title}>Add Budget</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Text style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                style={styles.picker}
                dropdownIconColor="#FFFFFF"
                mode="dropdown"
                itemStyle={{ color: '#FFFFFF', backgroundColor: '#1A1A2E' }}
              >
                <Picker.Item label="Select a category" value="" color="#000000" />
                {EXPENSE_CATEGORIES.map(category => (
                  <Picker.Item
                    key={category}
                    label={category}
                    value={category}
                    color="#000000"
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Budget Amount *</Text>
            <View style={styles.amountContainer}>
              <CurrencyPicker
                selectedCurrency={formData.currency}
                onCurrencyChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                style={styles.currencyPicker}
              />
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={Theme.colors.textTertiary}
                value={formData.amount}
                onChangeText={(text) => setFormData(prev => ({ ...prev, amount: text }))}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Period *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.period}
                onValueChange={(value) => setFormData(prev => ({ ...prev, period: value }))}
                style={styles.picker}
                dropdownIconColor="#FFFFFF"
                mode="dropdown"
                itemStyle={{ color: '#FFFFFF', backgroundColor: '#1A1A2E' }}
              >
                <Picker.Item label="Monthly" value="monthly" color="#000000" />
                <Picker.Item label="Weekly" value="weekly" color="#000000" />
                <Picker.Item label="Yearly" value="yearly" color="#000000" />
              </Picker>
            </View>
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
    minHeight: 60, // Better touch target for header buttons
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
  saveButtonDisabled: {
    opacity: 0.5,
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
    color: Theme.colors.textSecondary,
    marginBottom: 12,
    fontFamily: Theme.typography.fontFamily.semiBold,
    fontWeight: '600',
  },
  amountContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  currencyPicker: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    width: 120, // Slightly wider for better mobile UX
    overflow: 'hidden',
  },
  amountInput: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
    fontSize: 18, // Larger for better mobile input
    fontFamily: Theme.typography.fontFamily.regular,
    color: '#FFFFFF',
    minHeight: 56, // Better touch target
  },
  pickerContainer: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    minHeight: 56, // Better touch target
  },
  picker: {
    height: 56,
    color: '#FFFFFF',
    backgroundColor: 'transparent',
    marginTop: -8,
    marginBottom: -8,
    textAlign: 'center',
    fontSize: 16, // Better readability on mobile
  },
});