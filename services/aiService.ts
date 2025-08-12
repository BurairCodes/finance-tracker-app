interface CategoryPrediction {
  category: string;
  confidence: number;
}

export class AIService {
  private static readonly FOOD_KEYWORDS = ['restaurant', 'cafe', 'grocery', 'food', 'dining', 'lunch', 'dinner', 'breakfast', 'pizza', 'burger', 'kfc', 'mcdonalds', 'dominos', 'subway', 'biryani', 'karahi', 'daal', 'roti', 'naan', 'chai', 'lassi', 'haleem', 'nihari', 'kebab', 'tikka', 'samosa', 'pakora', 'chaat', 'kulfi', 'falooda'];
  private static readonly TRANSPORT_KEYWORDS = ['gas', 'fuel', 'uber', 'taxi', 'bus', 'train', 'parking', 'petrol', 'careem', 'rickshaw', 'metro', 'cng', 'diesel', 'toll', 'qingqi', 'chingchi', 'suzuki', 'corolla', 'civic', 'mehran', 'cultus', 'alto'];
  private static readonly SHOPPING_KEYWORDS = ['store', 'shop', 'amazon', 'purchase', 'buy', 'mall', 'daraz', 'market', 'bazaar', 'clothes', 'shoes', 'khaadi', 'gul ahmed', 'alkaram', 'sapphire', 'ideas', 'centaurus', 'emporium', 'liberty', 'anarkali'];
  private static readonly ENTERTAINMENT_KEYWORDS = ['movie', 'cinema', 'game', 'music', 'concert', 'netflix', 'youtube', 'spotify', 'gaming', 'coke studio', 'lollywood', 'bollywood', 'drama', 'ptv', 'ary', 'geo', 'hum tv'];
  private static readonly BILLS_KEYWORDS = ['electric', 'water', 'internet', 'phone', 'rent', 'mortgage', 'insurance', 'electricity', 'gas bill', 'wifi', 'wapda', 'kesc', 'ssgc', 'sngpl', 'ptcl', 'jazz', 'telenor', 'ufone', 'zong', 'nayatel', 'stormfiber'];
  private static readonly HEALTHCARE_KEYWORDS = ['doctor', 'hospital', 'medicine', 'pharmacy', 'clinic', 'medical', 'health', 'agha khan', 'shaukat khanum', 'liaquat', 'jinnah', 'civil hospital', 'pims', 'services hospital'];
  private static readonly EDUCATION_KEYWORDS = ['school', 'college', 'university', 'tuition', 'books', 'fees', 'education', 'lums', 'iba', 'nust', 'fast', 'comsats', 'uet', 'punjab university', 'karachi university'];

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
}