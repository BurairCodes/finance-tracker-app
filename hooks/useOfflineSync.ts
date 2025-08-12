import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '@/lib/supabase';

interface OfflineTransaction {
  id: string;
  data: any;
  timestamp: number;
  action: 'create' | 'update' | 'delete';
}

export function useOfflineSync(userId: string | undefined) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSync, setPendingSync] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
      
      if (state.isConnected && userId) {
        syncPendingTransactions();
      }
    });

    return unsubscribe;
  }, [userId]);

  const storeOfflineTransaction = async (transaction: OfflineTransaction) => {
    try {
      const existing = await AsyncStorage.getItem('offline_transactions');
      const transactions = existing ? JSON.parse(existing) : [];
      transactions.push(transaction);
      await AsyncStorage.setItem('offline_transactions', JSON.stringify(transactions));
    } catch (error) {
      console.error('Failed to store offline transaction:', error);
    }
  };

  const syncPendingTransactions = async () => {
    if (!userId || pendingSync) return;

    try {
      setPendingSync(true);
      const stored = await AsyncStorage.getItem('offline_transactions');
      if (!stored) return;

      const transactions: OfflineTransaction[] = JSON.parse(stored);
      const synced: string[] = [];

      for (const transaction of transactions) {
        try {
          if (transaction.action === 'create') {
            await supabase.from('transactions').insert([transaction.data]);
          } else if (transaction.action === 'update') {
            await supabase.from('transactions').update(transaction.data).eq('id', transaction.data.id);
          } else if (transaction.action === 'delete') {
            await supabase.from('transactions').delete().eq('id', transaction.data.id);
          }
          synced.push(transaction.id);
        } catch (error) {
          console.error('Failed to sync transaction:', error);
        }
      }

      // Remove synced transactions
      const remaining = transactions.filter(t => !synced.includes(t.id));
      await AsyncStorage.setItem('offline_transactions', JSON.stringify(remaining));
    } catch (error) {
      console.error('Failed to sync offline transactions:', error);
    } finally {
      setPendingSync(false);
    }
  };

  return {
    isOnline,
    pendingSync,
    storeOfflineTransaction,
    syncPendingTransactions,
  };
}