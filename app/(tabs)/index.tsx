import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, TrendingDown, DollarSign, Plus, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { useBudgets } from '@/hooks/useBudgets';
import { ExchangeRateService } from '@/services/exchangeRateService';
import AuthScreen from '@/components/AuthScreen';
import LoadingScreen from '@/components/LoadingScreen';
import { router } from 'expo-router';
import { responsiveStyles } from '@/utils/responsiveStyles';

export default function DashboardScreen() {
  const { user, loading: authLoading } = useAuth();
  const { transactions, loading: transactionsLoading, refetch } = useTransactions(user?.id);
  const { budgets } = useBudgets(user?.id);
  const [refreshing, setRefreshing] = useState(false);
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
          <Text style={styles.userName}>{user.user_metadata?.full_name || 'User'}</Text>
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
          colors={['#2563EB', '#1D4ED8']}
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

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/(tabs)/transactions')}
      >
        <Plus size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    fontFamily: 'Inter-Bold',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    margin: 20,
    marginTop: 10,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  alertText: {
    marginLeft: 8,
    color: '#DC2626',
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  balanceCard: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
  balanceAmount: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  balanceSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    fontFamily: 'Inter-Regular',
  },
  statAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    fontFamily: 'Inter-Bold',
  },
  recentSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    fontFamily: 'Inter-Bold',
  },
  loadingText: {
    textAlign: 'center',
    color: '#6B7280',
    padding: 20,
    fontFamily: 'Inter-Regular',
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    fontFamily: 'Inter-SemiBold',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
    fontFamily: 'Inter-SemiBold',
  },
  transactionDescription: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  incomeAmount: {
    color: '#059669',
  },
  expenseAmount: {
    color: '#DC2626',
  },
  fab: responsiveStyles.fab,
});