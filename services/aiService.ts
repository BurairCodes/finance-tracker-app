interface CategoryPrediction {
  category: string;
  confidence: number;
}

interface ReceiptData {
  amount: number;
  date: string;
  merchant: string;
  category: string;
  items?: string[];
  confidence: number;
}

export class AIService {
  private static readonly FOOD_KEYWORDS = ['restaurant', 'cafe', 'grocery', 'food', 'dining', 'lunch', 'dinner', 'breakfast', 'pizza', 'burger', 'kfc', 'mcdonalds', 'dominos', 'subway', 'biryani', 'karahi', 'daal', 'roti', 'naan', 'chai', 'lassi', 'haleem', 'nihari', 'kebab', 'tikka', 'samosa', 'pakora', 'chaat', 'kulfi', 'falooda', 'meal', 'snack', 'coffee', 'tea', 'juice', 'drink', 'eat', 'hungry', 'thirsty'];
  private static readonly TRANSPORT_KEYWORDS = ['gas', 'fuel', 'uber', 'taxi', 'bus', 'train', 'parking', 'petrol', 'careem', 'rickshaw', 'metro', 'cng', 'diesel', 'toll', 'qingqi', 'chingchi', 'suzuki', 'corolla', 'civic', 'mehran', 'cultus', 'alto', 'transport', 'travel', 'commute', 'ride', 'drive', 'car', 'bike', 'motorcycle'];
  private static readonly SHOPPING_KEYWORDS = ['store', 'shop', 'amazon', 'purchase', 'buy', 'mall', 'daraz', 'market', 'bazaar', 'clothes', 'shoes', 'khaadi', 'gul ahmed', 'alkaram', 'sapphire', 'ideas', 'centaurus', 'emporium', 'liberty', 'anarkali', 'shopping', 'retail', 'outlet', 'brand', 'fashion', 'accessories'];
  private static readonly ENTERTAINMENT_KEYWORDS = ['movie', 'cinema', 'game', 'music', 'concert', 'netflix', 'youtube', 'spotify', 'gaming', 'coke studio', 'lollywood', 'bollywood', 'drama', 'ptv', 'ary', 'geo', 'hum tv', 'entertainment', 'fun', 'leisure', 'hobby', 'recreation', 'party', 'celebration'];
  private static readonly BILLS_KEYWORDS = ['electric', 'water', 'internet', 'phone', 'rent', 'mortgage', 'insurance', 'electricity', 'gas bill', 'wifi', 'wapda', 'kesc', 'ssgc', 'sngpl', 'ptcl', 'jazz', 'telenor', 'ufone', 'zong', 'nayatel', 'stormfiber', 'bill', 'utility', 'service', 'subscription', 'payment', 'due'];
  private static readonly HEALTHCARE_KEYWORDS = ['doctor', 'hospital', 'medicine', 'pharmacy', 'clinic', 'medical', 'health', 'agha khan', 'shaukat khanum', 'liaquat', 'jinnah', 'civil hospital', 'pims', 'services hospital', 'healthcare', 'treatment', 'medicine', 'drug', 'therapy', 'checkup', 'appointment'];
  private static readonly EDUCATION_KEYWORDS = ['school', 'college', 'university', 'tuition', 'books', 'fees', 'education', 'lums', 'iba', 'nust', 'fast', 'comsats', 'uet', 'punjab university', 'karachi university', 'course', 'training', 'learning', 'study', 'academic'];

  static categorizeTransaction(description: string, amount: number): CategoryPrediction {
    const desc = description.toLowerCase();
    
    // Income detection
    if (amount >= 0) {
      if (desc.includes('salary') || desc.includes('payroll') || desc.includes('wage')) {
        return { category: 'Salary', confidence: 0.9 };
      }
      if (desc.includes('freelance') || desc.includes('contract')) {
        return { category: 'Freelance', confidence: 0.8 };
      }
      if (desc.includes('bonus') || desc.includes('commission')) {
        return { category: 'Bonus', confidence: 0.8 };
      }
      if (desc.includes('business') || desc.includes('profit') || desc.includes('sale')) {
        return { category: 'Business', confidence: 0.8 };
      }
      if (desc.includes('investment') || desc.includes('dividend') || desc.includes('return')) {
        return { category: 'Investment', confidence: 0.8 };
      }
      return { category: 'Other', confidence: 0.6 };
    }

    // Expense categorization
    if (this.containsKeywords(desc, this.FOOD_KEYWORDS)) {
      return { category: 'Food & Dining', confidence: 0.85 };
    }
    if (this.containsKeywords(desc, this.TRANSPORT_KEYWORDS)) {
      return { category: 'Transportation', confidence: 0.8 };
    }
    if (this.containsKeywords(desc, this.SHOPPING_KEYWORDS)) {
      return { category: 'Shopping', confidence: 0.75 };
    }
    if (this.containsKeywords(desc, this.ENTERTAINMENT_KEYWORDS)) {
      return { category: 'Entertainment', confidence: 0.8 };
    }
    if (this.containsKeywords(desc, this.BILLS_KEYWORDS)) {
      return { category: 'Bills & Utilities', confidence: 0.9 };
    }
    if (this.containsKeywords(desc, this.HEALTHCARE_KEYWORDS)) {
      return { category: 'Healthcare', confidence: 0.85 };
    }
    if (this.containsKeywords(desc, this.EDUCATION_KEYWORDS)) {
      return { category: 'Education', confidence: 0.85 };
    }

    return { category: 'Other', confidence: 0.5 };
  }

  private static containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  static detectAnomaly(amount: number, recentTransactions: number[]): boolean {
    if (recentTransactions.length < 5) return false;

    const mean = recentTransactions.reduce((sum, val) => sum + val, 0) / recentTransactions.length;
    const variance = recentTransactions.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recentTransactions.length;
    const stdDev = Math.sqrt(variance);

    // Flag as anomaly if transaction is more than 2 standard deviations from mean
    return Math.abs(amount - mean) > (2 * stdDev);
  }

  static forecastMonthlyExpenses(historicalData: number[]): number {
    if (historicalData.length === 0) return 0;
    
    // Simple moving average for the last 3 months
    const recentMonths = historicalData.slice(-3);
    const average = recentMonths.reduce((sum, val) => sum + val, 0) / recentMonths.length;
    
    // Add slight growth trend (2% increase)
    return average * 1.02;
  }

  static async getFinancialAdvice(
    question: string,
    transactions: any[],
    budgets: any[],
    userEmail: string
  ): Promise<string> {
    try {
      // Analyze user's financial data
      const analysis = this.analyzeFinancialData(transactions, budgets);
      
      // Generate personalized advice based on the question and analysis
      const advice = this.generatePersonalizedAdvice(question, analysis);
      
      return advice;
    } catch (error) {
      console.error('Error generating financial advice:', error);
      return "I'm sorry, I'm having trouble analyzing your financial data right now. Please try again later.";
    }
  }

  private static analyzeFinancialData(transactions: any[], budgets: any[]): any {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const expenses = monthlyTransactions.filter(t => t.type === 'expense');
    const income = monthlyTransactions.filter(t => t.type === 'income');

    const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalIncome = income.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const savings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

    // Category analysis
    const categorySpending: { [key: string]: number } = {};
    expenses.forEach(t => {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + Math.abs(t.amount);
    });

    const topSpendingCategory = Object.entries(categorySpending)
      .sort(([,a], [,b]) => b - a)[0];

    // Budget analysis
    const budgetUtilization = budgets.map(budget => {
      const spent = categorySpending[budget.category] || 0;
      return {
        category: budget.category,
        budget: budget.amount,
        spent,
        utilization: (spent / budget.amount) * 100
      };
    });

    return {
      totalExpenses,
      totalIncome,
      savings,
      savingsRate,
      categorySpending,
      topSpendingCategory,
      budgetUtilization,
      transactionCount: monthlyTransactions.length
    };
  }

  static async analyzeReceiptImage(imageBase64: string): Promise<ReceiptData> {
    try {
      // Simulate OCR processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For now, we'll provide more realistic mock data
      // In a real implementation, this would use actual OCR services like:
      // - Google Cloud Vision API
      // - AWS Textract
      // - Azure Computer Vision
      // - Tesseract.js for client-side OCR
      
      // Generate more realistic receipt data based on common patterns
      const mockReceipts = [
        {
          amount: 24.50,
          merchant: 'Starbucks Coffee',
          category: 'Food & Dining',
          date: new Date().toISOString().split('T')[0],
          items: ['Caramel Macchiato', 'Blueberry Muffin', 'Service Charge'],
          confidence: 0.92
        },
        {
          amount: 67.89,
          merchant: 'Walmart Supercenter',
          category: 'Shopping',
          date: new Date().toISOString().split('T')[0],
          items: ['Groceries', 'Household Items', 'Personal Care'],
          confidence: 0.88
        },
        {
          amount: 45.00,
          merchant: 'Shell Gas Station',
          category: 'Transportation',
          date: new Date().toISOString().split('T')[0],
          items: ['Fuel', 'Car Wash', 'Snacks'],
          confidence: 0.95
        },
        {
          amount: 89.99,
          merchant: 'Target',
          category: 'Shopping',
          date: new Date().toISOString().split('T')[0],
          items: ['Clothing', 'Home Goods', 'Electronics'],
          confidence: 0.87
        },
        {
          amount: 32.75,
          merchant: 'McDonald\'s',
          category: 'Food & Dining',
          date: new Date().toISOString().split('T')[0],
          items: ['Big Mac Meal', 'French Fries', 'Soft Drink'],
          confidence: 0.91
        },
        {
          amount: 156.23,
          merchant: 'CVS Pharmacy',
          category: 'Healthcare',
          date: new Date().toISOString().split('T')[0],
          items: ['Prescription', 'Over-the-counter', 'Personal Care'],
          confidence: 0.89
        },
        {
          amount: 78.45,
          merchant: 'Pizza Hut',
          category: 'Food & Dining',
          date: new Date().toISOString().split('T')[0],
          items: ['Large Pizza', 'Garlic Bread', 'Delivery Fee'],
          confidence: 0.93
        },
        {
          amount: 123.67,
          merchant: 'Home Depot',
          category: 'Home & Garden',
          date: new Date().toISOString().split('T')[0],
          items: ['Hardware', 'Tools', 'Garden Supplies'],
          confidence: 0.86
        }
      ];
      
      // Randomly select a mock receipt for demonstration
      const selectedReceipt = mockReceipts[Math.floor(Math.random() * mockReceipts.length)];
      
      return {
        amount: selectedReceipt.amount,
        date: selectedReceipt.date,
        merchant: selectedReceipt.merchant,
        category: selectedReceipt.category,
        items: selectedReceipt.items,
        confidence: selectedReceipt.confidence,
      };
    } catch (error) {
      console.error('Error analyzing receipt image:', error);
      throw new Error('Failed to analyze receipt image');
    }
  }

  private static categorizeMerchant(merchant: string): string {
    const merchantLower = merchant.toLowerCase();
    
    if (merchantLower.includes('restaurant') || merchantLower.includes('food') || 
        merchantLower.includes('coffee') || merchantLower.includes('fast food')) {
      return 'Food & Dining';
    }
    if (merchantLower.includes('walmart') || merchantLower.includes('target') || 
        merchantLower.includes('amazon') || merchantLower.includes('store') || 
        merchantLower.includes('shop')) {
      return 'Shopping';
    }
    if (merchantLower.includes('gas') || merchantLower.includes('fuel') || 
        merchantLower.includes('transport')) {
      return 'Transportation';
    }
    if (merchantLower.includes('pharmacy') || merchantLower.includes('health')) {
      return 'Healthcare';
    }
    
    return 'Other';
  }

  private static generateMockItems(merchant: string): string[] {
    const merchantLower = merchant.toLowerCase();
    
    if (merchantLower.includes('restaurant') || merchantLower.includes('food')) {
      return ['Main Course', 'Beverage', 'Dessert', 'Service Charge'];
    }
    if (merchantLower.includes('grocery')) {
      return ['Groceries', 'Fresh Produce', 'Dairy Products', 'Household Items'];
    }
    if (merchantLower.includes('gas') || merchantLower.includes('fuel')) {
      return ['Fuel', 'Car Wash', 'Snacks'];
    }
    if (merchantLower.includes('pharmacy')) {
      return ['Medication', 'Health Products', 'Personal Care'];
    }
    
    return ['Item 1', 'Item 2', 'Item 3'];
  }

  private static generatePersonalizedAdvice(question: string, analysis: any): string {
    const questionLower = question.toLowerCase();
    
    // Savings advice
    if (questionLower.includes('save') || questionLower.includes('saving')) {
      if (analysis.savingsRate < 10) {
        return `I notice your savings rate is only ${Math.round(analysis.savingsRate)}%. Here are some tips to increase your savings:\n\n1. **Track your spending** - You're already doing this great!\n2. **Set up automatic transfers** - Move 20% of your income to savings first\n3. **Cut back on ${analysis.topSpendingCategory?.[0] || 'your biggest expense category'}** - This is your highest spending area\n4. **Use the 50/30/20 rule**: 50% needs, 30% wants, 20% savings\n\nWould you like me to help you create a specific savings plan?`;
      } else {
        return `Great job! Your savings rate of ${Math.round(analysis.savingsRate)}% is excellent. To optimize further:\n\n1. **Consider investing** - Look into index funds or mutual funds\n2. **Emergency fund** - Aim for 3-6 months of expenses\n3. **Retirement planning** - Start early for compound growth\n4. **Diversify** - Don't put all savings in one place\n\nKeep up the great work!`;
      }
    }

    // Budget advice
    if (questionLower.includes('budget') || questionLower.includes('spending')) {
      const overBudget = analysis.budgetUtilization.find(b => b.utilization > 100);
      if (overBudget) {
        return `I see you've exceeded your ${overBudget.category} budget by ${Math.round(overBudget.utilization - 100)}%. Here's how to get back on track:\n\n1. **Immediate action**: Cut non-essential spending in ${overBudget.category}\n2. **Review your budget**: Consider if the budget is realistic\n3. **Find alternatives**: Look for cheaper options\n4. **Track daily**: Monitor spending more closely\n\nWould you like help adjusting your budget for this category?`;
      } else {
        return `Your budget management looks good! You're staying within your limits. To optimize further:\n\n1. **Review your top spending category**: ${analysis.topSpendingCategory?.[0] || 'Unknown'}\n2. **Set specific goals**: What are you saving for?\n3. **Automate savings**: Make it automatic\n4. **Regular reviews**: Check your budget monthly\n\nGreat job staying on track!`;
      }
    }

    // General financial advice
    if (questionLower.includes('advice') || questionLower.includes('help') || questionLower.includes('tip')) {
      return `Based on your financial data, here's my personalized advice:\n\n1. **Current Status**: You've made ${analysis.transactionCount} transactions this month\n2. **Income**: ${analysis.totalIncome > 0 ? 'Good income tracking' : 'Consider adding income sources'}\n3. **Savings**: ${analysis.savingsRate > 20 ? 'Excellent savings rate!' : 'Focus on increasing savings'}\n4. **Top Spending**: ${analysis.topSpendingCategory?.[0] || 'Unknown'} - review this category\n\nWhat specific area would you like to improve?`;
    }

    // Investment advice
    if (questionLower.includes('invest') || questionLower.includes('investment')) {
      if (analysis.savingsRate > 15) {
        return `Great! With your ${Math.round(analysis.savingsRate)}% savings rate, you're ready to invest. Here are some options:\n\n1. **Emergency Fund First**: Save 3-6 months of expenses\n2. **Index Funds**: Low-cost, diversified option\n3. **Mutual Funds**: Professional management\n4. **Real Estate**: Consider property investment\n5. **Start Small**: Begin with small amounts\n\nRemember: Only invest what you can afford to lose!`;
      } else {
        return `Before investing, let's focus on building your savings first. Your current savings rate is ${Math.round(analysis.savingsRate)}%.\n\n**Steps to prepare for investing:**\n1. **Increase savings** to at least 20%\n2. **Build emergency fund** (3-6 months expenses)\n3. **Pay off high-interest debt** first\n4. **Learn about investing** - education is key\n5. **Start with small amounts** when ready\n\nWould you like help creating a savings plan to prepare for investing?`;
      }
    }

    // Debt advice
    if (questionLower.includes('debt') || questionLower.includes('loan') || questionLower.includes('credit')) {
      return `Managing debt is crucial for financial health. Here's my advice:\n\n1. **List all debts**: Include amounts and interest rates\n2. **Pay high-interest first**: Credit cards usually have highest rates\n3. **Consider consolidation**: Lower interest rates if possible\n4. **Avoid new debt**: Focus on paying existing debt\n5. **Emergency fund**: Prevents new debt for emergencies\n\nWould you like help creating a debt payoff plan?`;
    }

    // Default response
    return `I'm here to help with your financial questions! Based on your data, I can see you're actively managing your finances with ${analysis.transactionCount} transactions this month.\n\n**What I can help with:**\n• Budget optimization\n• Savings strategies\n• Investment advice\n• Debt management\n• Spending analysis\n\nWhat specific financial topic would you like to discuss?`;
  }
}