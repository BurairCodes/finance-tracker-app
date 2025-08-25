import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { CURRENCIES } from '@/constants/Categories';
import Theme from '@/constants/Theme';

interface CurrencyPickerProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  style?: object;
  disabled?: boolean;
}

export default function CurrencyPicker({ 
  selectedCurrency, 
  onCurrencyChange, 
  style,
  disabled = false
}: CurrencyPickerProps) {
  return (
    <View style={[styles.container, style, disabled && styles.disabled]}>
      <Picker
        selectedValue={selectedCurrency}
        onValueChange={onCurrencyChange}
        style={[styles.picker, disabled && styles.pickerDisabled]}
        dropdownIconColor="#FFFFFF"
        mode="dropdown"
        itemStyle={styles.pickerItem}
        enabled={!disabled}
      >
        {CURRENCIES.map(currency => (
          <Picker.Item
            key={currency.code}
            label={`${currency.code} (${currency.symbol})`}
            value={currency.code}
            color="#000000"
          />
        ))}
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    minHeight: 56,
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  picker: {
    height: 56,
    color: 'white',
    backgroundColor:'#1A1A2E',
    marginTop: Platform.OS === 'android' ? -8 : 0,
    marginBottom: Platform.OS === 'android' ? -8 : 0,
    textAlign: 'center',
    fontSize: 16,
  },
  pickerDisabled: {
    color: Theme.colors.textTertiary,
  },
  pickerItem: {
    color: '#000000',
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
});
