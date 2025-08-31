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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { X, Calendar, FileText, CreditCard } from 'lucide-react-native';
import { EXPENSE_CATEGORIES, CURRENCIES } from '@/constants/Categories';
import CurrencyPicker from './CurrencyPicker';
import { ValidationUtils } from '@/utils/validation';
import Theme from '@/constants/Theme';

interface BillModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (bill: {
    name: string;
    amount: number;
    currency: string;
    due_date: string;
    recurring: boolean;
    category: string;
    notes?: string;
  }) => Promise<void>;
}

export default function BillModal({ visible, onClose, onSave }: BillModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    currency: 'PKR',
    due_date: new Date().toISOString().split('T')[0],
    recurring: false,
    category: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      currency: 'PKR',
      due_date: new Date().toISOString().split('T')[0],
      recurring: false,
      category: '',
      notes: '',
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a bill name');
      return;
    }

    if (!formData.amount.trim()) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }

    if (!ValidationUtils.isValidAmount(formData.amount)) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!ValidationUtils.isValidDate(formData.due_date)) {
      Alert.alert('Error', 'Please enter a valid due date');
      return;
    }

    if (!formData.category.trim()) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    // Validate currency
    const validCurrencies = CURRENCIES.map(c => c.code);
    if (!validCurrencies.includes(formData.currency)) {
      Alert.alert('Error', 'Please select a valid currency');
      return;
    }

    const amount = parseFloat(formData.amount);

    setLoading(true);
    try {
      await onSave({
        name: formData.name.trim(),
        amount,
        currency: formData.currency,
        due_date: formData.due_date,
        recurring: formData.recurring,
        category: formData.category.trim(),
        notes: formData.notes.trim() || undefined,
      });
      onClose();
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to save bill');
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
          <Text style={styles.title}>Add Bill</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Text style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Bill Name *</Text>
            <View style={styles.inputContainer}>
              <CreditCard size={20} color={Theme.colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter bill name..."
                placeholderTextColor={Theme.colors.textTertiary}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              />
            </View>
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
            <Text style={styles.label}>Due Date *</Text>
            <View style={styles.inputContainer}>
              <Calendar size={20} color={Theme.colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={formData.due_date}
                onChangeText={(text) => setFormData(prev => ({ ...prev, due_date: text }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Theme.colors.textTertiary}
                maxLength={10}
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
            <Text style={styles.label}>Recurring Bill</Text>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>
                {formData.recurring ? 'Yes' : 'No'}
              </Text>
              <Switch
                value={formData.recurring}
                onValueChange={(value) => setFormData(prev => ({ ...prev, recurring: value }))}
                trackColor={{ false: Theme.colors.surface, true: Theme.colors.primary }}
                thumbColor={formData.recurring ? Theme.colors.background : Theme.colors.textTertiary}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Notes</Text>
            <View style={styles.inputContainer}>
              <FileText size={20} color={Theme.colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, styles.notesInput]}
                placeholder="Add notes (optional)..."
                placeholderTextColor={Theme.colors.textTertiary}
                value={formData.notes}
                onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
                multiline
                numberOfLines={3}
              />
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    minHeight: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: Theme.typography.fontFamily.regular,
    color: '#FFFFFF',
    backgroundColor: 'transparent',
    minHeight: 56,
  },
  notesInput: {
    textAlignVertical: 'top',
    paddingTop: 16,
    paddingBottom: 16,
    minHeight: 80,
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
    width: 120,
    overflow: 'hidden',
  },
  amountInput: {
    flex: 1,
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
  pickerContainer: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    minHeight: 56,
  },
  picker: {
    height: 56,
    color: '#FFFFFF',
    backgroundColor: 'transparent',
    marginTop: -8,
    marginBottom: -8,
    textAlign: 'center',
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  switchLabel: {
    fontSize: 16,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily.medium,
  },
});
