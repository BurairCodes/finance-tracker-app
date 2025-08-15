import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Target, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { useBudgets } from '@/hooks/useBudgets';
import { ExchangeRateService } from '@/services/exchangeRateService';
import { NotificationService } from '@/services/notificationService';
import AuthScreen from '@/components/AuthScreen';
import BudgetModal from '@/components/BudgetModal';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function BudgetsScreen() {
  const { user } = useAuth();
  const { transactions } = useTransactions(user?.id);
  const { budgets, loading, addBudget, deleteBudget } = useBudgets(user?.id);
  const [showAddModal, setShowAddModal] = useState(false);
  const [budgetSpending, setBudgetSpending] = useState<Record<string, number>>({});

  useEffect(() => {
    calculateBudgetSpending();
    NotificationService.requestPermissions();
  }, [budgets, transactions]);

  const calculateBudgetSpending = async () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const spending: Record<string, number> = {};

    for (const budget of budgets) {
      const categoryTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return t.type === 'expense' &&
               t.category === budget.category &&
               transactionDate.getMonth() === currentMonth &&
               transactionDate.getFullYear() === currentYear;
      });

      let totalSpent = 0;
      for (const transaction of categoryTransactions) {
        const convertedAmount = await ExchangeRateService.convertCurrency(
          Math.abs(transaction.amount),
          transaction.currency,
          budget.currency
        );
        totalSpent += convertedAmount;
      }

      spending[budget.category] = totalSpent;
      
      // Check for budget alerts
      await NotificationService.scheduleBudgetAlert(
        budget.category,
        totalSpent,
        budget.amount,
        budget.currency
      );
    }

    setBudgetSpending(spending);
  };

  const handleAddBudget = async (budgetData: any) => {
    const { error } = await addBudget(budgetData);

    if (error) {
      throw new Error(error);
    }
  };

  const handleDeleteBudget = (id: string) => {
    Alert.alert(
      'Delete Budget',
      'Are you sure you want to delete this budget?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteBudget(id)
        },
      ]
    );
  };

  const getBudgetStatus = (budget: any, spent: number) => {
    const percentage = (spent / budget.amount) * 100;
    
    if (percentage >= 100) return { status: 'exceeded', color: '#DC2626', icon: AlertTriangle };
    if (percentage >= 80) return { status: 'warning', color: '#EA580C', icon: AlertTriangle };
    return { status: 'good', color: '#059669', icon: CheckCircle };
  };

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Budgets</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.budgetsList}>
        {loading ? (
          <Text style={styles.loadingText}>Loading budgets...</Text>
        ) : budgets.length === 0 ? (
          <View style={styles.emptyState}>
            <Target size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No budgets set</Text>
            <Text style={styles.emptySubtext}>
              Create budgets to track your spending
            </Text>
          </View>
        ) : (
          budgets.map((budget) => {
            const spent = budgetSpending[budget.category] || 0;
            const { status, color, icon: StatusIcon } = getBudgetStatus(budget, spent);
            const percentage = Math.min((spent / budget.amount) * 100, 100);

            return (
              <TouchableOpacity
                key={budget.id}
                style={styles.budgetCard}
                onLongPress={() => handleDeleteBudget(budget.id)}
              >
                <View style={styles.budgetHeader}>
                  <View style={styles.budgetInfo}>
                    <Text style={styles.budgetCategory}>{budget.category}</Text>
                    <Text style={styles.budgetPeriod}>{budget.period}</Text>
                  </View>
                  <View style={[styles.statusIcon, { backgroundColor: `${color}20` }]}>
                    <StatusIcon size={20} color={color} />
                  </View>
                </View>

                <View style={styles.budgetProgress}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${percentage}%`, backgroundColor: color }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>{percentage.toFixed(1)}%</Text>
                </View>

                <View style={styles.budgetAmounts}>
                  <Text style={styles.spentAmount}>
                    Spent: {ExchangeRateService.formatCurrency(spent, budget.currency)}
                  </Text>
                  <Text style={styles.budgetAmount}>
                    Budget: {ExchangeRateService.formatCurrency(budget.amount, budget.currency)}
                  </Text>
                </View>

                <Text style={styles.remainingAmount}>
                  Remaining: {ExchangeRateService.formatCurrency(
                    Math.max(0, budget.amount - spent), 
                    budget.currency
                  )}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <BudgetModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddBudget}
        existingCategories={budgets.map(b => b.category)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    backgroundColor: '#2563EB',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetsList: {
    flex: 1,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 95 : 70,
  },
  loadingText: {
    textAlign: 'center',
    color: '#6B7280',
    padding: 20,
    fontFamily: 'Inter-Regular',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  budgetCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  budgetInfo: {
    flex: 1,
  },
  budgetCategory: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
    fontFamily: 'Inter-Bold',
  },
  budgetPeriod: {
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'capitalize',
    fontFamily: 'Inter-Regular',
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    minWidth: 45,
    fontFamily: 'Inter-SemiBold',
  },
  budgetAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  spentAmount: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  budgetAmount: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  remainingAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    textAlign: 'center',
    fontFamily: 'Inter-SemiBold',
  },
});