import { Tabs } from 'expo-router';
import { 
  Home, 
  CreditCard, 
  Target, 
  BarChart3, 
  Settings, 
  MessageCircle,
  Plus 
} from 'lucide-react-native';
import { Platform, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Theme from '@/constants/Theme';
import { useTabBarVisibility } from '@/hooks/useTabBarVisibility';

// Custom Tab Bar Icon Component
const TabBarIcon = ({ icon: Icon, focused, size = 24 }: { 
  icon: any; 
  focused: boolean; 
  size?: number;
}) => {
  if (focused) {
    return (
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={Theme.colors.gradientPrimary}
          style={styles.iconGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Icon size={size} color="#FFFFFF" />
        </LinearGradient>
      </View>
    );
  }
  
  return <Icon size={size} color={Theme.colors.textTertiary} />;
};

export default function TabLayout() {
  const { showTabBar } = useTabBarVisibility();
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Theme.colors.primary,
        tabBarInactiveTintColor: Theme.colors.textTertiary,
        tabBarShowLabel: false, // Remove labels
        tabBarStyle: {
          backgroundColor: 'rgba(26, 26, 46, 0.98)',
          borderTopWidth: 0,
          paddingBottom: Platform.OS === 'ios' ? 35 : 20,
          paddingTop: 16,
          height: Platform.OS === 'ios' ? 100 : 80,
          paddingHorizontal: 20,
          marginHorizontal: 0,
          marginBottom: 0,
          borderRadius: 0,
          display: showTabBar ? 'flex' : 'none',
          ...Platform.select({
            ios: {
              shadowColor: '#8B5CF6',
              shadowOffset: { width: 0, height: -8 },
              shadowOpacity: 0.8,
              shadowRadius: 40,
            },
            android: {
              elevation: 40,
              shadowColor: '#8B5CF6',
            },
          }),
        },
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.3)', 'rgba(26, 26, 46, 0.98)', 'rgba(26, 26, 46, 0.98)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            <BlurView 
              intensity={90} 
              tint="dark" 
              style={StyleSheet.absoluteFill}
            />
          </View>
        ),
        tabBarItemStyle: {
          paddingVertical: 8,
          paddingHorizontal: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused, size }) => (
            <TabBarIcon icon={Home} focused={focused} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          tabBarIcon: ({ focused, size }) => (
            <TabBarIcon icon={CreditCard} focused={focused} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          tabBarIcon: ({ focused, size }) => (
            <TabBarIcon icon={Target} focused={focused} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          tabBarIcon: ({ focused, size }) => (
            <TabBarIcon icon={BarChart3} focused={focused} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          tabBarIcon: ({ focused, size }) => (
            <TabBarIcon icon={MessageCircle} focused={focused} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused, size }) => (
            <TabBarIcon icon={Settings} focused={focused} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  iconGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});