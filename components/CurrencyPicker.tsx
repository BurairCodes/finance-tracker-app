import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { CURRENCIES } from '@/constants/Categories';

interface CurrencyPickerProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  style?: any;
}

export default function CurrencyPicker({ 
  selectedCurrency, 
  onCurrencyChange, 
  style 
}: CurrencyPickerProps) {
  return (
    <View style={[styles.container, style]}>
      <Picker
        selectedValue={selectedCurrency}
        onValueChange={onCurrencyChange}
        style={styles.picker}
      >
        {CURRENCIES.map(currency => (
          <Picker.Item
            key={currency.code}
            label={`${currency.code} (${currency.symbol})`}
            value={currency.code}
          />
        ))}
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  picker: {
    height: 50,
  },
});