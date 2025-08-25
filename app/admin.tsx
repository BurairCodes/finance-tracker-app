import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  TriangleAlert as AlertTriangle, 
  ChartBar as BarChart3, 
  ChartPie as PieChart,
  Settings,
  Shield,
  UserCheck,
  UserX,
  Database,
  Activity,
  Globe,
  Mail,
  Phone,
  Calendar,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Zap,
  Server,
  Wifi,
  HardDrive,
  Cpu,
  X,
  Plus,
  ArrowRight,
  Download,
  Upload,
  FileText,
  Lock,
  Unlock,
  UserPlus,
  UserMinus,
  Crown,
  Flag,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Monitor,
  Smartphone,
  Tablet,
  Globe2,
  MapPin,
  Clock as ClockIcon,
  Calendar as CalendarIcon,
  BarChart,
  LineChart,
  PieChart as PieChartIcon,
  TrendingDown,
  Minus,
  Percent,
  Target,
  Award,
  Trophy,
  Medal,
  Badge,
  Key,
  Shield as ShieldIcon,
  ShieldCheck,
  ShieldX,
  AlertCircle,
  Info,
  HelpCircle,
  ExternalLink,
  Copy,
  Share,
  Archive,
  ArchiveRestore,
  Trash,
  RotateCcw,
  Save,
  Check,
  X as XIcon,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Home,
  LogOut,
  Menu,
  Grid,
  List,
  Maximize,
  Minimize,
  Fullscreen,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw as RotateCcwIcon,
  Move,
  Crop,
  Scissors,
  Type,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List as ListIcon,
  Hash,
  Hash as HashIcon,
  Hash as HashIcon2,
  Hash as HashIcon3,
  Hash as HashIcon4,
  Hash as HashIcon5,
  Hash as HashIcon6,
  Hash as HashIcon7,
  Hash as HashIcon8,
  Hash as HashIcon9,
  Hash as HashIcon10,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { ExchangeRateService } from '@/services/exchangeRateService';
import Theme from '@/constants/Theme';

const { width, height } = Dimensions.get('window');

interface AdminStats {
  totalUsers: number;
  totalTransactions: number;
  totalVolume: number;
  activeUsers: number;
  topCategories: Array<{ category: string; count: number; amount: number }>;
  currencyDistribution: Array<{ currency: string; count: number; amount: number }>;
  systemHealth: {
    database: 'operational' | 'warning' | 'error';
    api: 'operational' | 'warning' | 'error';
    exchangeRate: 'operational' | 'warning' | 'error';
    uptime: number;
    responseTime: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'user_signup' | 'transaction' | 'admin_action' | 'system_event';
    description: string;
    timestamp: string;
    user?: string;
  }>;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  base_currency: string;
  created_at: string;
  updated_at: string;
  user_role: 'user' | 'admin' | 'super_admin';
  is_active: boolean;
  last_login?: string;
  transaction_count: number;
  total_volume: number;
}

interface AdminAction {
  id: string;
  action_type: 'user_role_change' | 'user_ban' | 'user_unban' | 'system_config' | 'data_export';
  description: string;
  admin_user: string;
  target_user?: string;
  timestamp: string;
  details?: any;
}

export default function AdminScreen() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalTransactions: 0,
    totalVolume: 0,
    activeUsers: 0,
    topCategories: [],
    currencyDistribution: [],
    systemHealth: {
      database: 'operational',
      api: 'operational',
      exchangeRate: 'operational',
      uptime: 99.9,
      responseTime: 150,
    },
    recentActivity: [],
  });
  const [users, setUsers] = useState<User[]>([]);
  const [adminActions, setAdminActions] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'actions' | 'system'>('overview');
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'admin' | 'super_admin'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchAdminStats(),
        fetchUsers(),
        fetchAdminActions(),
      ]);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      Alert.alert('Error', 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAdminData();
    setRefreshing(false);
  };

  const fetchAdminStats = async () => {
    try {
      // Fetch user count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch transaction stats
      const { data: transactions, count: transactionCount } = await supabase
        .from('transactions')
        .select('amount, currency, category, created_at, user_id', { count: 'exact' });

      // Calculate total volume and category/currency stats
      let totalVolume = 0;
      const categoryStats: Record<string, { count: number; amount: number }> = {};
      const currencyStats: Record<string, { count: number; amount: number }> = {};

      if (transactions) {
        for (const transaction of transactions) {
          const convertedAmount = await ExchangeRateService.convertCurrency(
            Math.abs(transaction.amount),
            transaction.currency,
            'PKR'
          );
          totalVolume += convertedAmount;

          // Category stats
          if (!categoryStats[transaction.category]) {
            categoryStats[transaction.category] = { count: 0, amount: 0 };
          }
          categoryStats[transaction.category].count++;
          categoryStats[transaction.category].amount += convertedAmount;

          // Currency stats
          if (!currencyStats[transaction.currency]) {
            currencyStats[transaction.currency] = { count: 0, amount: 0 };
          }
          currencyStats[transaction.currency].count++;
          currencyStats[transaction.currency].amount += convertedAmount;
        }
      }

      // Get active users (users with transactions in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: activeUserData } = await supabase
        .from('transactions')
        .select('user_id')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const uniqueActiveUsers = new Set(activeUserData?.map(t => t.user_id) || []).size;

      // Sort and format data
      const topCategories = Object.entries(categoryStats)
        .sort(([,a], [,b]) => b.amount - a.amount)
        .slice(0, 5)
        .map(([category, stats]) => ({ 
          category, 
          count: stats.count, 
          amount: stats.amount 
        }));

      const currencyDistribution = Object.entries(currencyStats)
        .sort(([,a], [,b]) => b.amount - a.amount)
        .map(([currency, stats]) => ({ 
          currency, 
          count: stats.count, 
          amount: stats.amount 
        }));

      // Mock recent activity
      const recentActivity = [
        {
          id: '1',
          type: 'user_signup' as const,
          description: 'New user registered',
          timestamp: new Date().toISOString(),
          user: 'john.doe@example.com',
        },
        {
          id: '2',
          type: 'admin_action' as const,
          description: 'User role changed to admin',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          user: 'admin@example.com',
        },
        {
          id: '3',
          type: 'system_event' as const,
          description: 'System backup completed',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
        },
      ];

      setStats(prev => ({
        ...prev,
        totalUsers: userCount || 0,
        totalTransactions: transactionCount || 0,
        totalVolume,
        activeUsers: uniqueActiveUsers,
        topCategories,
        currencyDistribution,
        recentActivity,
      }));
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Mock additional user data
      const usersWithStats: User[] = (profiles || []).map((profile, index) => ({
        ...profile,
        user_role: index === 0 ? 'super_admin' : index < 3 ? 'admin' : 'user',
        is_active: Math.random() > 0.1,
        last_login: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        transaction_count: Math.floor(Math.random() * 100),
        total_volume: Math.floor(Math.random() * 100000),
      }));

      setUsers(usersWithStats);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchAdminActions = async () => {
    // Mock admin actions data
    const mockActions: AdminAction[] = [
      {
        id: '1',
        action_type: 'user_role_change',
        description: 'Changed user role to admin',
        admin_user: 'super_admin@example.com',
        target_user: 'john.doe@example.com',
        timestamp: new Date().toISOString(),
        details: { from: 'user', to: 'admin' },
      },
      {
        id: '2',
        action_type: 'user_ban',
        description: 'Banned user for violation',
        admin_user: 'admin@example.com',
        target_user: 'spam@example.com',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        details: { reason: 'Spam violation' },
      },
      {
        id: '3',
        action_type: 'system_config',
        description: 'Updated system configuration',
        admin_user: 'super_admin@example.com',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        details: { config: 'rate_limits' },
      },
    ];

    setAdminActions(mockActions);
  };

  const handleUserAction = async (action: 'promote' | 'demote' | 'ban' | 'unban', user: User) => {
    const actionText = {
      promote: 'promote to admin',
      demote: 'demote to user',
      ban: 'ban',
      unban: 'unban',
    }[action];

    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${actionText} ${user.full_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: action === 'ban' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              // Here you would implement the actual admin action
      
              
              // Update local state
              setUsers(prev => prev.map(u => {
                if (u.id === user.id) {
                  return {
                    ...u,
                    user_role: action === 'promote' ? 'admin' : action === 'demote' ? 'user' : u.user_role,
                    is_active: action === 'ban' ? false : action === 'unban' ? true : u.is_active,
                  };
                }
                return u;
              }));

              Alert.alert('Success', `User ${actionText} successfully`);
            } catch (error) {
              console.error('Failed to perform admin action:', error);
              Alert.alert('Error', 'Failed to perform action');
            }
          },
        },
      ]
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.user_role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.is_active) ||
                         (filterStatus === 'inactive' && !user.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const renderOverviewTab = () => (
    <ScrollView 
      style={styles.tabContent}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      {/* Key Metrics */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={styles.metricIcon}>
            <Users size={24} color={Theme.colors.primary} />
          </View>
          <Text style={styles.metricValue}>{stats.totalUsers}</Text>
          <Text style={styles.metricLabel}>Total Users</Text>
          <View style={styles.metricTrend}>
            <TrendingUp size={12} color={Theme.colors.success} />
            <Text style={styles.trendText}>+12%</Text>
          </View>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricIcon}>
            <Activity size={24} color={Theme.colors.success} />
          </View>
          <Text style={styles.metricValue}>{stats.activeUsers}</Text>
          <Text style={styles.metricLabel}>Active Users</Text>
          <View style={styles.metricTrend}>
            <TrendingUp size={12} color={Theme.colors.success} />
            <Text style={styles.trendText}>+8%</Text>
          </View>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricIcon}>
            <BarChart3 size={24} color={Theme.colors.warning} />
          </View>
          <Text style={styles.metricValue}>{stats.totalTransactions.toLocaleString()}</Text>
          <Text style={styles.metricLabel}>Transactions</Text>
          <View style={styles.metricTrend}>
            <TrendingUp size={12} color={Theme.colors.success} />
            <Text style={styles.trendText}>+15%</Text>
          </View>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricIcon}>
            <DollarSign size={24} color={Theme.colors.accent} />
          </View>
          <Text style={styles.metricValue}>
            ₨{(stats.totalVolume / 1000000).toFixed(1)}M
          </Text>
          <Text style={styles.metricLabel}>Total Volume</Text>
          <View style={styles.metricTrend}>
            <TrendingUp size={12} color={Theme.colors.success} />
            <Text style={styles.trendText}>+23%</Text>
          </View>
        </View>
      </View>

      {/* System Health */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Shield size={24} color={Theme.colors.primary} />
          <Text style={styles.cardTitle}>System Health</Text>
        </View>
        
        <View style={styles.healthGrid}>
          <View style={styles.healthItem}>
            <View style={styles.healthIcon}>
              <Database size={20} color={Theme.colors.success} />
            </View>
            <Text style={styles.healthLabel}>Database</Text>
            <Text style={[styles.healthStatus, styles.healthOperational]}>Operational</Text>
          </View>

          <View style={styles.healthItem}>
            <View style={styles.healthIcon}>
              <Globe size={20} color={Theme.colors.success} />
            </View>
            <Text style={styles.healthLabel}>API</Text>
            <Text style={[styles.healthStatus, styles.healthOperational]}>Operational</Text>
          </View>

          <View style={styles.healthItem}>
            <View style={styles.healthIcon}>
              <TrendingUp size={20} color={Theme.colors.success} />
            </View>
            <Text style={styles.healthLabel}>Exchange Rates</Text>
            <Text style={[styles.healthStatus, styles.healthOperational]}>Operational</Text>
          </View>

          <View style={styles.healthItem}>
            <View style={styles.healthIcon}>
              <Clock size={20} color={Theme.colors.warning} />
            </View>
            <Text style={styles.healthLabel}>Uptime</Text>
            <Text style={[styles.healthStatus, styles.healthWarning]}>{stats.systemHealth.uptime}%</Text>
          </View>
        </View>
      </View>

      {/* Top Categories */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <PieChart size={24} color={Theme.colors.success} />
          <Text style={styles.cardTitle}>Top Categories</Text>
        </View>
        {stats.topCategories.map((item, index) => (
          <View key={item.category} style={styles.categoryItem}>
            <View style={styles.categoryInfo}>
              <View 
                style={[
                  styles.categoryDot, 
                  { backgroundColor: `hsl(${index * 60}, 70%, 50%)` }
                ]} 
              />
              <Text style={styles.categoryName}>{item.category}</Text>
            </View>
            <View style={styles.categoryStats}>
              <Text style={styles.categoryCount}>{item.count} transactions</Text>
              <Text style={styles.categoryAmount}>₨{(item.amount / 1000).toFixed(1)}K</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Recent Activity */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Activity size={24} color={Theme.colors.info} />
          <Text style={styles.cardTitle}>Recent Activity</Text>
        </View>
        {stats.recentActivity.map((activity) => (
          <View key={activity.id} style={styles.activityItem}>
            <View style={styles.activityIcon}>
              {activity.type === 'user_signup' && <UserPlus size={16} color={Theme.colors.success} />}
              {activity.type === 'admin_action' && <Shield size={16} color={Theme.colors.primary} />}
              {activity.type === 'system_event' && <Server size={16} color={Theme.colors.info} />}
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityDescription}>{activity.description}</Text>
              <Text style={styles.activityTimestamp}>
                {new Date(activity.timestamp).toLocaleString()}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderUsersTab = () => (
    <ScrollView 
      style={styles.tabContent}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color={Theme.colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor={Theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <View style={styles.filterRow}>
          <TouchableOpacity 
            style={[styles.filterButton, filterRole !== 'all' && styles.filterActive]}
            onPress={() => setFilterRole('all')}
          >
            <Text style={[styles.filterText, filterRole === 'all' && styles.filterTextActive]}>All Roles</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, filterRole === 'user' && styles.filterActive]}
            onPress={() => setFilterRole('user')}
          >
            <Text style={[styles.filterText, filterRole === 'user' && styles.filterTextActive]}>Users</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, filterRole === 'admin' && styles.filterActive]}
            onPress={() => setFilterRole('admin')}
          >
            <Text style={[styles.filterText, filterRole === 'admin' && styles.filterTextActive]}>Admins</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Users List */}
      {filteredUsers.map((user) => (
        <View key={user.id} style={styles.userCard}>
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Text style={styles.userInitials}>
                {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user.full_name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={styles.userMeta}>
                <View style={[styles.userRole, user.user_role === 'super_admin' && styles.roleSuperAdmin]}>
                  <Crown size={12} color={user.user_role === 'super_admin' ? Theme.colors.warning : Theme.colors.textSecondary} />
                  <Text style={[styles.roleText, user.user_role === 'super_admin' && styles.roleTextSuperAdmin]}>
                    {user.user_role.replace('_', ' ')}
                  </Text>
                </View>
                <View style={[styles.userStatus, user.is_active ? styles.statusActive : styles.statusInactive]}>
                  <Text style={[styles.statusText, user.is_active ? styles.statusTextActive : styles.statusTextInactive]}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.userStats}>
            <Text style={styles.userStatValue}>{user.transaction_count}</Text>
            <Text style={styles.userStatLabel}>Transactions</Text>
          </View>
          
          <View style={styles.userActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                setSelectedUser(user);
                setShowUserModal(true);
              }}
            >
              <Eye size={16} color={Theme.colors.primary} />
            </TouchableOpacity>
            
            {user.user_role === 'user' && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleUserAction('promote', user)}
              >
                <UserCheck size={16} color={Theme.colors.success} />
              </TouchableOpacity>
            )}
            
            {user.user_role === 'admin' && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleUserAction('demote', user)}
              >
                <UserX size={16} color={Theme.colors.warning} />
              </TouchableOpacity>
            )}
            
            {user.is_active ? (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleUserAction('ban', user)}
              >
                <Lock size={16} color={Theme.colors.error} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleUserAction('unban', user)}
              >
                <Unlock size={16} color={Theme.colors.success} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderActionsTab = () => (
    <ScrollView 
      style={styles.tabContent}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      {adminActions.map((action) => (
        <View key={action.id} style={styles.actionCard}>
          <View style={styles.actionHeader}>
            <View style={styles.actionIcon}>
              {action.action_type === 'user_role_change' && <UserCheck size={20} color={Theme.colors.primary} />}
              {action.action_type === 'user_ban' && <UserX size={20} color={Theme.colors.error} />}
              {action.action_type === 'user_unban' && <UserCheck size={20} color={Theme.colors.success} />}
              {action.action_type === 'system_config' && <Settings size={20} color={Theme.colors.warning} />}
              {action.action_type === 'data_export' && <Download size={20} color={Theme.colors.info} />}
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionDescription}>{action.description}</Text>
              <Text style={styles.actionAdmin}>by {action.admin_user}</Text>
              <Text style={styles.actionTimestamp}>
                {new Date(action.timestamp).toLocaleString()}
              </Text>
            </View>
          </View>
          {action.target_user && (
            <View style={styles.actionTarget}>
              <Text style={styles.actionTargetLabel}>Target:</Text>
              <Text style={styles.actionTargetUser}>{action.target_user}</Text>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );

  const renderSystemTab = () => (
    <ScrollView 
      style={styles.tabContent}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      {/* System Configuration */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Settings size={24} color={Theme.colors.primary} />
          <Text style={styles.cardTitle}>System Configuration</Text>
        </View>
        
        <View style={styles.configItem}>
          <Text style={styles.configLabel}>Rate Limiting</Text>
          <TouchableOpacity style={styles.configButton}>
            <Text style={styles.configButtonText}>Configure</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.configItem}>
          <Text style={styles.configLabel}>Backup Schedule</Text>
          <TouchableOpacity style={styles.configButton}>
            <Text style={styles.configButtonText}>Configure</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.configItem}>
          <Text style={styles.configLabel}>Email Notifications</Text>
          <TouchableOpacity style={styles.configButton}>
            <Text style={styles.configButtonText}>Configure</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Data Management */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Database size={24} color={Theme.colors.success} />
          <Text style={styles.cardTitle}>Data Management</Text>
        </View>
        
        <TouchableOpacity style={styles.dataAction}>
          <Download size={20} color={Theme.colors.primary} />
          <Text style={styles.dataActionText}>Export All Data</Text>
          <ArrowRight size={16} color={Theme.colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.dataAction}>
          <Archive size={20} color={Theme.colors.warning} />
          <Text style={styles.dataActionText}>Backup Database</Text>
          <ArrowRight size={16} color={Theme.colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.dataAction}>
          <Trash size={20} color={Theme.colors.error} />
          <Text style={styles.dataActionText}>Clean Old Data</Text>
          <ArrowRight size={16} color={Theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Performance Monitoring */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Activity size={24} color={Theme.colors.info} />
          <Text style={styles.cardTitle}>Performance</Text>
        </View>
        
        <View style={styles.performanceItem}>
          <Cpu size={20} color={Theme.colors.primary} />
          <Text style={styles.performanceLabel}>CPU Usage</Text>
          <Text style={styles.performanceValue}>45%</Text>
        </View>
        
        <View style={styles.performanceItem}>
          <HardDrive size={20} color={Theme.colors.success} />
          <Text style={styles.performanceLabel}>Storage</Text>
          <Text style={styles.performanceValue}>78%</Text>
        </View>
        
        <View style={styles.performanceItem}>
          <Wifi size={20} color={Theme.colors.warning} />
          <Text style={styles.performanceLabel}>Network</Text>
          <Text style={styles.performanceValue}>23%</Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[Theme.colors.primary, Theme.colors.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>Admin Dashboard</Text>
            <Text style={styles.subtitle}>Smart Finance Manager Administration</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Bell size={20} color={Theme.colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Settings size={20} color={Theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity 
          style={[styles.tabButton, selectedTab === 'overview' && styles.tabActive]}
          onPress={() => setSelectedTab('overview')}
        >
          <BarChart3 size={20} color={selectedTab === 'overview' ? Theme.colors.primary : Theme.colors.textSecondary} />
          <Text style={[styles.tabText, selectedTab === 'overview' && styles.tabTextActive]}>Overview</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, selectedTab === 'users' && styles.tabActive]}
          onPress={() => setSelectedTab('users')}
        >
          <Users size={20} color={selectedTab === 'users' ? Theme.colors.primary : Theme.colors.textSecondary} />
          <Text style={[styles.tabText, selectedTab === 'users' && styles.tabTextActive]}>Users</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, selectedTab === 'actions' && styles.tabActive]}
          onPress={() => setSelectedTab('actions')}
        >
          <Activity size={20} color={selectedTab === 'actions' ? Theme.colors.primary : Theme.colors.textSecondary} />
          <Text style={[styles.tabText, selectedTab === 'actions' && styles.tabTextActive]}>Actions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, selectedTab === 'system' && styles.tabActive]}
          onPress={() => setSelectedTab('system')}
        >
          <Settings size={20} color={selectedTab === 'system' ? Theme.colors.primary : Theme.colors.textSecondary} />
          <Text style={[styles.tabText, selectedTab === 'system' && styles.tabTextActive]}>System</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Theme.colors.primary} />
            <Text style={styles.loadingText}>Loading admin data...</Text>
          </View>
        ) : (
          <>
            {selectedTab === 'overview' && renderOverviewTab()}
            {selectedTab === 'users' && renderUsersTab()}
            {selectedTab === 'actions' && renderActionsTab()}
            {selectedTab === 'system' && renderSystemTab()}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    padding: 30,
    paddingTop: 60,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Theme.colors.textPrimary,
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    fontFamily: 'Inter-Regular',
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.backgroundSecondary,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
  },
  tabActive: {
    backgroundColor: Theme.colors.primaryLight,
    borderRadius: 20,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
    marginLeft: 8,
    fontFamily: 'Inter-SemiBold',
  },
  tabTextActive: {
    color: Theme.colors.primary,
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: Theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 400,
  },
  loadingText: {
    textAlign: 'center',
    color: Theme.colors.textSecondary,
    padding: 40,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  placeholderText: {
    fontSize: 18,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  // Overview Tab Styles
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    backgroundColor: Theme.colors.card,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    width: (width - 56) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  metricIcon: {
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.textPrimary,
    marginTop: 8,
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  metricLabel: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  metricTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  trendText: {
    fontSize: 12,
    color: Theme.colors.success,
    fontWeight: '600',
    marginLeft: 4,
    fontFamily: 'Inter-SemiBold',
  },
  card: {
    backgroundColor: Theme.colors.card,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.textPrimary,
    marginLeft: 8,
    fontFamily: 'Inter-Bold',
  },
  healthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  healthItem: {
    alignItems: 'center',
    marginVertical: 10,
  },
  healthIcon: {
    marginBottom: 8,
  },
  healthLabel: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    fontFamily: 'Inter-Regular',
  },
  healthStatus: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  healthOperational: {
    color: Theme.colors.success,
  },
  healthWarning: {
    color: Theme.colors.warning,
  },
  healthError: {
    color: Theme.colors.error,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    color: Theme.colors.textPrimary,
    fontFamily: 'Inter-Regular',
  },
  categoryStats: {
    alignItems: 'flex-end',
  },
  categoryCount: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    fontFamily: 'Inter-Regular',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    fontFamily: 'Inter-SemiBold',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  activityIcon: {
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 16,
    color: Theme.colors.textPrimary,
    fontFamily: 'Inter-Regular',
  },
  activityTimestamp: {
    fontSize: 12,
    color: Theme.colors.textTertiary,
    marginTop: 4,
    fontFamily: 'Inter-Regular',
  },
  // Users Tab Styles
  searchContainer: {
    marginBottom: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.card,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Theme.colors.textPrimary,
    fontFamily: 'Inter-Regular',
    paddingVertical: 0,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    marginBottom: 20,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.card,
  },
  filterActive: {
    backgroundColor: Theme.colors.primaryLight,
    borderColor: Theme.colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
    fontFamily: 'Inter-SemiBold',
  },
  filterTextActive: {
    color: Theme.colors.primary,
  },
  userCard: {
    backgroundColor: Theme.colors.card,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInitials: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.primary,
    fontFamily: 'Inter-Bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    fontFamily: 'Inter-SemiBold',
  },
  userEmail: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    fontFamily: 'Inter-Regular',
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  userRole: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primaryLight,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 10,
  },
  roleSuperAdmin: {
    backgroundColor: Theme.colors.warningLight,
  },
  roleText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginLeft: 4,
    fontFamily: 'Inter-Regular',
  },
  roleTextSuperAdmin: {
    color: Theme.colors.warning,
  },
  userStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.successLight,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  statusActive: {
    backgroundColor: Theme.colors.successLight,
  },
  statusInactive: {
    backgroundColor: Theme.colors.errorLight,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  statusTextActive: {
    color: Theme.colors.success,
  },
  statusTextInactive: {
    color: Theme.colors.error,
  },
  userStats: {
    alignItems: 'center',
    marginRight: 15,
  },
  userStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.textPrimary,
    fontFamily: 'Inter-Bold',
  },
  userStatLabel: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    fontFamily: 'Inter-Regular',
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
  },
  // Actions Tab Styles
  actionCard: {
    backgroundColor: Theme.colors.card,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionIcon: {
    marginRight: 12,
  },
  actionInfo: {
    flex: 1,
  },
  actionDescription: {
    fontSize: 16,
    color: Theme.colors.textPrimary,
    fontFamily: 'Inter-Regular',
  },
  actionAdmin: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 4,
    fontFamily: 'Inter-Regular',
  },
  actionTimestamp: {
    fontSize: 12,
    color: Theme.colors.textTertiary,
    marginTop: 4,
    fontFamily: 'Inter-Regular',
  },
  actionTarget: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionTargetLabel: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    fontFamily: 'Inter-Regular',
  },
  actionTargetUser: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    fontFamily: 'Inter-SemiBold',
  },
  // System Tab Styles
  configItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  configLabel: {
    fontSize: 16,
    color: Theme.colors.textPrimary,
    fontFamily: 'Inter-Regular',
  },
  configButton: {
    backgroundColor: Theme.colors.primaryLight,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
  },
  configButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.primary,
    fontFamily: 'Inter-SemiBold',
  },
  dataAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  dataActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    fontFamily: 'Inter-SemiBold',
  },
  performanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  performanceLabel: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    fontFamily: 'Inter-Regular',
  },
  performanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.textPrimary,
    fontFamily: 'Inter-Bold',
  },
});