export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          base_currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          base_currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          base_currency?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          currency: string;
          category: string;
          type: 'income' | 'expense';
          description: string | null;
          date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          currency: string;
          category: string;
          type: 'income' | 'expense';
          description?: string | null;
          date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          currency?: string;
          category?: string;
          type?: 'income' | 'expense';
          description?: string | null;
          date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category: string;
          amount: number;
          currency: string;
          period: 'monthly' | 'weekly' | 'yearly';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category: string;
          amount: number;
          currency: string;
          period?: 'monthly' | 'weekly' | 'yearly';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category?: string;
          amount?: number;
          currency?: string;
          period?: 'monthly' | 'weekly' | 'yearly';
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: 'budget' | 'bill' | 'insight' | 'security';
          title: string;
          message: string;
          is_read: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'budget' | 'bill' | 'insight' | 'security';
          title: string;
          message: string;
          is_read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'budget' | 'bill' | 'insight' | 'security';
          title?: string;
          message?: string;
          is_read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      bills: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          amount: number;
          currency: string;
          due_date: string;
          recurring: boolean;
          category: string | null;
          notes: string | null;
          paid: boolean;
          paid_at: string | null;
          paid_amount: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          amount: number;
          currency?: string;
          due_date: string;
          recurring?: boolean;
          category?: string | null;
          notes?: string | null;
          paid?: boolean;
          paid_at?: string | null;
          paid_amount?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          amount?: number;
          currency?: string;
          due_date?: string;
          recurring?: boolean;
          category?: string | null;
          notes?: string | null;
          paid?: boolean;
          paid_at?: string | null;
          paid_amount?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notification_tracking: {
        Row: {
          id: string;
          user_id: string;
          notification_type: string;
          entity_id: string;
          entity_type: string;
          last_sent_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          notification_type: string;
          entity_id: string;
          entity_type: string;
          last_sent_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          notification_type?: string;
          entity_id?: string;
          entity_type?: string;
          last_sent_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}