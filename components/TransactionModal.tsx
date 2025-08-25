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
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, CURRENCIES } from '@/constants/Categories';
import CurrencyPicker from './CurrencyPicker';
import { ValidationUtils } from '@/utils/validation';
import { AIService } from '@/services/aiService';
import Theme from '@/constants/Theme';

interface TransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (transaction: {
    amount: number;
    currency: string;
    category: string;
    type: 'income' | 'expense';
    description: string;
    date: string;
  }) => Promise<void>;
  initialData?: {
    amount?: string;
    description?: string;
    category?: string;
    date?: string;
    currency?: string;
  };
}

export default function TransactionModal({ visible, onClose, onSave, initialData }: TransactionModalProps) {
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: initialData?.amount || '',
    currency: initialData?.currency || 'PKR',
    category: initialData?.category || '',
    description: initialData?.description || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        amount: initialData.amount || prev.amount,
        currency: initialData.currency || prev.currency,
        category: initialData.category || prev.category,
        description: initialData.description || prev.description,
        date: initialData.date || prev.date,
      }));
    }
  }, [initialData]);

  const resetForm = () => {
    setFormData({
      type: 'expense',
      amount: '',
      currency: 'PKR',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const handleSave = async () => {
    if (!formData.amount.trim()) {
      Alert.alert('Error', 'Please enter an amount');
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
    
    // Use AI categorization to determine category if not provided
    const prediction = AIService.categorizeTransaction(
      formData.description || '',
      formData.type === 'expense' ? -amount : amount
    );
    
    // Use AI suggestion if no category selected or if AI has high confidence
    let finalCategory = formData.category;
    if (!finalCategory || finalCategory === '' || prediction.confidence > 0.8) {
      finalCategory = prediction.category;
    }

    // Final validation - ensure we have a category (either user-selected or AI-suggested)
    if (!finalCategory || finalCategory === '') {
      Alert.alert('Error', 'Unable to categorize transaction. Please select a category manually.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        amount: formData.type === 'expense' ? -amount : amount,
        currency: formData.currency,
        category: finalCategory,
        type: formData.type,
        description: ValidationUtils.sanitizeInput(formData.description),
        date: formData.date,
      });
      onClose();
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to save transaction');
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
          <Text style={styles.title}>Add Transaction</Text>
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
                <Picker.Item label="Select a category (or leave empty for AI)" value="" color="#000000" />
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
            {!formData.category && formData.description && (
              <Text style={styles.hintText}>
                💡 AI will automatically categorize based on your description
              </Text>
            )}
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
    backgroundColor: Theme.colors.surface,
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
    backgroundColor: Theme.colors.card,
    ...Theme.shadows.sm,
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
    borderRadius: 16,
    width: 120, // Slightly wider for better mobile UX
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  amountInput: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    fontSize: 18, // Larger for better mobile input
    fontFamily: Theme.typography.fontFamily.regular,
    color: '#FFFFFF',
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: 56, // Better touch target
  },
  pickerContainer: {
    borderRadius: 16,
    backgroundColor: '#1A1A2E',
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
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    textAlignVertical: 'top',
    fontFamily: Theme.typography.fontFamily.regular,
    color: '#FFFFFF',
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: 80, // Better for multiline input
  },
  hintText: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textTertiary,
    marginTop: Theme.spacing.sm,
    fontFamily: Theme.typography.fontFamily.regular,
    fontStyle: 'italic',
  },
});