import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, TrendingDown, DollarSign, Plus, CircleAlert as AlertCircle, Camera } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useTransactions } from '@/hooks/useTransactions';
import { useBudgets } from '@/hooks/useBudgets';
import { ExchangeRateService } from '@/services/exchangeRateService';
import AuthScreen from '@/components/AuthScreen';
import LoadingScreen from '@/components/LoadingScreen';
import ReceiptScanner from '@/components/ReceiptScanner';
import { router } from 'expo-router';
import { responsiveStyles } from '@/utils/responsiveStyles';
import Theme from '@/constants/Theme';

export default function DashboardScreen() {
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile(user?.id);
  const { transactions, loading: transactionsLoading, refetch } = useTransactions(user?.id);
  const { budgets } = useBudgets(user?.id);
  const [refreshing, setRefreshing] = useState(false);
  const [showReceiptScanner, setShowReceiptScanner] = useState(false);
  const [fabExpanded, setFabExpanded] = useState(false);
  const fabAnimation = useRef(new Animated.Value(0)).current;
  const [monthlyStats, setMonthlyStats] = useState({
    income: 0,
    expenses: 0,
    savings: 0,
  });

  useEffect(() => {
    calculateMonthlyStats();
  }, [transactions]);

  const calculateMonthlyStats = async () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    let totalIncome = 0;
    let totalExpenses = 0;

    for (const transaction of monthlyTransactions) {
      // Convert to USD for consistent calculations
      const convertedAmount = await ExchangeRateService.convertCurrency(
        Math.abs(transaction.amount),
        transaction.currency,
        'PKR'
      );

      if (transaction.type === 'income') {
        totalIncome += convertedAmount;
      } else {
        totalExpenses += convertedAmount;
      }
    }

    setMonthlyStats({
      income: totalIncome,
      expenses: totalExpenses,
      savings: totalIncome - totalExpenses,
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const toggleFab = () => {
    if (fabExpanded) {
      // Currently expanded, so collapse
      setFabExpanded(false);
      Animated.timing(fabAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
          } else {
        // Currently collapsed, so expand
        setFabExpanded(true);
        Animated.timing(fabAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }).start();
      }
  };

  const getBudgetAlerts = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return budgets.filter(budget => {
      const categoryExpenses = transactions
        .filter(t => {
          const transactionDate = new Date(t.date);
          return t.type === 'expense' &&
                 t.category === budget.category &&
                 transactionDate.getMonth() === currentMonth &&
                 transactionDate.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      return categoryExpenses > budget.amount * 0.8; // Alert at 80% of budget
    });
  };

  if (authLoading) {
    return (
      <LoadingScreen />
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const budgetAlerts = getBudgetAlerts();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Good morning</Text>
                          <Text style={styles.userName}>{profile?.full_name || user.user_metadata?.full_name || 'User'}</Text>
        </View>

        {budgetAlerts.length > 0 && (
          <View style={styles.alertCard}>
            <AlertCircle size={20} color="#DC2626" />
            <Text style={styles.alertText}>
              {budgetAlerts.length} budget alert{budgetAlerts.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}

        <LinearGradient
          colors={Theme.colors.gradientPrimary}
          style={styles.balanceCard}
        >
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>
            {ExchangeRateService.formatCurrency(monthlyStats.savings, 'PKR')}
          </Text>
          <Text style={styles.balanceSubtext}>This month</Text>
        </LinearGradient>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <TrendingUp size={24} color="#059669" />
            </View>
            <Text style={styles.statLabel}>Income</Text>
            <Text style={styles.statAmount}>
              {ExchangeRateService.formatCurrency(monthlyStats.income, 'PKR')}
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <TrendingDown size={24} color="#DC2626" />
            </View>
            <Text style={styles.statLabel}>Expenses</Text>
            <Text style={styles.statAmount}>
              {ExchangeRateService.formatCurrency(monthlyStats.expenses, 'PKR')}
            </Text>
          </View>
        </View>

        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {transactionsLoading ? (
            <Text style={styles.loadingText}>Loading transactions...</Text>
          ) : transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <DollarSign size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>
                Start by adding your first transaction
              </Text>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {transactions.slice(0, 5).map((transaction) => (
                <View key={transaction.id} style={styles.transactionItem}>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionCategory}>
                      {transaction.category}
                    </Text>
                    <Text style={styles.transactionDescription}>
                      {transaction.description || 'No description'}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.transactionAmount,
                      transaction.type === 'income' 
                        ? styles.incomeAmount 
                        : styles.expenseAmount
                    ]}
                  >
                    {transaction.type === 'income' ? '+' : '-'}
                    {ExchangeRateService.formatCurrency(
                      Math.abs(transaction.amount), 
                      transaction.currency
                    )}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Expandable FAB */}
      <View style={styles.fabContainer}>


        {/* Add Transaction Button */}
        <Animated.View
          style={[
            styles.expandableFab,
            styles.addFab,
            {
              transform: [{
                translateY: fabAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -70],
                }),
              }],
              opacity: fabAnimation,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.expandableFabButton}
            onPress={() => {
              router.push('/(tabs)/transactions');
              toggleFab();
            }}
            activeOpacity={0.7}
          >
            <Plus size={20} color="white" />
          </TouchableOpacity>
        </Animated.View>

        {/* Camera Button */}
        <Animated.View
          style={[
            styles.expandableFab,
            styles.cameraFab,
            {
              transform: [{
                translateY: fabAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -140],
                }),
              }],
              opacity: fabAnimation,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.expandableFabButton}
            onPress={() => {
              setShowReceiptScanner(true);
              toggleFab();
            }}
            activeOpacity={0.7}
          >
            <Camera size={20} color="white" />
          </TouchableOpacity>
        </Animated.View>

        {/* Main FAB */}
        <TouchableOpacity
          style={styles.mainFab}
                  onPress={() => {
          toggleFab();
        }}
          activeOpacity={0.8}
        >
          <Animated.View
            style={{
              transform: [{
                rotate: fabAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '45deg'],
                }),
              }],
            }}
          >
            <Plus size={24} color="white" />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Receipt Scanner Modal */}
      <ReceiptScanner
        isVisible={showReceiptScanner}
        onClose={() => setShowReceiptScanner(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollView: {
    flex: 1,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
  },
  header: {
    padding: Theme.spacing.lg,
    paddingBottom: Theme.spacing.sm,
  },
  greeting: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  userName: {
    fontSize: Theme.typography.fontSize['2xl'],
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily.bold,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    margin: Theme.spacing.lg,
    marginTop: Theme.spacing.sm,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.error,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  alertText: {
    marginLeft: Theme.spacing.sm,
    color: Theme.colors.errorLight,
    fontFamily: Theme.typography.fontFamily.medium,
  },
  balanceCard: {
    margin: Theme.spacing.lg,
    padding: Theme.spacing['2xl'],
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center',
    ...Theme.cards.primary,
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: Theme.typography.fontSize.base,
    marginBottom: Theme.spacing.sm,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  balanceAmount: {
    color: Theme.colors.textPrimary,
    fontSize: 32, // Reduced from 4xl to fit better
    marginBottom: Theme.spacing.xs,
    fontFamily: Theme.typography.fontFamily.bold,
    textAlign: 'center',
  },
  balanceSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Theme.spacing.lg,
    gap: Theme.spacing.md,
  },
  statCard: {
    flex: 1,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center',
    ...Theme.cards.card,
  },
  statIcon: {
    marginBottom: Theme.spacing.sm,
  },
  statLabel: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textTertiary,
    marginBottom: Theme.spacing.xs,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  statAmount: {
    fontSize: Theme.typography.fontSize.lg,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily.bold,
  },
  recentSection: {
    padding: Theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: Theme.typography.fontSize.xl,
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.md,
    fontFamily: Theme.typography.fontFamily.bold,
  },
  loadingText: {
    textAlign: 'center',
    color: Theme.colors.textTertiary,
    padding: Theme.spacing.lg,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  emptyState: {
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  emptyText: {
    fontSize: Theme.typography.fontSize.lg,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.md,
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  emptySubtext: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textTertiary,
    marginTop: Theme.spacing.xs,
    textAlign: 'center',
    fontFamily: Theme.typography.fontFamily.regular,
  },
  transactionsList: {
    gap: Theme.spacing.md,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    ...Theme.cards.card,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.xs,
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  transactionDescription: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  transactionAmount: {
    fontSize: Theme.typography.fontSize.base,
    fontFamily: Theme.typography.fontFamily.bold,
  },
  incomeAmount: {
    color: Theme.colors.success,
  },
  expenseAmount: {
    color: Theme.colors.error,
  },
  fabContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.glass,
    zIndex: 1000,
  },

  expandableFab: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.glass,
    zIndex: 999,
    bottom: 0,
  },
  expandableFabButton: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraFab: {
    backgroundColor: Theme.colors.success,
  },
  addFab: {
    backgroundColor: Theme.colors.info,
  },

});