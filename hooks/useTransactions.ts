import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { AIService } from '@/services/aiService';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];

export function useTransactions(userId: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchTransactions();
    }
  }, [userId]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      // Check if Supabase is properly configured
      if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error('Supabase not configured. Please check your environment variables.');
      }
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      setTransactions(data || []);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transactions';
      console.error('Transaction fetch error:', errorMessage);
      setError(errorMessage);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transaction: Omit<TransactionInsert, 'user_id'>) => {
    if (!userId) return { error: 'User not authenticated' };

    try {
      // Validate required fields
      if (!transaction.amount || !transaction.category || !transaction.type) {
        throw new Error('Missing required transaction fields');
      }

      // AI categorization
      let prediction;
      try {
        prediction = AIService.categorizeTransaction(
          transaction.description || '',
          transaction.amount
        );
      } catch (aiError) {
        console.warn('AI categorization failed, using provided category:', aiError);
        prediction = { category: transaction.category, confidence: 0.5 };
      }

      const newTransaction: TransactionInsert = {
        ...transaction,
        user_id: userId,
        category: transaction.category || prediction.category,
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert([newTransaction])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      
      setTransactions(prev => [data, ...prev]);
      setError(null);
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add transaction';
      console.error('Add transaction error:', errorMessage);
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setTransactions(prev => 
        prev.map(transaction => 
          transaction.id === id ? data : transaction
        )
      );
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update transaction';
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTransactions(prev => prev.filter(transaction => transaction.id !== id));
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete transaction';
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  return {
    transactions,
    loading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: fetchTransactions,
  };
}