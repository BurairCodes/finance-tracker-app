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
import { Picker } from '@react-native-picker/picker';
import { X } from 'lucide-react-native';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/constants/Categories';
import CurrencyPicker from './CurrencyPicker';
import { ValidationUtils } from '@/utils/validation';
import { Database } from '@/types/database';
import Theme from '@/constants/Theme';

type Transaction = Database['public']['Tables']['transactions']['Row'];

interface EditTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Transaction>) => Promise<void>;
  transaction: Transaction | null;
}

export default function EditTransactionModal({ 
  visible, 
  onClose, 
  onSave, 
  transaction 
}: EditTransactionModalProps) {
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    currency: 'PKR',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.type,
        amount: Math.abs(transaction.amount).toString(),
        currency: transaction.currency,
        category: transaction.category,
        description: transaction.description || '',
        date: transaction.date,
      });
    }
  }, [transaction]);

  const handleSave = async () => {
    if (!transaction) return;

    if (!formData.category.trim() || !formData.amount.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!ValidationUtils.isValidAmount(formData.amount)) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!ValidationUtils.isValidDate(formData.date)) {
      Alert.alert('Error', 'Please enter a valid date');
      return;
    }

    const amount = parseFloat(formData.amount);

    setLoading(true);
    try {
      await onSave(transaction.id, {
        amount: formData.type === 'expense' ? -amount : amount,
        currency: formData.currency,
        category: formData.category,
        type: formData.type,
        description: ValidationUtils.sanitizeInput(formData.description),
        date: formData.date,
      });
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to update transaction');
    } finally {
      setLoading(false);
    }
  };

  const categories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

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
          <Text style={styles.title}>Edit Transaction</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Text style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                formData.type === 'expense' && styles.typeButtonActive
              ]}
              onPress={() => setFormData(prev => ({ ...prev, type: 'expense', category: '' }))}
            >
              <Text style={[
                styles.typeButtonText,
                formData.type === 'expense' && styles.typeButtonTextActive
              ]}>
                Expense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                formData.type === 'income' && styles.typeButtonActive
              ]}
              onPress={() => setFormData(prev => ({ ...prev, type: 'income', category: '' }))}
            >
              <Text style={[
                styles.typeButtonText,
                formData.type === 'income' && styles.typeButtonTextActive
              ]}>
                Income
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Amount *</Text>
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
                {categories.map(category => (
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
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter description..."
              placeholderTextColor={Theme.colors.textTertiary}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Date *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.date}
              onChangeText={(text) => setFormData(prev => ({ ...prev, date: text }))}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Theme.colors.textTertiary}
              maxLength={10}
            />
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
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.backgroundTertiary,
    borderRadius: 16,
    padding: 6,
    marginBottom: 32,
    height: 56, // Better touch target
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    justifyContent: 'center',
  },
  typeButtonActive: {
    backgroundColor: Theme.colors.primary,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typeButtonText: {
    fontSize: 16,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily.medium,
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily.medium,
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
  textInput: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
    fontSize: 16,
    textAlignVertical: 'top',
    fontFamily: Theme.typography.fontFamily.regular,
    color: '#FFFFFF',
    minHeight: 80, // Better for multiline input
  },
});