import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DateData } from 'react-native-calendars';
import { X, Calendar as CalendarIcon, ArrowRight } from 'lucide-react-native';
import Theme from '@/constants/Theme';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
}

export default function DateRangePicker({
  value,
  onDateRangeChange,
  placeholder = 'Select date range',
  label,
  disabled = false,
  minDate,
  maxDate,
}: DateRangePickerProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [isSelectingEndDate, setIsSelectingEndDate] = useState(false);

  const handleDateSelect = (day: DateData) => {
    const selectedDate = day.dateString;
    
    if (!isSelectingEndDate) {
      // Selecting start date
      onDateRangeChange({
        startDate: selectedDate,
        endDate: selectedDate, // Default to same day
      });
      setIsSelectingEndDate(true);
    } else {
      // Selecting end date
      const startDate = value.startDate;
      if (selectedDate < startDate) {
        // If end date is before start date, swap them
        onDateRangeChange({
          startDate: selectedDate,
          endDate: startDate,
        });
      } else {
        onDateRangeChange({
          startDate,
          endDate: selectedDate,
        });
      }
      setIsSelectingEndDate(false);
      setShowCalendar(false);
    }
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDisplayRange = () => {
    if (!value.startDate && !value.endDate) return placeholder;
    
    if (value.startDate === value.endDate) {
      return formatDisplayDate(value.startDate);
    }
    
    return `${formatDisplayDate(value.startDate)} - ${formatDisplayDate(value.endDate)}`;
  };

  const markedDates: any = {};
  
  if (value.startDate) {
    markedDates[value.startDate] = {
      startingDay: true,
      color: Theme.colors.primary,
      textColor: Theme.colors.textInverse,
    };
  }
  
  if (value.endDate && value.endDate !== value.startDate) {
    markedDates[value.endDate] = {
      endingDay: true,
      color: Theme.colors.primary,
      textColor: Theme.colors.textInverse,
    };
  }
  
  // Mark dates in between
  if (value.startDate && value.endDate && value.startDate !== value.endDate) {
    const start = new Date(value.startDate);
    const end = new Date(value.endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateString = d.toISOString().split('T')[0];
      if (dateString !== value.startDate && dateString !== value.endDate) {
        markedDates[dateString] = {
          color: Theme.colors.primaryLight,
          textColor: Theme.colors.textInverse,
        };
      }
    }
  }

  const resetSelection = () => {
    setIsSelectingEndDate(false);
    onDateRangeChange({ startDate: '', endDate: '' });
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={[
          styles.inputContainer,
          disabled && styles.inputDisabled,
          (value.startDate || value.endDate) && styles.inputFilled
        ]}
        onPress={() => !disabled && setShowCalendar(true)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <CalendarIcon 
          size={20} 
          color={(value.startDate || value.endDate) ? Theme.colors.primary : Theme.colors.textTertiary} 
        />
        <Text style={[
          styles.inputText,
          (value.startDate || value.endDate) ? styles.inputTextFilled : styles.inputTextPlaceholder
        ]}>
          {formatDisplayRange()}
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
            <Text style={styles.modalTitle}>
              {isSelectingEndDate ? 'Select End Date' : 'Select Start Date'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowCalendar(false);
                setIsSelectingEndDate(false);
              }}
              style={styles.closeButton}
            >
              <X size={24} color={Theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.calendarContainer}>
            <Calendar
              current={value.startDate || new Date().toISOString().split('T')[0]}
              onDayPress={handleDateSelect}
              markedDates={markedDates}
              markingType="period"
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
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              onPress={resetSelection}
              style={styles.resetButton}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            
            <View style={styles.selectionInfo}>
              <Text style={styles.selectionInfoText}>
                {isSelectingEndDate 
                  ? `Start: ${formatDisplayDate(value.startDate)}`
                  : 'Select start date'
                }
              </Text>
              {isSelectingEndDate && (
                <ArrowRight size={16} color={Theme.colors.textSecondary} />
              )}
            </View>
          </View>
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
  calendarContainer: {
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    backgroundColor: Theme.colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  resetButton: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.surface,
  },
  resetButtonText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.medium,
  },
  selectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  selectionInfoText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.medium,
  },
});
