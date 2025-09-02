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

interface UserFinancialSummary {
  totalExpenses: number;
  totalIncome: number;
  savings: number;
  savingsRate: number;
  categorySpending: { [key: string]: number };
  topSpendingCategory: [string, number] | null;
  budgetUtilization: Array<{
    category: string;
    budget: number;
    spent: number;
    utilization: number;
  }>;
  transactionCount: number;
  currency: string;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export class AIService {
  private static readonly FOOD_KEYWORDS = ['restaurant', 'cafe', 'grocery', 'food', 'dining', 'lunch', 'dinner', 'breakfast', 'pizza', 'burger', 'kfc', 'mcdonalds', 'dominos', 'subway', 'biryani', 'karahi', 'daal', 'roti', 'naan', 'chai', 'lassi', 'haleem', 'nihari', 'kebab', 'tikka', 'samosa', 'pakora', 'chaat', 'kulfi', 'falooda', 'meal', 'snack', 'coffee', 'tea', 'juice', 'drink', 'eat', 'hungry', 'thirsty'];
  private static readonly TRANSPORT_KEYWORDS = ['gas', 'fuel', 'uber', 'taxi', 'bus', 'train', 'parking', 'petrol', 'careem', 'rickshaw', 'metro', 'cng', 'diesel', 'toll', 'qingqi', 'chingchi', 'suzuki', 'corolla', 'civic', 'mehran', 'cultus', 'alto', 'transport', 'travel', 'commute', 'ride', 'drive', 'car', 'bike', 'motorcycle'];
  private static readonly SHOPPING_KEYWORDS = ['store', 'shop', 'amazon', 'purchase', 'buy', 'mall', 'daraz', 'market', 'bazaar', 'clothes', 'shoes', 'khaadi', 'gul ahmed', 'alkaram', 'sapphire', 'ideas', 'centaurus', 'emporium', 'liberty', 'anarkali', 'shopping', 'retail', 'outlet', 'brand', 'fashion', 'accessories'];
  private static readonly ENTERTAINMENT_KEYWORDS = ['movie', 'cinema', 'game', 'music', 'concert', 'netflix', 'youtube', 'spotify', 'gaming', 'coke studio', 'lollywood', 'bollywood', 'drama', 'ptv', 'ary', 'geo', 'hum tv', 'entertainment', 'fun', 'leisure', 'hobby', 'recreation', 'party', 'celebration'];
  private static readonly BILLS_KEYWORDS = ['electric', 'water', 'internet', 'phone', 'rent', 'mortgage', 'insurance', 'electricity', 'gas bill', 'wifi', 'wapda', 'kesc', 'ssgc', 'sngpl', 'ptcl', 'jazz', 'telenor', 'ufone', 'zong', 'nayatel', 'stormfiber', 'bill', 'utility', 'service', 'subscription', 'payment', 'due'];
  private static readonly HEALTHCARE_KEYWORDS = ['doctor', 'hospital', 'medicine', 'pharmacy', 'clinic', 'medical', 'health', 'agha khan', 'shaukat khanum', 'liaquat', 'jinnah', 'civil hospital', 'pims', 'services hospital', 'healthcare', 'treatment', 'medicine', 'drug', 'therapy', 'checkup', 'appointment'];
  private static readonly EDUCATION_KEYWORDS = ['school', 'college', 'university', 'tuition', 'books', 'fees', 'education', 'lums', 'iba', 'nust', 'fast', 'comsats', 'uet', 'punjab university', 'karachi university', 'course', 'training', 'learning', 'study', 'academic'];

  // Conversation history to maintain context
  private static conversationHistory: Map<string, ConversationMessage[]> = new Map();

  // Keep existing categorization logic intact
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

  // Updated AI Coach method with improved Gemini integration
  static async getFinancialAdvice(
    question: string,
    transactions: any[],
    budgets: any[],
    userEmail: string
  ): Promise<string> {
    try {
      // Analyze user's financial data
      const analysis = this.analyzeFinancialData(transactions, budgets);
      
      // Add user message to conversation history
      this.addToConversationHistory(userEmail, 'user', question);
      
      // Try to get response from Google Gemini API with improved prompt
      const llmResponse = await this.getLLMResponse(question, analysis, userEmail);
      
      if (llmResponse) {
        // Add AI response to conversation history
        this.addToConversationHistory(userEmail, 'assistant', llmResponse);
        return llmResponse + '\n⚠️ This is AI-generated financial guidance for educational purposes only.';
      }
      
      console.log('Gemini API failed or returned null, falling back to local advice');
      // Fallback to local advice if Gemini is unavailable
      const localAdvice = this.generatePersonalizedAdvice(question, analysis);
      this.addToConversationHistory(userEmail, 'assistant', localAdvice);
      return localAdvice + '\n⚠️ This is AI-generated financial guidance for educational purposes only.';
      
    } catch (error) {
      console.error('Error generating financial advice:', error);
      
             // Fallback to local advice
       const analysis = this.analyzeFinancialData(transactions, budgets);
       const localAdvice = this.generatePersonalizedAdvice(question, analysis);
       this.addToConversationHistory(userEmail, 'assistant', localAdvice);
       return localAdvice + '\n⚠️ This is AI-generated financial guidance for educational purposes only.';
    }
  }

  // Add message to conversation history
  private static addToConversationHistory(userEmail: string, role: 'user' | 'assistant', content: string) {
    if (!this.conversationHistory.has(userEmail)) {
      this.conversationHistory.set(userEmail, []);
    }
    
    const history = this.conversationHistory.get(userEmail)!;
    history.push({
      role,
      content,
      timestamp: new Date()
    });
    
    // Keep only last 10 messages to prevent context overflow
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }
  }

  // Clear conversation history for a user
  static clearConversationHistory(userEmail: string) {
    this.conversationHistory.delete(userEmail);
  }

  // Get conversation history for debugging
  static getConversationHistory(userEmail: string): ConversationMessage[] {
    return this.conversationHistory.get(userEmail) || [];
  }

  // Improved method to call Google Gemini API with better prompt engineering
  private static async getLLMResponse(question: string, analysis: UserFinancialSummary, userEmail: string): Promise<string | null> {
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      const model = process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-2.5-flash';

      if (!apiKey) {
        console.warn('Google Gemini API key not configured. Using local advice.');
        return null;
      }

      // Get conversation history for context
      const history = this.conversationHistory.get(userEmail) || [];
      const recentHistory = history.slice(-4); // Last 4 messages for context

      // Create concise financial context
      const context = this.createConciseFinancialContext(analysis);
      
      // Improved prompt that emphasizes the user's specific question
      const systemPrompt = `You are a knowledgeable and empathetic financial advisor. Your role is to provide personalized, actionable financial advice based on the user's specific question and their financial situation.

IMPORTANT: Always focus on answering the user's EXACT question first, then provide additional relevant advice based on their financial context.

Guidelines:
- Answer the specific question asked
- Provide actionable, practical advice
- Be encouraging but realistic
- Keep responses conversational and under 250 words
- Use the financial context to personalize advice
- Avoid generic responses - make it specific to their situation`;

      const userPrompt = `User's Question: "${question}"

Financial Context (for personalization):
${context}

${recentHistory.length > 0 ? `Recent Conversation Context:
${recentHistory.map(msg => `${msg.role === 'user' ? 'User' : 'You'}: ${msg.content}`).join('\n')}` : ''}

Please provide a direct, specific answer to the user's question, using their financial context to personalize the advice.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: systemPrompt + "\n\n" + userPrompt }]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.8,
              maxOutputTokens: 1000,  // Increased from 500 to get more complete responses
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              }
            ]
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API error: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

             const data = await response.json();
       
       // Debug logging to verify API calls
       console.log('Gemini API Response Status:', response.status);
       console.log('Gemini API Response Data:', JSON.stringify(data, null, 2));
       
       const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
       
               if (!text) {
          console.warn('No response text from Gemini API - checking for truncated response');
          // Check if we have a truncated response due to MAX_TOKENS
          if (data.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
            console.warn('Response truncated due to token limit - increasing maxOutputTokens');
            // Try again with higher token limit
            return await this.getLLMResponseWithHigherTokens(question, analysis, userEmail, apiKey, model);
          }
          console.warn('No response text from Gemini API');
          return null;
        }

                // Check if the response was truncated even if we got some text
        if (data.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
          console.warn('Response truncated despite having text - retrying with higher tokens');
          return await this.getLLMResponseWithHigherTokens(question, analysis, userEmail, apiKey, model);
        }

        // Ensure the response is complete (not ending abruptly)
        const trimmedText = text.trim();
        if (trimmedText.endsWith('...') || trimmedText.endsWith('...') || trimmedText.length < 50) {
          console.warn('Response seems incomplete - retrying with higher tokens');
          return await this.getLLMResponseWithHigherTokens(question, analysis, userEmail, apiKey, model);
        }

        return trimmedText;
    } catch (error) {
      console.error('Error calling Google Gemini API:', error);
      return null;
    }
  }

  // Helper method to retry with higher token limit
  private static async getLLMResponseWithHigherTokens(
    question: string, 
    analysis: UserFinancialSummary, 
    userEmail: string, 
    apiKey: string, 
    model: string
  ): Promise<string | null> {
    try {
      console.log('Retrying with higher token limit...');
      
      // Get conversation history for context
      const history = this.conversationHistory.get(userEmail) || [];
      const recentHistory = history.slice(-2); // Reduced context for higher token limit
      
      // Create concise financial context
      const context = this.createConciseFinancialContext(analysis);
      
      // Simplified prompt for higher token limit
      const systemPrompt = `You are a knowledgeable financial advisor. Provide personalized, actionable financial advice based on the user's specific question and their financial situation. Keep responses conversational and under 300 words.`;
      
      const userPrompt = `User's Question: "${question}"

Financial Context: ${context}

Please provide a direct, specific answer to the user's question.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: systemPrompt + "\n\n" + userPrompt }]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.8,
              maxOutputTokens: 3000,  // Much higher token limit
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              }
            ]
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API retry error: ${response.status} ${response.statusText}`, errorText);
        return null;
      }

      const data = await response.json();
      console.log('Retry response status:', response.status);
      console.log('Retry response data:', JSON.stringify(data, null, 2));
      
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        console.warn('Still no response text from Gemini API retry');
        return null;
      }

      console.log('Retry successful - got full response');
      return text.trim();
    } catch (error) {
      console.error('Error in Gemini API retry:', error);
      return null;
    }
  }

  // Create concise financial context for better prompt focus
  private static createConciseFinancialContext(analysis: UserFinancialSummary): string {
    const context = [
      `Income: ${analysis.totalIncome.toFixed(2)}`,
      `Expenses: ${analysis.totalExpenses.toFixed(2)}`,
      `Savings Rate: ${analysis.savingsRate.toFixed(1)}%`,
      `Transactions: ${analysis.transactionCount}`,
    ];

    if (analysis.topSpendingCategory) {
      context.push(`Top Spending: ${analysis.topSpendingCategory[0]} (${analysis.topSpendingCategory[1].toFixed(2)})`);
    }

    const overBudget = analysis.budgetUtilization.filter(b => b.utilization > 100);
    if (overBudget.length > 0) {
      context.push(`Over Budget: ${overBudget.map(b => `${b.category} (${b.utilization.toFixed(1)}%)`).join(', ')}`);
    }

    return context.join(' | ');
  }

  private static analyzeFinancialData(transactions: any[], budgets: any[]): UserFinancialSummary {
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

    // Handle edge case where there are no expenses (savings rate would be 100%)
    const adjustedSavingsRate = totalExpenses === 0 ? 0 : savingsRate;

    // Category analysis
    const categorySpending: { [key: string]: number } = {};
    expenses.forEach(t => {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + Math.abs(t.amount);
    });

    const topSpendingCategory = Object.entries(categorySpending)
      .sort(([,a], [,b]) => b - a)[0] || null;

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
      savingsRate: adjustedSavingsRate,
      categorySpending,
      topSpendingCategory,
      budgetUtilization,
      transactionCount: monthlyTransactions.length,
      currency: 'PKR' // Default currency
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

  private static generatePersonalizedAdvice(question: string, analysis: UserFinancialSummary): string {
    const questionLower = question.toLowerCase();
    const timestamp = Date.now(); // Add randomness factor
    
    // Savings advice
    if (questionLower.includes('save') || questionLower.includes('saving')) {
      // Handle case where there are no expenses yet
      if (analysis.totalExpenses === 0) {
        return `I can see you've started tracking your income, which is great! Since you haven't recorded any expenses yet, here's how to get started with saving:\n\n1. **Start tracking expenses** - Record every purchase, no matter how small\n2. **Set a savings goal** - Aim to save 20% of your income\n3. **Create a budget** - Allocate money to different categories\n4. **Automate savings** - Set up automatic transfers\n\nWould you like help setting up your first budget?`;
      }
      
      if (analysis.savingsRate < 10) {
        const adviceVariations = [
          `Your savings rate is ${Math.round(analysis.savingsRate)}%, which is below the recommended 20%. Here's how to improve:\n\n1. **Pay yourself first** - Set up automatic transfers of 20% of your income\n2. **Track your spending** - You're already doing this great!\n3. **Cut back on ${analysis.topSpendingCategory?.[0] || 'your biggest expense'}** - This is your highest spending area\n4. **Use the 50/30/20 rule**: 50% needs, 30% wants, 20% savings\n\nWould you like help creating a specific savings plan?`,
          
          `I notice your savings rate is only ${Math.round(analysis.savingsRate)}%. Let's boost it:\n\n1. **Automate savings** - Make it automatic so you don't have to think about it\n2. **Emergency fund first** - Aim for 3-6 months of expenses\n3. **Review ${analysis.topSpendingCategory?.[0] || 'your top spending category'}** - Look for ways to reduce this\n4. **Set specific goals** - What are you saving for?\n\nReady to create a savings strategy?`,
          
          `Your current savings rate of ${Math.round(analysis.savingsRate)}% needs improvement. Here's my advice:\n\n1. **Start small** - Even 5% is better than nothing\n2. **Increase gradually** - Add 1% each month until you reach 20%\n3. **Find extra income** - Side hustles or overtime\n4. **Reduce fixed costs** - Review subscriptions and bills\n\nLet's work on a plan together!`
        ];
        return adviceVariations[timestamp % adviceVariations.length];
      } else {
        const positiveAdvice = [
          `Excellent! Your ${Math.round(analysis.savingsRate)}% savings rate is impressive. To optimize further:\n\n1. **Consider investing** - Look into index funds or mutual funds\n2. **Emergency fund** - Aim for 3-6 months of expenses\n3. **Retirement planning** - Start early for compound growth\n4. **Diversify** - Don't put all savings in one place\n\nKeep up the great work!`,
          
          `Fantastic savings rate of ${Math.round(analysis.savingsRate)}%! Here's how to maximize it:\n\n1. **Investment options** - Explore stocks, bonds, or real estate\n2. **Tax-advantaged accounts** - Consider retirement accounts\n3. **Goal setting** - What's your next financial milestone?\n4. **Review regularly** - Check your progress monthly\n\nYou're on the right track!`,
          
          `Your ${Math.round(analysis.savingsRate)}% savings rate shows great discipline. Next steps:\n\n1. **Build wealth** - Move from saving to investing\n2. **Multiple goals** - Emergency fund, vacation, home down payment\n3. **Automate everything** - Make it seamless\n4. **Celebrate wins** - Acknowledge your progress\n\nYou're building a strong financial foundation!`
        ];
        return positiveAdvice[timestamp % positiveAdvice.length];
      }
    }

    // Budget advice
    if (questionLower.includes('budget') || questionLower.includes('spending')) {
      const overBudget = analysis.budgetUtilization.find(b => b.utilization > 100);
      if (overBudget) {
        const budgetAdvice = [
          `You've exceeded your ${overBudget.category} budget by ${Math.round(overBudget.utilization - 100)}%. Here's how to get back on track:\n\n1. **Immediate action**: Cut non-essential spending in ${overBudget.category}\n2. **Review your budget**: Consider if the budget is realistic\n3. **Find alternatives**: Look for cheaper options\n4. **Track daily**: Monitor spending more closely\n\nWould you like help adjusting your budget for this category?`,
          
          `Your ${overBudget.category} budget is ${Math.round(overBudget.utilization - 100)}% over. Let's fix this:\n\n1. **Pause spending** - Stop non-essential purchases in this category\n2. **Analyze why** - What caused the overspending?\n3. **Adjust budget** - Maybe the budget was too low\n4. **Plan ahead** - Set realistic limits for next month\n\nNeed help creating a better budget?`,
          
          `Budget alert: ${overBudget.category} is ${Math.round(overBudget.utilization - 100)}% over. Action plan:\n\n1. **Identify the cause** - Was it unexpected expenses?\n2. **Immediate cuts** - Find ways to reduce spending\n3. **Learn from this** - What can you do differently?\n4. **Stay positive** - This is a learning opportunity\n\nLet's work on a solution together!`
        ];
        return budgetAdvice[timestamp % budgetAdvice.length];
      } else {
        const goodBudgetAdvice = [
          `Your budget management looks good! You're staying within your limits. To optimize further:\n\n1. **Review your top spending category**: ${analysis.topSpendingCategory?.[0] || 'Unknown'}\n2. **Set specific goals**: What are you saving for?\n3. **Automate savings**: Make it automatic\n4. **Regular reviews**: Check your budget monthly\n\nGreat job staying on track!`,
          
          `Excellent budget discipline! You're managing your money well. Next steps:\n\n1. **Optimize spending** - Look for ways to save more\n2. **Increase savings** - Try to save 20% of income\n3. **Set bigger goals** - What's your next financial target?\n4. **Celebrate success** - You're doing great!\n\nKeep up the good work!`,
          
          `Your budget is working well! You're staying within limits. To level up:\n\n1. **Analyze patterns** - What's working for you?\n2. **Increase efficiency** - Find more ways to save\n3. **Plan for the future** - Set long-term financial goals\n4. **Share your success** - Help others learn from you\n\nYou're building great financial habits!`
        ];
        return goodBudgetAdvice[timestamp % goodBudgetAdvice.length];
      }
    }

    // Investment advice
    if (questionLower.includes('invest') || questionLower.includes('investment')) {
      if (analysis.savingsRate > 15) {
        const investmentAdvice = [
          `Great! With your ${Math.round(analysis.savingsRate)}% savings rate, you're ready to invest. Here are some options:\n\n1. **Emergency Fund First**: Save 3-6 months of expenses\n2. **Index Funds**: Low-cost, diversified option\n3. **Mutual Funds**: Professional management\n4. **Real Estate**: Consider property investment\n5. **Start Small**: Begin with small amounts\n\nRemember: Only invest what you can afford to lose!`,
          
          `Your ${Math.round(analysis.savingsRate)}% savings rate shows you're ready for investing. Consider:\n\n1. **Diversification** - Don't put all money in one place\n2. **Risk tolerance** - How much risk can you handle?\n3. **Time horizon** - How long until you need the money?\n4. **Education** - Learn about different investment types\n5. **Professional advice** - Consider consulting a financial advisor\n\nReady to start your investment journey?`,
          
          `Excellent savings rate of ${Math.round(analysis.savingsRate)}%! Investment options:\n\n1. **Stock Market** - Individual stocks or ETFs\n2. **Bonds** - Lower risk, steady returns\n3. **Real Estate** - Property investment\n4. **Retirement Accounts** - Tax-advantaged investing\n5. **Dollar-Cost Averaging** - Invest regularly over time\n\nWhat type of investment interests you most?`
        ];
        return investmentAdvice[timestamp % investmentAdvice.length];
      } else {
        const preInvestmentAdvice = [
          `Before investing, let's focus on building your savings first. Your current savings rate is ${Math.round(analysis.savingsRate)}%.\n\n**Steps to prepare for investing:**\n1. **Increase savings** to at least 20%\n2. **Build emergency fund** (3-6 months expenses)\n3. **Pay off high-interest debt** first\n4. **Learn about investing** - education is key\n5. **Start with small amounts** when ready\n\nWould you like help creating a savings plan to prepare for investing?`,
          
          `Your ${Math.round(analysis.savingsRate)}% savings rate needs improvement before investing. Here's why:\n\n1. **Emergency fund first** - You need cash for emergencies\n2. **Higher savings rate** - Aim for 20% before investing\n3. **Debt reduction** - Pay off high-interest debt\n4. **Financial foundation** - Build a solid base first\n5. **Education** - Learn about investment risks\n\nLet's work on your savings foundation first!`,
          
          `Great question! But with a ${Math.round(analysis.savingsRate)}% savings rate, let's prepare first:\n\n1. **Emergency fund** - 3-6 months of expenses\n2. **Increase savings** - Get to 20% of income\n3. **Debt management** - Pay off high-interest debt\n4. **Financial education** - Learn about investment options\n5. **Start small** - Begin with small amounts when ready\n\nReady to build your investment foundation?`
        ];
        return preInvestmentAdvice[timestamp % preInvestmentAdvice.length];
      }
    }

    // Debt advice
    if (questionLower.includes('debt') || questionLower.includes('loan') || questionLower.includes('credit')) {
      const debtAdvice = [
        `Managing debt is crucial for financial health. Here's my advice:\n\n1. **List all debts**: Include amounts and interest rates\n2. **Pay high-interest first**: Credit cards usually have highest rates\n3. **Consider consolidation**: Lower interest rates if possible\n4. **Avoid new debt**: Focus on paying existing debt\n5. **Emergency fund**: Prevents new debt for emergencies\n\nWould you like help creating a debt payoff plan?`,
        
        `Debt management is key to financial freedom. Here's how to tackle it:\n\n1. **Snowball method**: Pay smallest debts first for motivation\n2. **Avalanche method**: Pay highest interest rates first\n3. **Budget for debt**: Include debt payments in your budget\n4. **Negotiate rates**: Call creditors to lower interest\n5. **Stop borrowing**: Don't take on new debt\n\nWhat's your current debt situation?`,
        
        `Smart debt management can transform your finances. Consider:\n\n1. **Debt-to-income ratio**: Keep it under 36%\n2. **Payment strategy**: Choose snowball or avalanche method\n3. **Refinancing options**: Lower rates when possible\n4. **Credit counseling**: Professional help if needed\n5. **Long-term planning**: How debt fits into your goals\n\nLet's create a debt management strategy!`
      ];
      return debtAdvice[timestamp % debtAdvice.length];
    }

    // General financial advice
    if (questionLower.includes('advice') || questionLower.includes('help') || questionLower.includes('tip')) {
      const generalAdvice = [
        `Based on your financial data, here's my personalized advice:\n\n1. **Current Status**: You've made ${analysis.transactionCount} transactions this month\n2. **Income**: ${analysis.totalIncome > 0 ? 'Good income tracking' : 'Consider adding income sources'}\n3. **Savings**: ${analysis.savingsRate > 20 ? 'Excellent savings rate!' : 'Focus on increasing savings'}\n4. **Top Spending**: ${analysis.topSpendingCategory?.[0] || 'Unknown'} - review this category\n\nWhat specific area would you like to improve?`,
        
        `Here's what I see in your financial picture:\n\n1. **Transaction Activity**: ${analysis.transactionCount} transactions this month\n2. **Income Management**: ${analysis.totalIncome > 0 ? 'Good tracking' : 'Add more income sources'}\n3. **Savings Progress**: ${analysis.savingsRate > 20 ? 'Great job!' : 'Need to increase savings'}\n4. **Spending Focus**: ${analysis.topSpendingCategory?.[0] || 'Unknown'} needs attention\n\nWhat would you like to work on first?`,
        
        `Your financial snapshot shows:\n\n1. **Activity Level**: ${analysis.transactionCount} transactions tracked\n2. **Income**: ${analysis.totalIncome > 0 ? 'Well tracked' : 'Add income sources'}\n3. **Savings**: ${analysis.savingsRate > 20 ? 'Excellent!' : 'Needs improvement'}\n4. **Biggest Expense**: ${analysis.topSpendingCategory?.[0] || 'Unknown'}\n\nWhich area would you like to focus on improving?`
      ];
      return generalAdvice[timestamp % generalAdvice.length];
    }

    // Default response with variety
    const defaultResponses = [
      `I'm here to help with your financial questions! Based on your data, I can see you're actively managing your finances with ${analysis.transactionCount} transactions this month.\n\n**What I can help with:**\n• Budget optimization\n• Savings strategies\n• Investment advice\n• Debt management\n• Spending analysis\n\nWhat specific financial topic would you like to discuss?`,
      
      `Great to see you're tracking your finances! You have ${analysis.transactionCount} transactions this month, which shows good financial awareness.\n\n**I can assist with:**\n• Creating better budgets\n• Increasing your savings\n• Investment guidance\n• Debt payoff strategies\n• Spending optimization\n\nWhat's your biggest financial concern right now?`,
      
      `Welcome! I can see you're serious about your finances with ${analysis.transactionCount} transactions tracked this month.\n\n**Let's work on:**\n• Budget improvements\n• Savings growth\n• Investment planning\n• Debt reduction\n• Spending habits\n\nWhat financial goal would you like to achieve?`
    ];
    
    // Handle case where there are no expenses yet
    if (analysis.totalExpenses === 0) {
      return `Welcome to your financial journey! I can see you've started tracking your income with ${analysis.transactionCount} transactions this month.\n\n**Next steps:**\n• Start recording your expenses\n• Create your first budget\n• Set savings goals\n• Learn about investment options\n\nWhat would you like to work on first?`;
    }
    
    return defaultResponses[timestamp % defaultResponses.length];
  }
}