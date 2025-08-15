import { Dimensions, Platform } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const responsiveStyles = {
  // Screen dimensions
  screenWidth,
  screenHeight,
  
  // Responsive padding calculations
  getPadding: (basePadding: number = 20) => Math.max(basePadding, screenWidth * 0.05),
  getHorizontalPadding: (basePadding: number = 20) => Math.max(basePadding, screenWidth * 0.05),
  getVerticalPadding: (basePadding: number = 20) => Math.max(basePadding, screenHeight * 0.02),
  
  // Tab bar and navigation
  tabBarHeight: Platform.OS === 'ios' ? 85 : 60,
  bottomPadding: Platform.OS === 'ios' ? 95 : 70,
  fabBottomPosition: Platform.OS === 'ios' ? 95 : 70,
  
  // Responsive font sizes
  getFontSize: (baseSize: number) => {
    if (screenWidth < 375) return baseSize * 0.9;
    if (screenWidth >= 414) return baseSize * 1.1;
    return baseSize;
  },
  
  // Responsive spacing
  getSpacing: (baseSpacing: number) => {
    if (screenWidth < 375) return baseSpacing * 0.8;
    if (screenWidth >= 414) return baseSpacing * 1.2;
    return baseSpacing;
  },
  
  // Common responsive styles
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 95 : 70,
  },
  
  fab: {
    position: 'absolute' as const,
    bottom: Platform.OS === 'ios' ? 95 : 70,
    right: 20,
    backgroundColor: '#2563EB',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
};
