import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { NotificationService } from '@/services/notificationService';
import { ExchangeRateService } from '@/services/exchangeRateService';

type Budget = Database['public']['Tables']['budgets']['Row'];
type BudgetInsert = Database['public']['Tables']['budgets']['Insert'];

export function useBudgets(userId: string | undefined) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchBudgets();
    }
  }, [userId]);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBudgets(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch budgets');
    } finally {
      setLoading(false);
    }
  };

  const addBudget = async (budget: Omit<BudgetInsert, 'user_id'>) => {
    if (!userId) return { error: 'User not authenticated' };

    try {
      const newBudget: BudgetInsert = {
        ...budget,
        user_id: userId,
      };

      const { data, error } = await supabase
        .from('budgets')
        .insert([newBudget])
        .select()
        .single();

      if (error) throw error;
      
      // Create a welcome notification for the new budget
      try {
        await NotificationService.createNotification(
          userId,
          'budget',
          '🎯 New Budget Created',
          `Your ${budget.category} budget of ${budget.currency} ${budget.amount.toLocaleString()} has been set up successfully!`
        );
      } catch (notificationError) {
        console.error('Failed to create budget notification:', notificationError);
      }
      
      setBudgets(prev => [data, ...prev]);
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add budget';
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setBudgets(prev => 
        prev.map(budget => 
          budget.id === id ? data : budget
        )
      );
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update budget';
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setBudgets(prev => prev.filter(budget => budget.id !== id));
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete budget';
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  // Check budget status and create notifications
  const checkBudgetStatus = useCallback(async () => {
    if (!userId) return;

    try {
      // Get all budgets and their current spending
      const budgetsWithSpending = await Promise.all(
        budgets.map(async (budget) => {
          // Get transactions for this category in the current period
          const now = new Date();
          let startDate = new Date();
          
          switch (budget.period) {
            case 'weekly':
              startDate.setDate(now.getDate() - 7);
              break;
            case 'monthly':
              startDate.setMonth(now.getMonth() - 1);
              break;
            case 'yearly':
              startDate.setFullYear(now.getFullYear() - 1);
              break;
            default:
              startDate.setMonth(now.getMonth() - 1);
          }

          const { data: transactions } = await supabase
            .from('transactions')
            .select('amount, currency')
            .eq('user_id', userId)
            .eq('category', budget.category)
            .eq('type', 'expense')
            .gte('date', startDate.toISOString())
            .lte('date', now.toISOString());

          let totalSpent = 0;
          if (transactions) {
            for (const transaction of transactions) {
              // Convert to budget currency if different
              if (transaction.currency !== budget.currency) {
                try {
                  const convertedAmount = await ExchangeRateService.convertCurrency(
                    Math.abs(transaction.amount),
                    transaction.currency,
                    budget.currency
                  );
                  totalSpent += convertedAmount;
                } catch (error) {
                  // Fallback to original amount
                  totalSpent += Math.abs(transaction.amount);
                }
              } else {
                totalSpent += Math.abs(transaction.amount);
              }
            }
          }

          return {
            ...budget,
            totalSpent,
          };
        })
      );

      // Check each budget and create notifications if needed
      for (const budgetWithSpending of budgetsWithSpending) {
        const percentage = (budgetWithSpending.totalSpent / budgetWithSpending.amount) * 100;
        
        if (percentage >= 80) {
          await NotificationService.createBudgetAlert(
            userId,
            budgetWithSpending.category,
            budgetWithSpending.totalSpent,
            budgetWithSpending.amount,
            budgetWithSpending.currency
          );
        }
      }
    } catch (error) {
      console.error('Error checking budget status:', error);
    }
  }, [budgets, userId]);

  // Check budget status when budgets change
  useEffect(() => {
    if (budgets.length > 0) {
      checkBudgetStatus();
    }
  }, [budgets, checkBudgetStatus]);

  return {
    budgets,
    loading,
    error,
    addBudget,
    updateBudget,
    deleteBudget,
    refetch: fetchBudgets,
    checkBudgetStatus,
  };
}