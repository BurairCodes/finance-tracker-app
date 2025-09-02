import { supabase } from '@/lib/supabase';
import { ExchangeRateService } from './exchangeRateService';
import { NotificationService } from './notificationService';

export class InsightService {
  // Generate weekly financial insights for a user
  static async generateWeeklyInsights(userId: string): Promise<void> {
    try {
      // Get date range for this week
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 7);

      // Get all transactions for the week
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startOfWeek.toISOString())
        .lte('date', now.toISOString());

      if (error) throw error;

      if (!transactions || transactions.length === 0) {
        return; // No transactions to analyze
      }

      // Calculate totals
      let totalIncome = 0;
      let totalExpense = 0;
      const categorySpending: Record<string, number> = {};
      const userCurrency = transactions[0]?.currency || 'PKR';

      for (const transaction of transactions) {
        const amount = Math.abs(transaction.amount);
        
        if (transaction.type === 'income') {
          totalIncome += amount;
        } else {
          totalExpense += amount;
          
          // Track category spending
          if (!categorySpending[transaction.category]) {
            categorySpending[transaction.category] = 0;
          }
          categorySpending[transaction.category] += amount;
        }
      }

      // Find top spending category
      const topCategory = Object.entries(categorySpending)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || '';

      // Calculate savings rate
      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

      // Create weekly insight notification
      await NotificationService.createWeeklyInsight(
        userId,
        totalExpense,
        totalIncome,
        userCurrency,
        topCategory,
        savingsRate
      );

      console.log(`✅ Generated weekly insights for user ${userId}`);
    } catch (error) {
      console.error('Failed to generate weekly insights:', error);
    }
  }

  // Generate monthly insights
  static async generateMonthlyInsights(userId: string): Promise<void> {
    try {
      // Get date range for this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

      // Get all transactions for the month
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startOfMonth.toISOString())
        .lte('date', now.toISOString());

      if (error) throw error;

      if (!transactions || transactions.length === 0) {
        return;
      }

      // Calculate totals
      let totalIncome = 0;
      let totalExpense = 0;
      const categorySpending: Record<string, number> = {};
      const userCurrency = transactions[0]?.currency || 'PKR';

      for (const transaction of transactions) {
        const amount = Math.abs(transaction.amount);
        
        if (transaction.type === 'income') {
          totalIncome += amount;
        } else {
          totalExpense += amount;
          
          if (!categorySpending[transaction.category]) {
            categorySpending[transaction.category] = 0;
          }
          categorySpending[transaction.category] += amount;
        }
      }

      // Find top 3 spending categories
      const topCategories = Object.entries(categorySpending)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([category, amount]) => ({ category, amount }));

      // Calculate savings rate
      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

      // Create monthly insight with more detailed analysis
      const title = '📊 Monthly Financial Summary';
      let message = `This month you spent ${ExchangeRateService.formatCurrency(totalExpense, userCurrency)}`;
      
      if (totalIncome > 0) {
        message += ` and earned ${ExchangeRateService.formatCurrency(totalIncome, userCurrency)}`;
        message += `\nNet: ${ExchangeRateService.formatCurrency(totalIncome - totalExpense, userCurrency)}`;
      }
      
      if (topCategories.length > 0) {
        message += `\nTop spending categories:`;
        topCategories.forEach(({ category, amount }) => {
          message += `\n• ${category}: ${ExchangeRateService.formatCurrency(amount, userCurrency)}`;
        });
      }
      
      if (savingsRate > 0) {
        message += `\nSavings rate: ${savingsRate.toFixed(1)}%`;
      }

      await NotificationService.createNotification(
        userId,
        'insight',
        title,
        message
      );

      console.log(`✅ Generated monthly insights for user ${userId}`);
    } catch (error) {
      console.error('Failed to generate monthly insights:', error);
    }
  }

  // Generate spending pattern insights
  static async generateSpendingPatternInsights(userId: string): Promise<void> {
    try {
      // Get transactions from last 30 days
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', thirtyDaysAgo.toISOString())
        .lte('date', now.toISOString());

      if (error) throw error;

      if (!transactions || transactions.length === 0) {
        return;
      }

      // Analyze spending patterns
      const dailySpending: Record<string, number> = {};
      const categoryTrends: Record<string, number[]> = {};

      for (const transaction of transactions) {
        if (transaction.type === 'expense') {
          const date = transaction.date.split('T')[0];
          const amount = Math.abs(transaction.amount);
          
          // Daily spending
          if (!dailySpending[date]) {
            dailySpending[date] = 0;
          }
          dailySpending[date] += amount;

          // Category trends
          if (!categoryTrends[transaction.category]) {
            categoryTrends[transaction.category] = [];
          }
          categoryTrends[transaction.category].push(amount);
        }
      }

      // Find days with highest spending
      const highestSpendingDays = Object.entries(dailySpending)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

      // Find categories with increasing spending
      const increasingCategories = Object.entries(categoryTrends)
        .filter(([, amounts]) => amounts.length >= 3)
        .map(([category, amounts]) => {
          const recent = amounts.slice(-3);
          const earlier = amounts.slice(-6, -3);
          const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
          const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
          return { category, increase: recentAvg - earlierAvg };
        })
        .filter(({ increase }) => increase > 0)
        .sort((a, b) => b.increase - a.increase)
        .slice(0, 2);

      // Create insights notification if there are interesting patterns
      if (highestSpendingDays.length > 0 || increasingCategories.length > 0) {
        const title = '🔍 Spending Pattern Insights';
        let message = '';

        if (highestSpendingDays.length > 0) {
          message += 'Highest spending days:\n';
          highestSpendingDays.forEach(([date, amount]) => {
            message += `• ${date}: ${amount.toLocaleString()}\n`;
          });
        }

        if (increasingCategories.length > 0) {
          message += '\nCategories with increasing spending:\n';
          increasingCategories.forEach(({ category, increase }) => {
            message += `• ${category}: +${increase.toFixed(2)} average\n`;
          });
        }

        await NotificationService.createNotification(
          userId,
          'insight',
          title,
          message.trim()
        );
      }
    } catch (error) {
      console.error('Failed to generate spending pattern insights:', error);
    }
  }

  // Schedule recurring insights generation
  static async scheduleInsightsGeneration(userId: string): Promise<void> {
    try {
      // Schedule weekly insights for every Monday at 9 AM
      await NotificationService.scheduleRecurringNotification(
        '📊 Weekly Financial Summary',
        'Your weekly financial insights are ready!',
        { type: 'weekly_insight', userId },
        9, // 9 AM
        0
      );

      // Schedule monthly insights for the 1st of each month at 9 AM
      // Note: This is a simplified approach. In production, you might want to use a cron job or more sophisticated scheduling
      await NotificationService.scheduleRecurringNotification(
        '📊 Monthly Financial Summary',
        'Your monthly financial insights are ready!',
        { type: 'monthly_insight', userId },
        9, // 9 AM
        0
      );

      console.log(`✅ Scheduled insights generation for user ${userId}`);
    } catch (error) {
      console.error('Failed to schedule insights generation:', error);
    }
  }
}
