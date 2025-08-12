import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Database } from '@/types/database';
import { ExchangeRateService } from './exchangeRateService';

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
      // Filter transactions for the specified month
      const monthlyTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === month && date.getFullYear() === year;
      });

      // Calculate totals
      let totalIncome = 0;
      let totalExpenses = 0;
      const categoryTotals: Record<string, number> = {};

      for (const transaction of monthlyTransactions) {
        const convertedAmount = await ExchangeRateService.convertCurrency(
          Math.abs(transaction.amount),
          transaction.currency,
          'PKR'
        );

        if (transaction.type === 'income') {
          totalIncome += convertedAmount;
        } else {
          totalExpenses += convertedAmount;
          categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + convertedAmount;
        }
      }

      const savings = totalIncome - totalExpenses;
      const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      // Generate HTML content
      const htmlContent = `
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
            ${monthlyTransactions.slice(0, 10).map(t => `
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

      // Save HTML file
      const fileName = `financial-report-${year}-${month + 1}.html`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, htmlContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/html',
          dialogTitle: `Financial Report - ${monthName}`,
        });
      }
    } catch (error) {
      console.error('Failed to generate PDF report:', error);
      throw new Error('Failed to generate report');
    }
  }
}