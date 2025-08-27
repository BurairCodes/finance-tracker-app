import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Database } from '@/types/database';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type Budget = Database['public']['Tables']['budgets']['Row'];

export class ExportService {
  /**
   * Export transactions to CSV format
   */
  static async exportTransactionsToCSV(transactions: Transaction[]): Promise<void> {
    try {
      // Create CSV header
      const csvHeader = 'Date,Type,Category,Amount,Currency,Description\n';
      
      // Create CSV rows
      const csvRows = transactions.map(transaction => {
        const date = new Date(transaction.date).toLocaleDateString();
        const type = transaction.type;
        const category = transaction.category;
        const amount = Math.abs(transaction.amount);
        const currency = transaction.currency;
        const description = transaction.description || '';
        
        return `${date},${type},${category},${amount},${currency},"${description}"`;
      }).join('\n');
      
      const csvContent = csvHeader + csvRows;
      
      // Create file
      const fileName = `finance_transactions_${new Date().toISOString().split('T')[0]}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, csvContent);
      
      // Share file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Transactions',
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error('Failed to export transactions');
    }
  }

  /**
   * Export budgets to CSV format
   */
  static async exportBudgetsToCSV(budgets: Budget[]): Promise<void> {
    try {
      const csvHeader = 'Category,Amount,Currency,Period\n';
      
      const csvRows = budgets.map(budget => {
        const category = budget.category;
        const amount = budget.amount;
        const currency = budget.currency;
        const period = budget.period;
        
        return `${category},${amount},${currency},${period}`;
      }).join('\n');
      
      const csvContent = csvHeader + csvRows;
      
      const fileName = `finance_budgets_${new Date().toISOString().split('T')[0]}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, csvContent);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Budgets',
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error('Failed to export budgets');
    }
  }

  /**
   * Export financial summary as PDF (placeholder for future implementation)
   */
  static async exportFinancialSummary(transactions: Transaction[], budgets: Budget[]): Promise<void> {
    // This would use a PDF generation library like react-native-html-to-pdf
    // For now, we'll export as CSV
    await this.exportTransactionsToCSV(transactions);
  }

  /**
   * Generate monthly report
   */
  static generateMonthlyReport(transactions: Transaction[]): {
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    topCategories: Array<{ category: string; amount: number }>;
  } {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryTotals: Record<string, number> = {};

    monthlyTransactions.forEach(transaction => {
      const amount = Math.abs(transaction.amount);
      
      if (transaction.type === 'income') {
        totalIncome += amount;
      } else {
        totalExpenses += amount;
        categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + amount;
      }
    });

    const topCategories = Object.entries(categoryTotals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      totalIncome,
      totalExpenses,
      netSavings: totalIncome - totalExpenses,
      topCategories,
    };
  }
}
