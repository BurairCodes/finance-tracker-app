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
import { Plus, Target, CreditCard, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useTransactions } from '@/hooks/useTransactions';
import { useBudgets } from '@/hooks/useBudgets';
import { useBills } from '@/hooks/useBills';
import { ExchangeRateService } from '@/services/exchangeRateService';
import { NotificationService } from '@/services/notificationService';
import AuthScreen from '@/components/AuthScreen';
import BudgetModal from '@/components/BudgetModal';
import BillsList from '@/components/BillsList';
import Theme from '@/constants/Theme';
import { Database } from '@/types/database';

// Removed unused screen dimensions

export default function BudgetsScreen() {
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);
  const { transactions } = useTransactions(user?.id);
  const { budgets, loading, addBudget, deleteBudget } = useBudgets(user?.id);
  const { bills, addBill, markBillAsPaid, deleteBill } = useBills(user?.id);
  const [activeTab, setActiveTab] = useState<'budgets' | 'bills'>('budgets');
  const [showAddModal, setShowAddModal] = useState(false);
  const [budgetSpending, setBudgetSpending] = useState<Record<string, number>>({});
  const [calculatingSpending, setCalculatingSpending] = useState(false);

  useEffect(() => {
    calculateBudgetSpending();
    NotificationService.requestPermissions();
  }, [budgets, transactions, profile, calculateBudgetSpending]);

  const calculateBudgetSpending = async () => {
    setCalculatingSpending(true);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const spending: Record<string, number> = {};

    // Process budgets sequentially to avoid rate limiting
    for (const budget of budgets) {
      const categoryTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return t.type === 'expense' &&
               t.category === budget.category &&
               transactionDate.getMonth() === currentMonth &&
               transactionDate.getFullYear() === currentYear;
      });

      let totalSpent = 0;
      
      // Process transactions sequentially to avoid API rate limiting
      for (const transaction of categoryTransactions) {
        try {
          // Only convert if transaction currency is different from budget currency
          if (transaction.currency === budget.currency) {
            totalSpent += Math.abs(transaction.amount);
          } else {
            // Convert transaction to budget currency for comparison
            const convertedAmount = await ExchangeRateService.convertCurrency(
              Math.abs(transaction.amount),
              transaction.currency,
              budget.currency
            );
            totalSpent += convertedAmount;
          }
        } catch (error) {
          console.error(`Currency conversion error for transaction ${transaction.id}:`, error);
          // Fallback: use original amount if conversion fails
          totalSpent += Math.abs(transaction.amount);
        }
      }

      spending[budget.category] = totalSpent;
      
      // Check for budget alerts using budget currency
      try {
        await NotificationService.createBudgetAlert(
          user.id,
          budget.category,
          totalSpent,
          budget.amount,
          budget.currency
        );
      } catch (error) {
        console.error(`Budget alert error for ${budget.category}:`, error);
      }
    }

    setBudgetSpending(spending);
    setCalculatingSpending(false);
  };

  const handleAddBudget = async (budgetData: {
    category: string;
    amount: number;
    currency: string;
    period: 'monthly' | 'weekly' | 'yearly';
  }) => {
    const { error } = await addBudget(budgetData);

    if (error) {
      throw new Error(error);
    }
  };

  const handleAddBill = async (billData: {
    name: string;
    amount: number;
    currency: string;
    due_date: string;
    recurring: boolean;
    category: string;
    notes?: string;
  }) => {
    await addBill(billData);
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

  const getBudgetStatus = (budget: Database['public']['Tables']['budgets']['Row'], spent: number) => {
    const percentage = (spent / budget.amount) * 100;
    
    if (percentage >= 100) return { status: 'exceeded', color: '#DC2626', icon: AlertTriangle };
    if (percentage >= 80) return { status: 'warning', color: '#EA580C', icon: AlertTriangle };
    return { status: 'good', color: '#059669', icon: CheckCircle };
  };

  // Removed unused formatAmountInBaseCurrency function

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Financial Planning</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'budgets' && styles.tabButtonActive
          ]}
          onPress={() => setActiveTab('budgets')}
        >
          <Target size={20} color={activeTab === 'budgets' ? Theme.colors.primary : Theme.colors.textTertiary} />
          <Text style={[
            styles.tabButtonText,
            activeTab === 'budgets' && styles.tabButtonTextActive
          ]}>
            Budgets
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'bills' && styles.tabButtonActive
          ]}
          onPress={() => setActiveTab('bills')}
        >
          <CreditCard size={20} color={activeTab === 'bills' ? Theme.colors.primary : Theme.colors.textTertiary} />
          <Text style={[
            styles.tabButtonText,
            activeTab === 'bills' && styles.tabButtonTextActive
          ]}>
            Bills ({bills.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'budgets' ? (
        <ScrollView style={styles.budgetsList}>
          {loading ? (
            <Text style={styles.loadingText}>Loading budgets...</Text>
          ) : calculatingSpending ? (
            <Text style={styles.loadingText}>Calculating spending...</Text>
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
              const { color, icon: StatusIcon } = getBudgetStatus(budget, spent);
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
                  
                  {budget.currency !== (profile?.base_currency || 'PKR') && (
                    <Text style={styles.currencyNote}>
                      Budget in {budget.currency} - amounts shown in budget currency
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      ) : (
        <BillsList
          bills={bills}
          onMarkAsPaid={markBillAsPaid}
          onDelete={deleteBill}
          profileCurrency={profile?.base_currency}
        />
      )}

      <BudgetModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddBudget}
        onSaveBill={handleAddBill}
        existingCategories={budgets.map(b => b.category)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  title: {
    fontSize: Theme.typography.fontSize['2xl'],
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily.bold,
  },
  addButton: {
    backgroundColor: Theme.colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.md,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 6,
    margin: Theme.spacing.lg,
    height: 56,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  tabButtonActive: {
    backgroundColor: Theme.colors.card,
    ...Theme.shadows.sm,
  },
  tabButtonText: {
    fontSize: 16,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily.medium,
    fontWeight: '500',
  },
  tabButtonTextActive: {
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily.medium,
  },
  budgetsList: {
    flex: 1,
    padding: Theme.spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 95 : 70,
  },
  loadingText: {
    textAlign: 'center',
    color: Theme.colors.textTertiary,
    padding: Theme.spacing.lg,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  emptyState: {
    alignItems: 'center',
    padding: Theme.spacing['2xl'],
  },
  emptyText: {
    fontSize: Theme.typography.fontSize.lg,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  emptySubtext: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textTertiary,
    textAlign: 'center',
    fontFamily: Theme.typography.fontFamily.regular,
  },
  budgetCard: {
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.md,
    ...Theme.cards.card,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  budgetInfo: {
    flex: 1,
  },
  budgetCategory: {
    fontSize: Theme.typography.fontSize.lg,
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.xs,
    fontFamily: Theme.typography.fontFamily.bold,
  },
  budgetPeriod: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textTertiary,
    textTransform: 'capitalize',
    fontFamily: Theme.typography.fontFamily.regular,
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
    marginBottom: Theme.spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.sm,
    marginRight: Theme.spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Theme.borderRadius.sm,
  },
  progressText: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textSecondary,
    minWidth: 45,
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  budgetAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.sm,
  },
  spentAmount: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  budgetAmount: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  remainingAmount: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.success,
    textAlign: 'center',
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  currencyNote: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.textTertiary,
    textAlign: 'center',
    marginTop: Theme.spacing.sm,
    fontFamily: Theme.typography.fontFamily.regular,
    fontStyle: 'italic',
  },
});