import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, ChartPie as PieChart, Calendar, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { AIService } from '@/services/aiService';
import { ExchangeRateService } from '@/services/exchangeRateService';
import AuthScreen from '@/components/AuthScreen';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const { transactions, loading } = useTransactions(user?.id);
  const [categoryData, setCategoryData] = useState<Array<{ category: string; amount: number; percentage: number }>>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<Array<{ month: string; amount: number }>>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [forecast, setForecast] = useState(0);

  useEffect(() => {
    if (transactions.length > 0) {
      analyzeTransactions();
    }
  }, [transactions]);

  const analyzeTransactions = async () => {
    // Category breakdown for current month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyExpenses = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return t.type === 'expense' &&
             transactionDate.getMonth() === currentMonth &&
             transactionDate.getFullYear() === currentYear;
    });

    const categoryTotals: Record<string, number> = {};
    let totalExpenses = 0;

    for (const transaction of monthlyExpenses) {
      const convertedAmount = await ExchangeRateService.convertCurrency(
        Math.abs(transaction.amount),
        transaction.currency,
        'PKR'
      );
      
      categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + convertedAmount;
      totalExpenses += convertedAmount;
    }

    const categoryArray = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalExpenses) * 100,
      }))
      .sort((a, b) => b.amount - a.amount);

    setCategoryData(categoryArray);

    // Monthly trend (last 6 months)
    const monthlyData: Record<string, number> = {};
    const months = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      months.push({ key: monthKey, name: monthName });
      monthlyData[monthKey] = 0;
    }

    for (const transaction of transactions) {
      if (transaction.type === 'expense') {
        const transactionDate = new Date(transaction.date);
        const monthKey = `${transactionDate.getFullYear()}-${transactionDate.getMonth()}`;
        
        if (monthlyData.hasOwnProperty(monthKey)) {
          const convertedAmount = await ExchangeRateService.convertCurrency(
            Math.abs(transaction.amount),
            transaction.currency,
            'PKR'
          );
          monthlyData[monthKey] += convertedAmount;
        }
      }
    }

    const trendData = months.map(({ key, name }) => ({
      month: name,
      amount: monthlyData[key],
    }));

    setMonthlyTrend(trendData);

    // Detect anomalies
    const recentAmounts = transactions
      .slice(0, 20)
      .map(t => Math.abs(t.amount));

    const anomalousTransactions = transactions.filter(transaction => {
      return AIService.detectAnomaly(Math.abs(transaction.amount), recentAmounts);
    });

    setAnomalies(anomalousTransactions);

    // Forecast next month
    const historicalMonthlyExpenses = Object.values(monthlyData);
    const forecastedAmount = AIService.forecastMonthlyExpenses(historicalMonthlyExpenses);
    setForecast(forecastedAmount);
  };

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <Text style={styles.loadingText}>Loading analytics...</Text>
        ) : (
          <>
            {/* Forecast Card */}
            <View style={styles.forecastCard}>
              <View style={styles.cardHeader}>
                <TrendingUp size={24} color="#2563EB" />
                <Text style={styles.cardTitle}>Monthly Forecast</Text>
              </View>
              <Text style={styles.forecastAmount}>
                {ExchangeRateService.formatCurrency(forecast, 'PKR')}
              </Text>
              <Text style={styles.forecastSubtext}>
                Predicted expenses for next month
              </Text>
            </View>

            {/* Category Breakdown */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <PieChart size={24} color="#059669" />
                <Text style={styles.cardTitle}>Category Breakdown</Text>
              </View>
              {categoryData.length === 0 ? (
                <Text style={styles.emptyText}>No expense data for this month</Text>
              ) : (
                <View style={styles.categoryList}>
                  {categoryData.slice(0, 5).map((item, index) => (
                    <View key={item.category} style={styles.categoryItem}>
                      <View style={styles.categoryInfo}>
                        <View 
                          style={[
                            styles.categoryColor, 
                            { backgroundColor: `hsl(${index * 60}, 70%, 50%)` }
                          ]} 
                        />
                        <Text style={styles.categoryName}>{item.category}</Text>
                      </View>
                      <View style={styles.categoryStats}>
                        <Text style={styles.categoryAmount}>
                          {ExchangeRateService.formatCurrency(item.amount, 'PKR')}
                        </Text>
                        <Text style={styles.categoryPercentage}>
                          {item.percentage.toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Monthly Trend */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Calendar size={24} color="#EA580C" />
                <Text style={styles.cardTitle}>Monthly Trend</Text>
              </View>
              <View style={styles.trendChart}>
                {monthlyTrend.map((item, index) => {
                  const maxAmount = Math.max(...monthlyTrend.map(d => d.amount));
                  const height = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
                  
                  return (
                    <View key={item.month} style={styles.trendBar}>
                      <View style={styles.trendBarContainer}>
                        <View 
                          style={[
                            styles.trendBarFill, 
                            { height: `${height}%` }
                          ]} 
                        />
                      </View>
                      <Text style={styles.trendBarLabel}>{item.month}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Anomalies */}
            {anomalies.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <AlertTriangle size={24} color="#DC2626" />
                  <Text style={styles.cardTitle}>Unusual Transactions</Text>
                </View>
                <View style={styles.anomaliesList}>
                  {anomalies.slice(0, 3).map((transaction) => (
                    <View key={transaction.id} style={styles.anomalyItem}>
                      <View style={styles.anomalyInfo}>
                        <Text style={styles.anomalyCategory}>
                          {transaction.category}
                        </Text>
                        <Text style={styles.anomalyDate}>
                          {new Date(transaction.date).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text style={styles.anomalyAmount}>
                        {ExchangeRateService.formatCurrency(
                          Math.abs(transaction.amount), 
                          transaction.currency
                        )}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    fontFamily: 'Inter-Bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingText: {
    textAlign: 'center',
    color: '#6B7280',
    padding: 20,
    fontFamily: 'Inter-Regular',
  },
  forecastCard: {
    backgroundColor: '#EFF6FF',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
    fontFamily: 'Inter-Bold',
  },
  forecastAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  forecastSubtext: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    fontStyle: 'italic',
    fontFamily: 'Inter-Regular',
  },
  categoryList: {
    gap: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
    fontFamily: 'Inter-Regular',
  },
  categoryStats: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'Inter-SemiBold',
  },
  categoryPercentage: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  trendChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingBottom: 20,
  },
  trendBar: {
    alignItems: 'center',
    flex: 1,
  },
  trendBarContainer: {
    height: 80,
    width: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  trendBarFill: {
    backgroundColor: '#EA580C',
    width: '100%',
    borderRadius: 4,
  },
  trendBarLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    fontFamily: 'Inter-Regular',
  },
  anomaliesList: {
    gap: 12,
  },
  anomalyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  anomalyInfo: {
    flex: 1,
  },
  anomalyCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'Inter-SemiBold',
  },
  anomalyDate: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  anomalyAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC2626',
    fontFamily: 'Inter-Bold',
  },
});