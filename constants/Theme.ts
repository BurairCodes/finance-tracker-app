export const Theme = {
  // Color Palette - Dark Purple Theme
  colors: {
    // Primary Colors
    primary: '#8B5CF6', // Purple
    primaryLight: '#A78BFA',
    primaryDark: '#7C3AED',
    
    // Background Colors
    background: '#0F0F23', // Dark purple background
    backgroundSecondary: '#1A1A2E',
    backgroundTertiary: '#16213E',
    
    // Surface Colors (Glassmorphism)
    surface: 'rgba(255, 255, 255, 0.05)',
    surfaceHover: 'rgba(255, 255, 255, 0.08)',
    surfaceActive: 'rgba(255, 255, 255, 0.12)',
    
    // Card Colors
    card: 'rgba(255, 255, 255, 0.08)',
    cardHover: 'rgba(255, 255, 255, 0.12)',
    
    // Text Colors
    textPrimary: '#FFFFFF',
    textSecondary: '#E2E8F0',
    textTertiary: '#94A3B8',
    textInverse: '#0F0F23',
    
    // Status Colors
    success: '#10B981',
    successLight: '#34D399',
    warning: '#F59E0B',
    warningLight: '#FBBF24',
    error: '#EF4444',
    errorLight: '#F87171',
    info: '#3B82F6',
    infoLight: '#60A5FA',
    
    // Accent Colors
    accent: '#EC4899', // Pink
    accentLight: '#F472B6',
    
    // Border Colors
    border: 'rgba(255, 255, 255, 0.1)',
    borderHover: 'rgba(255, 255, 255, 0.2)',
    
    // Gradient Colors
    gradientPrimary: ['#8B5CF6', '#7C3AED'],
    gradientSecondary: ['#EC4899', '#8B5CF6'],
    gradientBackground: ['#0F0F23', '#1A1A2E'],
  },
  
  // Typography
  typography: {
    fontFamily: {
      regular: 'Poppins-Regular',
      medium: 'Poppins-Medium',
      semiBold: 'Poppins-SemiBold',
      bold: 'Poppins-Bold',
      light: 'Poppins-Light',
    },
    
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
    },
    
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  
  // Border Radius
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 9999,
  },
  
  // Shadows (Glassmorphism)
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
    glass: {
      shadowColor: '#8B5CF6',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
  },
  
  // Card Styles
  cards: {
    primary: {
      backgroundColor: '#8B5CF6',
      borderWidth: 1,
      borderColor: '#A78BFA',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    secondary: {
      backgroundColor: '#1A1A2E',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    card: {
      backgroundColor: '#1A1A2E',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    input: {
      backgroundColor: '#1A1A2E',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
  },
  
  // Animation
  animation: {
    duration: {
      fast: 200,
      normal: 300,
      slow: 500,
    },
    easing: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
    },
  },
};

export default Theme;
