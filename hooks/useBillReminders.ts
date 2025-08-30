import { useState, useEffect, useCallback } from 'react';
import { BillReminderService, Bill } from '@/services/billReminderService';
import { useAuth } from './useAuth';

export const useBillReminders = () => {
  const { user } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch bills
  const fetchBills = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await BillReminderService.getBills(user.id);
      
      if (fetchError) {
        setError(fetchError);
        return;
      }

      setBills(data || []);
    } catch (err) {
      setError('Failed to fetch bills');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Create new bill
  const createBill = useCallback(async (billData: Omit<Bill, 'id' | 'user_id'>) => {
    if (!user?.id) return { error: 'User not authenticated' };

    try {
      const { data, error } = await BillReminderService.createBill(user.id, billData);
      
      if (error) {
        setError(error);
        return { error };
      }

      if (data) {
        setBills(prev => [data, ...prev]);
      }

      return { data, error: null };
    } catch (err) {
      const errorMessage = 'Failed to create bill';
      setError(errorMessage);
      return { error: errorMessage };
    }
  }, [user?.id]);

  // Update bill
  const updateBill = useCallback(async (billId: string, updates: Partial<Bill>) => {
    if (!user?.id) return { error: 'User not authenticated' };

    try {
      const { data, error } = await BillReminderService.updateBill(billId, user.id, updates);
      
      if (error) {
        setError(error);
        return { error };
      }

      if (data) {
        setBills(prev => prev.map(bill => bill.id === billId ? data : bill));
      }

      return { data, error: null };
    } catch (err) {
      const errorMessage = 'Failed to update bill';
      setError(errorMessage);
      return { error: errorMessage };
    }
  }, [user?.id]);

  // Delete bill
  const deleteBill = useCallback(async (billId: string) => {
    if (!user?.id) return { error: 'User not authenticated' };

    try {
      const { error } = await BillReminderService.deleteBill(billId, user.id);
      
      if (error) {
        setError(error);
        return { error };
      }

      setBills(prev => prev.filter(bill => bill.id !== billId));
      return { error: null };
    } catch (err) {
      const errorMessage = 'Failed to delete bill';
      setError(errorMessage);
      return { error: errorMessage };
    }
  }, [user?.id]);

  // Mark bill as paid
  const markBillAsPaid = useCallback(async (billId: string) => {
    if (!user?.id) return { error: 'User not authenticated' };

    try {
      const { data, error } = await BillReminderService.markBillAsPaid(billId, user.id);
      
      if (error) {
        setError(error);
        return { error };
      }

      if (data) {
        setBills(prev => prev.map(bill => bill.id === billId ? data : bill));
      }

      return { data, error: null };
    } catch (err) {
      const errorMessage = 'Failed to mark bill as paid';
      setError(errorMessage);
      return { error: errorMessage };
    }
  }, [user?.id]);

  // Check for upcoming bills and create notifications
  const checkUpcomingBills = useCallback(async () => {
    if (!user?.id) return;

    try {
      await BillReminderService.checkUpcomingBills(user.id);
    } catch (error) {
      console.error('Failed to check upcoming bills:', error);
    }
  }, [user?.id]);

  // Get overdue bills
  const getOverdueBills = useCallback(async () => {
    if (!user?.id) return [];

    try {
      const overdueBills = await BillReminderService.getOverdueBills(user.id);
      return overdueBills || [];
    } catch (error) {
      console.error('Failed to get overdue bills:', error);
      return [];
    }
  }, [user?.id]);

  // Initial fetch and periodic checks
  useEffect(() => {
    if (user?.id) {
      fetchBills();
      checkUpcomingBills();
      
      // Check for upcoming bills every hour
      const interval = setInterval(checkUpcomingBills, 60 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [user?.id, fetchBills, checkUpcomingBills]);

  return {
    bills,
    loading,
    error,
    createBill,
    updateBill,
    deleteBill,
    markBillAsPaid,
    checkUpcomingBills,
    getOverdueBills,
    refetch: fetchBills,
  };
};
