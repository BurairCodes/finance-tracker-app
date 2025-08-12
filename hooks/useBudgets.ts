import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

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

  return {
    budgets,
    loading,
    error,
    addBudget,
    updateBudget,
    deleteBudget,
    refetch: fetchBudgets,
  };
}