import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DateData } from 'react-native-calendars';
import { X, Calendar as CalendarIcon } from 'lucide-react-native';
import Theme from '@/constants/Theme';

interface CalendarPickerProps {
  value: string; // Date in YYYY-MM-DD format
  onDateChange: (date: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
}

export default function CalendarPicker({
  value,
  onDateChange,
  placeholder = 'Select date',
  label,
  disabled = false,
  minDate,
  maxDate,
}: CalendarPickerProps) {
  const [showCalendar, setShowCalendar] = useState(false);

  const handleDateSelect = (day: DateData) => {
    const selectedDate = day.dateString;
    onDateChange(selectedDate);
    setShowCalendar(false);
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return placeholder;
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const markedDates = value ? {
    [value]: {
      selected: true,
      selectedColor: Theme.colors.primary,
      selectedTextColor: Theme.colors.textInverse,
    }
  } : {};

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={[
          styles.inputContainer,
          disabled && styles.inputDisabled,
          value && styles.inputFilled
        ]}
        onPress={() => !disabled && setShowCalendar(true)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <CalendarIcon 
          size={20} 
          color={value ? Theme.colors.primary : Theme.colors.textTertiary} 
        />
        <Text style={[
          styles.inputText,
          value ? styles.inputTextFilled : styles.inputTextPlaceholder
        ]}>
          {formatDisplayDate(value)}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showCalendar}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent={false}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Date</Text>
            <TouchableOpacity
              onPress={() => setShowCalendar(false)}
              style={styles.closeButton}
            >
              <X size={24} color={Theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <Calendar
            current={value || new Date().toISOString().split('T')[0]}
            onDayPress={handleDateSelect}
            markedDates={markedDates}
            theme={{
              // Background colors
              backgroundColor: Theme.colors.background,
              calendarBackground: Theme.colors.backgroundSecondary,
              
              // Text colors
              textSectionTitleColor: Theme.colors.textSecondary,
              selectedDayBackgroundColor: Theme.colors.primary,
              selectedDayTextColor: Theme.colors.textInverse,
              todayTextColor: Theme.colors.primary,
              dayTextColor: Theme.colors.textPrimary,
              textDisabledColor: Theme.colors.textTertiary,
              
              // Arrow colors
              arrowColor: Theme.colors.primary,
              monthTextColor: Theme.colors.textPrimary,
              
              // Indicator colors
              indicatorColor: Theme.colors.primary,
              textDayFontFamily: Theme.typography.fontFamily.medium,
              textMonthFontFamily: Theme.typography.fontFamily.semiBold,
              textDayHeaderFontFamily: Theme.typography.fontFamily.medium,
              
              // Font sizes
              textDayFontSize: Theme.typography.fontSize.base,
              textMonthFontSize: Theme.typography.fontSize.lg,
              textDayHeaderFontSize: Theme.typography.fontSize.sm,
              
              // Spacing
              textDayFontWeight: '500',
              textMonthFontWeight: '600',
              textDayHeaderFontWeight: '500',
              
              // Border radius
              'stylesheet.calendar.header': {
                dayHeader: {
                  fontWeight: '600',
                  color: Theme.colors.textSecondary,
                  textTransform: 'uppercase',
                  fontSize: Theme.typography.fontSize.sm,
                }
              },
              
              'stylesheet.day.basic': {
                base: {
                  width: 40,
                  height: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: Theme.borderRadius.sm,
                },
                text: {
                  marginTop: 4,
                  fontSize: Theme.typography.fontSize.base,
                  fontFamily: Theme.typography.fontFamily.medium,
                  color: Theme.colors.textPrimary,
                  textAlign: 'center',
                }
              },
              
              'stylesheet.day.single': {
                base: {
                  width: 40,
                  height: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: Theme.borderRadius.sm,
                },
                text: {
                  marginTop: 4,
                  fontSize: Theme.typography.fontSize.base,
                  fontFamily: Theme.typography.fontFamily.medium,
                  color: Theme.colors.textPrimary,
                  textAlign: 'center',
                }
              }
            }}
            minDate={minDate}
            maxDate={maxDate}
            enableSwipeMonths={true}
            hideExtraDays={true}
            disableMonthChange={false}
            firstDay={1}
            hideDayNames={false}
            showWeekNumbers={false}
            disableArrowLeft={false}
            disableArrowRight={false}
            disableAllTouchEventsForDisabledDays={true}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Theme.spacing.md,
  },
  label: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily.medium,
    marginBottom: Theme.spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    minHeight: 50,
    ...Theme.shadows.sm,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  inputFilled: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.backgroundTertiary,
  },
  inputText: {
    flex: 1,
    marginLeft: Theme.spacing.sm,
    fontSize: Theme.typography.fontSize.base,
    fontFamily: Theme.typography.fontFamily.medium,
  },
  inputTextFilled: {
    color: Theme.colors.textPrimary,
  },
  inputTextPlaceholder: {
    color: Theme.colors.textTertiary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    backgroundColor: Theme.colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  modalTitle: {
    fontSize: Theme.typography.fontSize.xl,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  closeButton: {
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.surface,
  },
});
