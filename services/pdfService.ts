import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { Database } from '@/types/database';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type Budget = Database['public']['Tables']['budgets']['Row'];

export class PDFService {
  static async generateMonthlyReport(
    transactions: Transaction[],
    budgets: Budget[],
    month: number,
    year: number,
    userEmail: string
  ): Promise<void> {
    try {
      console.log('Starting report generation...');
      
      // Basic validation
      if (!transactions || transactions.length === 0) {
        throw new Error('No transactions found for the selected month');
      }

      if (!userEmail) {
        throw new Error('User email is required');
      }

      // Filter transactions for the specified month
      const monthlyTransactions = transactions.filter(t => {
        try {
          const date = new Date(t.date);
          return date.getMonth() === month && date.getFullYear() === year;
        } catch (error) {
          console.warn('Invalid transaction date:', t.date);
          return false;
        }
      });

      if (monthlyTransactions.length === 0) {
        throw new Error(`No transactions found for ${new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`);
      }

      console.log(`Processing ${monthlyTransactions.length} transactions...`);

      // Calculate totals
      let totalIncome = 0;
      let totalExpenses = 0;
      const categoryTotals: Record<string, number> = {};

      for (const transaction of monthlyTransactions) {
        const amount = Math.abs(transaction.amount);
        
        if (transaction.type === 'income') {
          totalIncome += amount;
        } else {
          totalExpenses += amount;
          categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + amount;
        }
      }

      const savings = totalIncome - totalExpenses;
      const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      // Generate simple HTML content
      const htmlContent = this.generateSimpleHTML({
        totalIncome,
        totalExpenses,
        savings,
        categoryTotals,
        transactions: monthlyTransactions,
        monthName,
        userEmail
      });

      // Save and share
      await this.saveAndShare(htmlContent, monthName);
      
      console.log('Report generated successfully');
    } catch (error) {
      console.error('Failed to generate report:', error);
      throw new Error(`Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static generateSimpleHTML(data: {
    totalIncome: number;
    totalExpenses: number;
    savings: number;
    categoryTotals: Record<string, number>;
    transactions: Transaction[];
    monthName: string;
    userEmail: string;
  }): string {
    const { totalIncome, totalExpenses, savings, categoryTotals, transactions, monthName, userEmail } = data;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Financial Report - ${monthName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
          .header { text-align: center; margin-bottom: 40px; }
          .title { color: #2563EB; font-size: 28px; margin-bottom: 10px; }
          .subtitle { color: #6B7280; font-size: 16px; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1F2937; }
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
          .summary-card { background: #F9FAFB; padding: 20px; border-radius: 8px; text-align: center; }
          .summary-label { font-size: 14px; color: #6B7280; margin-bottom: 5px; }
          .summary-amount { font-size: 24px; font-weight: bold; }
          .income { color: #059669; }
          .expense { color: #DC2626; }
          .savings { color: #2563EB; }
          .category-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #E5E7EB; }
          .transaction-item { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
          .footer { margin-top: 40px; text-align: center; color: #9CA3AF; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">Smart Finance Manager</h1>
          <p class="subtitle">Monthly Financial Report - ${monthName}</p>
          <p class="subtitle">Generated for: ${userEmail}</p>
        </div>

        <div class="section">
          <div class="summary-grid">
            <div class="summary-card">
              <div class="summary-label">Total Income</div>
              <div class="summary-amount income">₨${totalIncome.toFixed(2)}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Total Expenses</div>
              <div class="summary-amount expense">₨${totalExpenses.toFixed(2)}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Net Savings</div>
              <div class="summary-amount savings">₨${savings.toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Expenses by Category</h2>
          ${Object.entries(categoryTotals)
            .sort(([,a], [,b]) => b - a)
            .map(([category, amount]) => `
              <div class="category-item">
                <span>${category}</span>
                <span>₨${amount.toFixed(2)}</span>
              </div>
            `).join('')}
        </div>

        <div class="section">
          <h2 class="section-title">Recent Transactions</h2>
          ${transactions.slice(0, 10).map(t => `
            <div class="transaction-item">
              <span>${t.category} - ${t.description || 'No description'}</span>
              <span class="${t.type}">${t.type === 'income' ? '+' : '-'}₨${Math.abs(t.amount).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>

        <div class="footer">
          <p>Generated on ${new Date().toLocaleDateString()}</p>
          <p>Smart Finance Manager - AI-Powered Personal Finance</p>
        </div>
      </body>
      </html>
    `;
  }

  private static async saveAndShare(content: string, monthName: string): Promise<void> {
    try {
      // Create filename
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `financial-report-${monthName.replace(/\s+/g, '-')}-${timestamp}.html`;
      
      console.log('Creating file:', fileName);

      // For web platform, trigger download directly
      if (Platform.OS === 'web') {
        this.downloadFile(content, fileName);
        return;
      }

      // For mobile platforms, save and share
      const directory = FileSystem.documentDirectory;
      if (!directory) {
        throw new Error('Unable to access file system directory');
      }

      const fileUri = directory + fileName;
      console.log('Saving to:', fileUri);

      // Write file
      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      console.log('File saved successfully');

      // Try to share
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/html',
          dialogTitle: `Financial Report - ${monthName}`,
        });
        console.log('File shared successfully');
      } else {
        throw new Error('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error in saveAndShare:', error);
      throw error;
    }
  }

  private static downloadFile(content: string, fileName: string): void {
    try {
      const blob = new Blob([content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error('Failed to download file');
    }
  }
}
