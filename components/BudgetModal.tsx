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

interface BudgetModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (budget: any) => Promise<void>;
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
              >
                <Picker.Item label="Select a category" value="" />
                {EXPENSE_CATEGORIES.map(category => (
                  <Picker.Item
                    key={category}
                    label={category}
                    value={category}
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
              >
                <Picker.Item label="Monthly" value="monthly" />
                <Picker.Item label="Weekly" value="weekly" />
                <Picker.Item label="Yearly" value="yearly" />
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
  amountContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  currencyPicker: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: 100,
  },
  amountInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  picker: {
    height: 50,
  },
});