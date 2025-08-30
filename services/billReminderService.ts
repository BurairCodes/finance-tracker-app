import { supabase } from '@/lib/supabase';
import { NotificationService } from './notificationService';

export interface Bill {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  currency: string;
  due_date: string;
  recurring: boolean;
  category: string;
  notes?: string;
}

export class BillReminderService {
  // Create a new bill reminder
  static async createBill(
    userId: string,
    bill: Omit<Bill, 'id' | 'user_id'>
  ): Promise<{ data: Bill | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('bills')
        .insert({
          ...bill,
          user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial notification if due soon
      const dueDate = new Date(bill.due_date);
      const now = new Date();
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilDue <= 3) {
        await NotificationService.createBillReminder(
          userId,
          bill.name,
          bill.amount,
          bill.currency,
          dueDate,
          daysUntilDue
        );
      }

      return { data, error: null };
    } catch (error) {
      console.error('Failed to create bill:', error);
      return { data: null, error: 'Failed to create bill reminder' };
    }
  }

  // Get all bills for a user
  static async getBills(userId: string): Promise<{ data: Bill[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', userId)
        .order('due_date', { ascending: true });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Failed to fetch bills:', error);
      return { data: null, error: 'Failed to fetch bills' };
    }
  }

  // Update a bill
  static async updateBill(
    billId: string,
    userId: string,
    updates: Partial<Bill>
  ): Promise<{ data: Bill | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('bills')
        .update(updates)
        .eq('id', billId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      // Create notification if due date changed and is soon
      if (updates.due_date) {
        const dueDate = new Date(updates.due_date);
        const now = new Date();
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilDue <= 3) {
          await NotificationService.createBillReminder(
            userId,
            data.name,
            data.amount,
            data.currency,
            dueDate,
            daysUntilDue
          );
        }
      }

      return { data, error: null };
    } catch (error) {
      console.error('Failed to update bill:', error);
      return { data: null, error: 'Failed to update bill' };
    }
  }

  // Delete a bill
  static async deleteBill(billId: string, userId: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('bills')
        .delete()
        .eq('id', billId)
        .eq('user_id', userId);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Failed to delete bill:', error);
      return { error: 'Failed to delete bill' };
    }
  }

  // Check for upcoming bills and create reminders
  static async checkUpcomingBills(userId: string): Promise<void> {
    try {
      const now = new Date();
      const threeDaysFromNow = new Date(now);
      threeDaysFromNow.setDate(now.getDate() + 3);

      const { data: upcomingBills, error } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', userId)
        .gte('due_date', now.toISOString())
        .lte('due_date', threeDaysFromNow.toISOString())
        .order('due_date', { ascending: true });

      if (error) throw error;

      if (upcomingBills) {
        for (const bill of upcomingBills) {
          const dueDate = new Date(bill.due_date);
          const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          // Create reminder notification
          await NotificationService.createBillReminder(
            userId,
            bill.name,
            bill.amount,
            bill.currency,
            dueDate,
            daysUntilDue
          );
        }
      }
    } catch (error) {
      console.error('Failed to check upcoming bills:', error);
    }
  }

  // Mark bill as paid
  static async markBillAsPaid(
    billId: string,
    userId: string,
    paidAmount?: number,
    paidDate?: string
  ): Promise<{ error: string | null }> {
    try {
      const updates: any = {
        paid: true,
        paid_at: paidDate || new Date().toISOString(),
      };

      if (paidAmount) {
        updates.paid_amount = paidAmount;
      }

      const { error } = await supabase
        .from('bills')
        .update(updates)
        .eq('id', billId)
        .eq('user_id', userId);

      if (error) throw error;

      // Create a transaction record for the paid bill
      if (paidAmount) {
        await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            amount: -paidAmount, // Negative for expense
            currency: (await supabase
              .from('bills')
              .select('currency')
              .eq('id', billId)
              .single()).data?.currency || 'PKR',
            category: (await supabase
              .from('bills')
              .select('category')
              .eq('id', billId)
              .single()).data?.category || 'Bills',
            type: 'expense',
            description: `Bill payment: ${(await supabase
              .from('bills')
              .select('name')
              .eq('id', billId)
              .single()).data?.name || 'Unknown bill'}`,
            date: paidDate || new Date().toISOString(),
          });
      }

      return { error: null };
    } catch (error) {
      console.error('Failed to mark bill as paid:', error);
      return { error: 'Failed to mark bill as paid' };
    }
  }

  // Get overdue bills
  static async getOverdueBills(userId: string): Promise<{ data: Bill[] | null; error: string | null }> {
    try {
      const now = new Date();

      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', userId)
        .lt('due_date', now.toISOString())
        .eq('paid', false)
        .order('due_date', { ascending: true });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Failed to fetch overdue bills:', error);
      return { data: null, error: 'Failed to fetch overdue bills' };
    }
  }

  // Schedule daily bill checks
  static async scheduleBillChecks(userId: string): Promise<void> {
    try {
      // Schedule daily bill check at 9 AM
      await NotificationService.scheduleRecurringNotification(
        '📅 Daily Bill Check',
        'Checking for upcoming bills...',
        { type: 'bill_check', userId },
        9, // 9 AM
        0
      );

      console.log(`✅ Scheduled bill checks for user ${userId}`);
    } catch (error) {
      console.error('Failed to schedule bill checks:', error);
    }
  }
}
