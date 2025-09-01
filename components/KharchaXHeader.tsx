import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Menu } from 'lucide-react-native';
import Theme from '@/constants/Theme';

interface KharchaXHeaderProps {
  title?: string;
  showBack?: boolean;
  showMenu?: boolean;
  onBack?: () => void;
  onMenu?: () => void;
  variant?: 'default' | 'gradient' | 'transparent';
}

export default function KharchaXHeader({
  title,
  showBack = false,
  showMenu = false,
  onBack,
  onMenu,
  variant = 'default',
}: KharchaXHeaderProps) {
  const renderBackground = () => {
    switch (variant) {
      case 'gradient':
        return (
          <LinearGradient
            colors={Theme.colors.gradientPrimary}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        );
      case 'transparent':
        return null;
      default:
        return (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: Theme.colors.backgroundSecondary }]} />
        );
    }
  };

  const textColor = variant === 'gradient' ? '#FFFFFF' : Theme.colors.textPrimary;

  return (
    <SafeAreaView style={styles.container}>
      {renderBackground()}
      
      <View style={styles.header}>
        <View style={styles.leftSection}>
          {showBack && (
            <TouchableOpacity onPress={onBack} style={styles.iconButton}>
              <ChevronLeft size={24} color={textColor} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.centerSection}>
          {title ? (
            <Text style={[styles.title, { color: textColor }]}>{title}</Text>
          ) : (
            <View style={styles.logoContainer}>
              <Image
                source={require('@/assets/images/kharchax-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={[styles.appName, { color: textColor }]}>KharchaX</Text>
            </View>
          )}
        </View>

        <View style={styles.rightSection}>
          {showMenu && (
            <TouchableOpacity onPress={onMenu} style={styles.iconButton}>
              <Menu size={24} color={textColor} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    minHeight: 60,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  iconButton: {
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.sm,
  },
  title: {
    fontSize: Theme.typography.fontSize.lg,
    fontFamily: Theme.typography.fontFamily.bold,
    textAlign: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: Theme.spacing.sm,
  },
  appName: {
    fontSize: Theme.typography.fontSize.lg,
    fontFamily: Theme.typography.fontFamily.bold,
  },
});
