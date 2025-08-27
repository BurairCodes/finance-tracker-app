import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Check } from 'lucide-react-native';
import { CURRENCIES } from '@/constants/Categories';
import { useProfile } from '@/hooks/useProfile';
import Theme from '@/constants/Theme';

interface CurrencySettingsModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

export default function CurrencySettingsModal({ visible, onClose, userId }: CurrencySettingsModalProps) {
  const { profile, updateProfile } = useProfile(userId);
  const [selectedCurrency, setSelectedCurrency] = useState(profile?.base_currency || 'PKR');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!profile) {
      Alert.alert('Error', 'Profile not found');
      return;
    }

    if (selectedCurrency === profile.base_currency) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      const { error } = await updateProfile({
        base_currency: selectedCurrency,
      });

      if (error) {
        Alert.alert('Error', error);
      } else {
        Alert.alert(
          'Success', 
          `Base currency updated to ${selectedCurrency}`,
          [{ text: 'OK', onPress: onClose }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update currency settings');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedCurrency(profile?.base_currency || 'PKR');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Currency Settings</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Base Currency</Text>
            <Text style={styles.sectionDescription}>
              Choose your preferred currency for displaying balances and calculations.
              All amounts will be converted to this currency for consistent viewing.
            </Text>
          </View>

          <View style={styles.currencyList}>
            {CURRENCIES.map((currency) => (
              <TouchableOpacity
                key={currency.code}
                style={[
                  styles.currencyItem,
                  selectedCurrency === currency.code && styles.selectedCurrency
                ]}
                onPress={() => setSelectedCurrency(currency.code)}
                disabled={loading}
              >
                <View style={styles.currencyInfo}>
                  <Text style={styles.currencySymbol}>{currency.symbol}</Text>
                  <View style={styles.currencyDetails}>
                    <Text style={styles.currencyCode}>{currency.code}</Text>
                    <Text style={styles.currencyName}>{currency.name}</Text>
                  </View>
                </View>
                {selectedCurrency === currency.code && (
                  <Check size={20} color={Theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.note}>
            <Text style={styles.noteText}>
              💡 Note: Changing your base currency will affect how all amounts are displayed.
              Your existing transactions will remain in their original currencies.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  currencyList: {
    marginBottom: 24,
  },
  currencyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCurrency: {
    backgroundColor: '#EFF6FF',
    borderColor: Theme.colors.primary,
  },
  currencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginRight: 12,
    minWidth: 30,
  },
  currencyDetails: {
    flex: 1,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  currencyName: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  note: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  noteText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
