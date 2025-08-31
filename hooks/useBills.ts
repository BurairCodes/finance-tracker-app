import { useState, useEffect, useCallback } from 'react';
import { BillReminderService, Bill } from '@/services/billReminderService';
import { NotificationService } from '@/services/notificationService';
import { useAuth } from './useAuth';

export function useBills(userId?: string) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const currentUserId = userId || user?.id;

  // Fetch bills
  const fetchBills = useCallback(async () => {
    if (!currentUserId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await BillReminderService.getBills(currentUserId);
      
      if (fetchError) {
        setError(fetchError);
        return;
      }

      if (data) {
        setBills(data);
      }
    } catch (err) {
      setError('Failed to fetch bills');
      console.error('Error fetching bills:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Add a new bill
  const addBill = useCallback(async (billData: Omit<Bill, 'id' | 'user_id'>) => {
    if (!currentUserId) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: addError } = await BillReminderService.createBill(currentUserId, billData);
      
      if (addError) {
        setError(addError);
        throw new Error(addError);
      }

      if (data) {
        setBills(prev => [data, ...prev]);
        
        // Create success notification
        await NotificationService.createCustomNotification(
          currentUserId,
          'bill',
          'Bill Created Successfully',
          `Your bill "${billData.name}" has been created and is due on ${billData.due_date}`
        );

        return { data, error: null };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create bill';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Update a bill
  const updateBill = useCallback(async (billId: string, updates: Partial<Bill>) => {
    if (!currentUserId) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await BillReminderService.updateBill(billId, currentUserId, updates);
      
      if (updateError) {
        setError(updateError);
        throw new Error(updateError);
      }

      if (data) {
        setBills(prev => prev.map(bill => bill.id === billId ? data : bill));
        
        // Create update notification
        await NotificationService.createCustomNotification(
          currentUserId,
          'bill',
          'Bill Updated',
          `Your bill "${data.name}" has been updated successfully`
        );

        return { data, error: null };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update bill';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Delete a bill
  const deleteBill = useCallback(async (billId: string) => {
    if (!currentUserId) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await BillReminderService.deleteBill(billId, currentUserId);
      
      if (deleteError) {
        setError(deleteError);
        throw new Error(deleteError);
      }

      // Remove from local state
      setBills(prev => prev.filter(bill => bill.id !== billId));
      
      // Create deletion notification
      await NotificationService.createCustomNotification(
        currentUserId,
        'bill',
        'Bill Deleted',
        'Your bill has been deleted successfully'
      );

      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete bill';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Mark bill as paid
  const markBillAsPaid = useCallback(async (billId: string, paidAmount?: number, paidDate?: string) => {
    if (!currentUserId) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const { error: markError } = await BillReminderService.markBillAsPaid(billId, currentUserId, paidAmount, paidDate);
      
      if (markError) {
        setError(markError);
        throw new Error(markError);
      }

      // Update local state
      setBills(prev => prev.map(bill => 
        bill.id === billId 
          ? { ...bill, paid: true, paid_at: paidDate || new Date().toISOString(), paid_amount: paidAmount }
          : bill
      ));
      
      // Create payment notification
      await NotificationService.createCustomNotification(
        currentUserId,
        'bill',
        'Bill Marked as Paid',
        'Your bill has been marked as paid successfully'
      );

      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark bill as paid';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Get overdue bills
  const getOverdueBills = useCallback(async () => {
    if (!currentUserId) return [];

    try {
      const { data, error: overdueError } = await BillReminderService.getOverdueBills(currentUserId);
      
      if (overdueError) {
        console.error('Error fetching overdue bills:', overdueError);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error fetching overdue bills:', err);
      return [];
    }
  }, [currentUserId]);

  // Check upcoming bills
  const checkUpcomingBills = useCallback(async () => {
    if (!currentUserId) return;

    try {
      await BillReminderService.checkUpcomingBills(currentUserId);
    } catch (err) {
      console.error('Error checking upcoming bills:', err);
    }
  }, [currentUserId]);

  // Schedule bill checks
  const scheduleBillChecks = useCallback(async () => {
    if (!currentUserId) return;

    try {
      await BillReminderService.scheduleBillChecks(currentUserId);
    } catch (err) {
      console.error('Error scheduling bill checks:', err);
    }
  }, [currentUserId]);

  // Initial fetch
  useEffect(() => {
    if (currentUserId) {
      fetchBills();
      scheduleBillChecks();
    }
  }, [currentUserId, fetchBills, scheduleBillChecks]);

  // Check for upcoming bills periodically (reduced frequency)
  useEffect(() => {
    if (!currentUserId) return;

    const interval = setInterval(() => {
      checkUpcomingBills();
    }, 1000 * 60 * 60 * 6); // Check every 6 hours instead of every hour

    return () => clearInterval(interval);
  }, [currentUserId, checkUpcomingBills]);

  return {
    bills,
    loading,
    error,
    addBill,
    updateBill,
    deleteBill,
    markBillAsPaid,
    getOverdueBills,
    checkUpcomingBills,
    refreshBills: fetchBills,
  };
}
