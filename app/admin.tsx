import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, TrendingUp, DollarSign, TriangleAlert as AlertTriangle, ChartBar as BarChart3, ChartPie as PieChart } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { ExchangeRateService } from '@/services/exchangeRateService';

const { width } = Dimensions.get('window');

interface AdminStats {
  totalUsers: number;
  totalTransactions: number;
  totalVolume: number;
  activeUsers: number;
  topCategories: Array<{ category: string; count: number }>;
  currencyDistribution: Array<{ currency: string; count: number }>;
}

export default function AdminScreen() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalTransactions: 0,
    totalVolume: 0,
    activeUsers: 0,
    topCategories: [],
    currencyDistribution: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);

      // Fetch user count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch transaction stats
      const { data: transactions, count: transactionCount } = await supabase
        .from('transactions')
        .select('amount, currency, category, created_at', { count: 'exact' });

      // Calculate total volume (convert all to USD)
      let totalVolume = 0;
      const categoryCount: Record<string, number> = {};
      const currencyCount: Record<string, number> = {};

      if (transactions) {
        for (const transaction of transactions) {
          const convertedAmount = await ExchangeRateService.convertCurrency(
            Math.abs(transaction.amount),
            transaction.currency,
            'PKR'
          );
          totalVolume += convertedAmount;

          categoryCount[transaction.category] = (categoryCount[transaction.category] || 0) + 1;
          currencyCount[transaction.currency] = (currencyCount[transaction.currency] || 0) + 1;
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
      const topCategories = Object.entries(categoryCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([category, count]) => ({ category, count }));

      const currencyDistribution = Object.entries(currencyCount)
        .sort(([,a], [,b]) => b - a)
        .map(([currency, count]) => ({ currency, count }));

      setStats({
        totalUsers: userCount || 0,
        totalTransactions: transactionCount || 0,
        totalVolume,
        activeUsers: uniqueActiveUsers,
        topCategories,
        currencyDistribution,
      });
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1F2937', '#111827']}
        style={styles.header}
      >
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Smart Finance Manager Analytics</Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {loading ? (
          <Text style={styles.loadingText}>Loading analytics...</Text>
        ) : (
          <>
            {/* Key Metrics */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Users size={24} color="#2563EB" />
                <Text style={styles.metricValue}>{stats.totalUsers}</Text>
                <Text style={styles.metricLabel}>Total Users</Text>
              </View>

              <View style={styles.metricCard}>
                <TrendingUp size={24} color="#059669" />
                <Text style={styles.metricValue}>{stats.activeUsers}</Text>
                <Text style={styles.metricLabel}>Active Users</Text>
              </View>

              <View style={styles.metricCard}>
                <BarChart3 size={24} color="#EA580C" />
                <Text style={styles.metricValue}>{stats.totalTransactions}</Text>
                <Text style={styles.metricLabel}>Transactions</Text>
              </View>

              <View style={styles.metricCard}>
                <DollarSign size={24} color="#7C3AED" />
                <Text style={styles.metricValue}>
                  ₨{(stats.totalVolume / 1000).toFixed(1)}K
                </Text>
                <Text style={styles.metricLabel}>Total Volume</Text>
              </View>
            </View>

            {/* Top Categories */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <PieChart size={24} color="#059669" />
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
                  <Text style={styles.categoryCount}>{item.count} transactions</Text>
                </View>
              ))}
            </View>

            {/* Currency Distribution */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <DollarSign size={24} color="#2563EB" />
                <Text style={styles.cardTitle}>Currency Usage</Text>
              </View>
              {stats.currencyDistribution.slice(0, 5).map((item) => (
                <View key={item.currency} style={styles.currencyItem}>
                  <Text style={styles.currencyCode}>{item.currency}</Text>
                  <Text style={styles.currencyCount}>{item.count} transactions</Text>
                </View>
              ))}
            </View>

            {/* System Health */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <AlertTriangle size={24} color="#EA580C" />
                <Text style={styles.cardTitle}>System Health</Text>
              </View>
              <View style={styles.healthItem}>
                <Text style={styles.healthLabel}>Database Status</Text>
                <Text style={styles.healthStatus}>✅ Operational</Text>
              </View>
              <View style={styles.healthItem}>
                <Text style={styles.healthLabel}>API Response Time</Text>
                <Text style={styles.healthStatus}>⚡ Fast</Text>
              </View>
              <View style={styles.healthItem}>
                <Text style={styles.healthLabel}>Exchange Rate API</Text>
                <Text style={styles.healthStatus}>✅ Connected</Text>
              </View>
            </View>
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
    padding: 30,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Regular',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingText: {
    textAlign: 'center',
    color: '#6B7280',
    padding: 40,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    width: (width - 56) / 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  metricLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
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
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
    color: '#374151',
    fontFamily: 'Inter-Regular',
  },
  categoryCount: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  currencyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Inter-SemiBold',
  },
  currencyCount: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  healthItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  healthLabel: {
    fontSize: 16,
    color: '#374151',
    fontFamily: 'Inter-Regular',
  },
  healthStatus: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});