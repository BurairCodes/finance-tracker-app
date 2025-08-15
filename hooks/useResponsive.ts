import { Dimensions, Platform } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const useResponsive = () => {
  const isSmallScreen = screenWidth < 375;
  const isMediumScreen = screenWidth >= 375 && screenWidth < 414;
  const isLargeScreen = screenWidth >= 414;

  const getResponsivePadding = (basePadding: number = 20) => {
    return Math.max(basePadding, screenWidth * 0.05);
  };

  const getTabBarHeight = () => {
    return Platform.OS === 'ios' ? 85 : 60;
  };

  const getBottomPadding = () => {
    return Platform.OS === 'ios' ? 95 : 70;
  };

  const getFABBottomPosition = () => {
    return Platform.OS === 'ios' ? 95 : 70;
  };

  const getResponsiveFontSize = (baseSize: number) => {
    if (isSmallScreen) return baseSize * 0.9;
    if (isLargeScreen) return baseSize * 1.1;
    return baseSize;
  };

  return {
    screenWidth,
    screenHeight,
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    getResponsivePadding,
    getTabBarHeight,
    getBottomPadding,
    getFABBottomPosition,
    getResponsiveFontSize,
  };
};
