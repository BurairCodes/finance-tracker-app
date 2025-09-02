# Calendar Module Documentation

## Overview

The Calendar Module provides a comprehensive date selection system for KharchaX, replacing manual text inputs with intuitive calendar interfaces. The module includes both single date pickers and date range pickers, all designed to match KharchaX's dark purple theme and glassmorphism design system.

## Components

### 1. CalendarPicker

A single date picker component that provides a modal calendar interface for selecting individual dates.

**Features:**
- Modal calendar interface with KharchaX theme
- Date validation and formatting
- Min/max date constraints
- Disabled state support
- Consistent styling with app design system

**Props:**
```typescript
interface CalendarPickerProps {
  value: string; // Date in YYYY-MM-DD format
  onDateChange: (date: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
}
```

**Usage:**
```tsx
<CalendarPicker
  label="Transaction Date"
  value={formData.date}
  onDateChange={(date) => setFormData(prev => ({ ...prev, date }))}
  placeholder="Select transaction date"
/>
```

### 2. DateRangePicker

A date range picker component that allows users to select custom date ranges for filtering and analytics.

**Features:**
- Two-step date selection (start → end)
- Visual range highlighting
- Automatic date swapping if end < start
- Reset functionality
- Period marking with different colors

**Props:**
```typescript
interface DateRangePickerProps {
  value: DateRange; // { startDate: string, endDate: string }
  onDateRangeChange: (range: DateRange) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
}
```

**Usage:**
```tsx
<DateRangePicker
  label="Filter Date Range"
  value={dateRange}
  onDateRangeChange={setDateRange}
  placeholder="Select date range"
/>
```

## Implementation Details

### Design System Integration

Both components follow KharchaX's design system:

- **Colors**: Uses Theme.colors for consistent color scheme
- **Typography**: Implements Theme.typography font families and sizes
- **Spacing**: Follows Theme.spacing scale
- **Border Radius**: Uses Theme.borderRadius values
- **Shadows**: Applies Theme.shadows for glassmorphism effects

### Calendar Theme Configuration

The calendar components use a custom theme that matches KharchaX's aesthetic:

```typescript
theme={{
  backgroundColor: Theme.colors.background,
  calendarBackground: Theme.colors.backgroundSecondary,
  textSectionTitleColor: Theme.colors.textSecondary,
  selectedDayBackgroundColor: Theme.colors.primary,
  selectedDayTextColor: Theme.colors.textInverse,
  todayTextColor: Theme.colors.primary,
  dayTextColor: Theme.colors.textPrimary,
  textDisabledColor: Theme.colors.textTertiary,
  arrowColor: Theme.colors.primary,
  monthTextColor: Theme.colors.textPrimary,
  // ... additional theme properties
}}
```

### Date Formatting

Dates are consistently formatted using:
- **Input**: YYYY-MM-DD format for database compatibility
- **Display**: Localized format (e.g., "Jan 15, 2024")
- **Range Display**: "Jan 15, 2024 - Jan 20, 2024"

## Integration Points

### Transaction Management

**Files Updated:**
- `components/TransactionModal.tsx`
- `components/EditTransactionModal.tsx`

**Changes:**
- Replaced manual date TextInput with CalendarPicker
- Maintained existing validation logic
- Preserved form state management

### Budget & Bill Management

**Files Updated:**
- `components/BudgetModal.tsx`
- `components/BillModal.tsx`

**Changes:**
- Replaced due_date TextInput with CalendarPicker
- Maintained recurring bill functionality
- Preserved validation and form submission

### Analytics & Filtering

**Potential Enhancements:**
- Replace predefined date ranges with DateRangePicker
- Add custom date range filtering to transactions
- Implement date range analytics

## State Management

### Form Integration

The calendar components integrate seamlessly with existing form state:

```typescript
// Before (manual input)
const [formData, setFormData] = useState({
  date: new Date().toISOString().split('T')[0],
});

// After (calendar picker)
<CalendarPicker
  value={formData.date}
  onDateChange={(date) => setFormData(prev => ({ ...prev, date }))}
/>
```

### Database Compatibility

All date values are stored in YYYY-MM-DD format, ensuring:
- Consistent database storage
- Proper date comparison operations
- Compatibility with existing queries
- Timezone consistency

## Validation

### Date Validation

The components work with existing validation utilities:

```typescript
// Existing validation still works
if (!ValidationUtils.isValidDate(formData.date)) {
  Alert.alert('Error', 'Please enter a valid date');
  return;
}
```

### Range Validation

DateRangePicker includes built-in range validation:
- Automatically swaps dates if end < start
- Prevents invalid date ranges
- Provides visual feedback during selection

## Performance Considerations

### Lightweight Implementation

- Uses `react-native-calendars` for optimal performance
- Minimal bundle size impact
- Efficient re-rendering with React.memo patterns
- Optimized for Android platform

### Memory Management

- Proper cleanup of modal states
- Efficient date object handling
- Minimal memory footprint

## Accessibility

### Screen Reader Support

- Proper ARIA labels and descriptions
- Keyboard navigation support
- High contrast color schemes
- Touch-friendly interface elements

### Android Optimization

- Optimized for Android touch interactions
- Consistent with Android design patterns
- Smooth animations and transitions
- Proper focus management

## Testing

### Component Testing

A test component is provided at `components/CalendarTest.tsx` for:
- Basic functionality verification
- Date selection testing
- UI/UX validation
- Theme consistency checks

### Integration Testing

Test scenarios include:
- Form submission with calendar dates
- Date validation workflows
- Modal interaction patterns
- State persistence across app restarts

## Future Enhancements

### Planned Features

1. **Recurring Date Patterns**
   - Weekly, monthly, yearly recurring selections
   - Custom recurrence rules

2. **Advanced Filtering**
   - Date range presets (Last 7 days, This month, etc.)
   - Quick date selection buttons

3. **Calendar Views**
   - Month, week, and day view options
   - Agenda view for transaction lists

4. **Smart Suggestions**
   - AI-powered date suggestions based on patterns
   - Frequently used date ranges

### Performance Optimizations

1. **Lazy Loading**
   - Calendar month lazy loading
   - Optimized date calculations

2. **Caching**
   - Date format caching
   - Theme configuration caching

## Troubleshooting

### Common Issues

1. **Date Format Mismatch**
   - Ensure dates are in YYYY-MM-DD format
   - Check timezone handling

2. **Theme Inconsistencies**
   - Verify Theme import paths
   - Check color value assignments

3. **Modal Display Issues**
   - Ensure proper Modal configuration
   - Check SafeAreaView implementation

### Debug Tips

1. Use the CalendarTest component for isolated testing
2. Check console logs for date format errors
3. Verify theme properties are correctly applied
4. Test on different Android screen sizes

## Dependencies

### Required Packages

- `react-native-calendars`: ^1.1313.0
- `lucide-react-native`: For calendar icons
- `react-native-safe-area-context`: For modal safety

### Optional Enhancements

- `date-fns`: For advanced date manipulation
- `moment.js`: For complex date formatting (if needed)

## Conclusion

The Calendar Module successfully integrates modern date selection capabilities into KharchaX while maintaining the app's design consistency and performance standards. The implementation provides a foundation for future date-related features and ensures a superior user experience across all date selection scenarios.
