import { ReceiptData } from './ocrService';
import axios from 'axios';
import Constants from 'expo-constants';

interface LLMReceiptData {
  amount: number;
  merchant: string;
  date: string;
  category: string;
  items?: string[];
  confidence: number;
  currency?: string;
  tax?: number;
  total?: number;
}

export class LLMService {
  // Google Gemini 2.5 Flash endpoint
  private static get GEMINI_ENDPOINT() {
    const googleKey = Constants.expoConfig?.extra?.googleAiApiKey;
    
    return {
      name: 'Google Gemini 2.5 Flash',
      url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      apiKey: googleKey,
      headers: { 'Content-Type': 'application/json' },
      type: 'google'
    };
  }
  
    static async processReceiptText(rawText: string, userCurrency: string = 'PKR'): Promise<LLMReceiptData> {
    try {
      const endpoint = this.GEMINI_ENDPOINT;
      
      // Check if Google AI API key is configured
      if (!endpoint.apiKey) {
        return this.enhancedFallbackProcessing(rawText, userCurrency);
      }

      try {
        // Google AI API format (following official documentation)
        const response = await axios.post(`${endpoint.url}?key=${endpoint.apiKey}`, {
          contents: [
            {
              parts: [
                {
                  text: this.createReceiptPrompt(rawText, userCurrency)
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 300,
            thinkingConfig: {
              thinkingBudget: 0 // Disable thinking for faster response
            }
          }
        }, {
          headers: {
            ...endpoint.headers,
          },
          timeout: 15000,
        });
        
        const result = (response.data as any).candidates[0]?.content?.parts[0]?.text || '';
        
        const llmData = this.parseLLMResponse(result, rawText, userCurrency);
        
        // If LLM processing was successful, return the result
        if (llmData.confidence > 0.5) {
          return llmData;
        }
      } catch (llmError: any) {
        // LLM processing failed, continue to fallback
      }
      
      // If Gemini fails, use enhanced fallback
      return this.enhancedFallbackProcessing(rawText, userCurrency);
    } catch (error) {
      console.error('❌ LLM service error:', error);
      return this.enhancedFallbackProcessing(rawText, userCurrency);
    }
  }

  private static createReceiptPrompt(rawText: string, userCurrency: string): string {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    return `You are an expert assistant that extracts structured data from OCR text of receipts. Your task is to analyze the receipt text and return ONLY valid JSON.

RECEIPT TEXT:
${rawText}

INSTRUCTIONS:
1. Extract the total transaction amount (look for TOTAL, GRAND TOTAL, AMOUNT DUE, etc.)
2. Identify the merchant/business name using these strategies:
   - Look at the very top of the receipt (first 1-3 lines)
   - Search for business names in ALL CAPS or Title Case
   - Look for store/restaurant names before addresses or phone numbers
   - Check for brand names like "STARBUCKS", "MCDONALDS", "WALMART"
   - Ignore lines with dates, times, addresses, phone numbers, or amounts
   - If multiple possible names, choose the most prominent one
3. Determine the transaction date (convert to YYYY-MM-DD format)
4. Categorize the transaction intelligently based on the merchant and items
5. Extract individual items purchased (if visible)
6. Identify tax amount and total amount (if different from main amount)
7. Detect the currency used in the receipt

CATEGORIES TO USE:
- "Food & Dining" (restaurants, cafes, fast food, coffee shops)
- "Shopping" (retail stores, online shopping, clothing, electronics)
- "Transportation" (gas stations, Uber, parking, public transport)
- "Healthcare" (pharmacies, medical services, hospitals)
- "Entertainment" (movies, games, streaming services, events)
- "Bills & Utilities" (electricity, water, internet, phone bills)
- "Education" (school fees, books, courses, tuition)
- "Other" (anything that doesn't fit above categories)

RETURN ONLY VALID JSON IN THIS EXACT FORMAT:
{
  "amount": number,
  "merchant": "string",
  "date": "YYYY-MM-DD",
  "category": "string",
  "items": ["item1", "item2", "item3"],
  "currency": "${userCurrency}",
  "tax": number,
  "total": number
}

RULES:
- Convert all amounts to ${userCurrency} if different currency detected
- If date not found or unclear, use today's date: ${today}
- For merchant names: prioritize business names over addresses, phone numbers, or generic text
- If merchant unclear, use "Unknown Merchant"
- If amount not found, use 0
- Ensure all strings are properly quoted
- Do not include any explanations or text outside the JSON`;
  }

  private static parseLLMResponse(llmResponse: string, rawText: string, userCurrency: string): LLMReceiptData {
    try {
      // Try to extract JSON from the response - multiple strategies
      let jsonStr = '';
      
      // Strategy 1: Look for JSON object with curly braces
      const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      } else {
        // Strategy 2: Look for JSON array (if LLM returns array)
        const arrayMatch = llmResponse.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          jsonStr = arrayMatch[0];
        }
      }
      
      if (!jsonStr) {
        throw new Error('No JSON found in LLM response');
      }
      
      // Clean up the JSON string
      jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsed = JSON.parse(jsonStr);
      
      // Validate and clean the parsed data with robust type checking
      const amount = this.validateNumber(parsed.amount, 'amount');
      const merchant = this.validateString(parsed.merchant, 'merchant', 'Unknown Merchant');
      const date = this.validateDate(parsed.date);
      const category = this.validateCategory(parsed.category);
      const items = this.validateArray(parsed.items, 'items');
      const tax = this.validateNumber(parsed.tax, 'tax');
      const total = this.validateNumber(parsed.total, 'total', amount);
      const currency = this.validateString(parsed.currency, 'currency', userCurrency);
      
      // Calculate confidence based on data quality
      const confidence = this.calculateLLMConfidence(rawText, amount, merchant, items, category);
      
      return {
        amount,
        merchant,
        date,
        category,
        items,
        confidence,
        currency,
        tax,
        total,
      };
    } catch (error) {
      console.error('❌ Failed to parse LLM response:', error);
      throw error;
    }
  }

  // Helper methods for robust data validation
  private static validateNumber(value: any, fieldName: string, fallback: number = 0): number {
    // Handle null, undefined, or empty values
    if (value === null || value === undefined || value === '') {
      return fallback;
    }
    
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }
    
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
    
    // Additional safety check for any other type
    try {
      const coerced = Number(value);
      if (!isNaN(coerced)) {
        return coerced;
      }
    } catch (error) {
      console.warn(`Failed to validate number for ${fieldName}:`, value);
    }
    
    return fallback;
  }

  private static validateString(value: any, fieldName: string, fallback: string): string {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
    return fallback;
  }

  private static validateDate(value: any): string {
    if (typeof value === 'string' && value.trim().length > 0) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      } catch (error) {
        // Invalid date format, using today
      }
    }
    return new Date().toISOString().split('T')[0];
  }

  private static validateCategory(value: any): string {
    const validCategories = [
      'Food & Dining', 'Shopping', 'Transportation', 'Healthcare', 
      'Entertainment', 'Bills & Utilities', 'Education', 'Other'
    ];
    
    if (typeof value === 'string' && validCategories.includes(value)) {
      return value;
    }
    
    // Try to map common variations
    const categoryMap: Record<string, string> = {
      'food': 'Food & Dining',
      'dining': 'Food & Dining',
      'restaurant': 'Food & Dining',
      'cafe': 'Food & Dining',
      'transport': 'Transportation',
      'transportation': 'Transportation',
      'gas': 'Transportation',
      'fuel': 'Transportation',
      'uber': 'Transportation',
      'lyft': 'Transportation',
      'shopping': 'Shopping',
      'store': 'Shopping',
      'retail': 'Shopping',
      'health': 'Healthcare',
      'medical': 'Healthcare',
      'pharmacy': 'Healthcare',
      'entertainment': 'Entertainment',
      'movie': 'Entertainment',
      'game': 'Entertainment',
      'bills': 'Bills & Utilities',
      'utilities': 'Bills & Utilities',
      'electricity': 'Bills & Utilities',
      'education': 'Education',
      'school': 'Education',
      'tuition': 'Education'
    };
    
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      for (const [key, category] of Object.entries(categoryMap)) {
        if (lowerValue.includes(key)) {
          return category;
        }
      }
    }
    
    console.log('⚠️ Invalid category, using "Other"');
    return 'Other';
  }

  private static validateArray(value: any, fieldName: string): string[] {
    if (Array.isArray(value)) {
      return value.filter(item => typeof item === 'string' && item.trim().length > 0);
    }
    console.log(`⚠️ Invalid ${fieldName}, using empty array`);
    return [];
  }

  private static calculateLLMConfidence(rawText: string, amount: number, merchant: string, items: string[], category: string): number {
    let confidence = 0;
    
    // Text quality (0-20 points)
    if (rawText.length > 50) confidence += 10;
    if (rawText.length > 100) confidence += 10;
    
    // Amount confidence (0-25 points)
    if (amount > 0) confidence += 15;
    if (amount > 1 && amount < 100000) confidence += 10;
    
    // Merchant confidence (0-20 points)
    if (merchant !== 'Unknown Merchant') confidence += 10;
    if (merchant.length > 3 && merchant.length < 50) confidence += 10;
    
    // Items confidence (0-15 points)
    if (items.length > 0) confidence += 10;
    if (items.length > 2) confidence += 5;
    
    // Category confidence (0-10 points)
    if (category !== 'Other') confidence += 10;
    
    // Pattern recognition (0-10 points)
    if (/total|amount|rs\.|\$/.test(rawText.toLowerCase())) confidence += 5;
    if (/date|time/.test(rawText.toLowerCase())) confidence += 5;
    
    return Math.min(confidence / 100, 1);
  }

  private static enhancedFallbackProcessing(rawText: string, userCurrency: string): LLMReceiptData {
    console.log('🔧 Using enhanced fallback processing...');
    
    const text = rawText.toLowerCase();
    
    // Enhanced amount extraction with multiple strategies
    const extractedAmount = this.extractAmountEnhanced(text);
    
    // Enhanced merchant extraction
    const merchant = this.extractMerchantEnhanced(rawText);
    
    // Enhanced date extraction
    const date = this.extractDateEnhanced(rawText);
    
    // Enhanced category detection
    const category = this.categorizeReceiptEnhanced(text);
    
    // Enhanced items extraction
    const items = this.extractItemsEnhanced(rawText);
    
    // Enhanced currency detection
    const detectedCurrency = this.extractCurrencyEnhanced(rawText);
    
    // Enhanced tax extraction
    const extractedTax = this.extractTaxEnhanced(text);
    
    // Convert amounts to user's currency if different
    const amount = this.convertToUserCurrency(extractedAmount, detectedCurrency, userCurrency);
    const tax = this.convertToUserCurrency(extractedTax, detectedCurrency, userCurrency);
    const total = amount; // Total is same as amount for now
    
    // Calculate confidence based on extraction quality
    const confidence = this.calculateConfidence(rawText, amount, merchant, items);

    return {
      amount,
      merchant,
      date,
      category,
      items,
      confidence,
      currency: userCurrency,
      tax,
      total,
    };
  }

  private static convertToUserCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency || amount === 0) {
      return amount;
    }

    // Normalize currency symbols to codes
    const currencyMap: Record<string, string> = {
      '$': 'USD',
      '€': 'EUR',
      '£': 'GBP',
      '₹': 'INR',
      '₨': 'PKR',
      '¥': 'JPY',
      '₽': 'RUB',
      '₩': 'KRW',
      '₦': 'NGN',
      '₴': 'UAH',
      '₸': 'KZT',
      '₺': 'TRY',
      '₼': 'AZN',
      '₾': 'GEL',
      '₿': 'BTC'
    };

    const normalizedFromCurrency = currencyMap[fromCurrency] || fromCurrency;
    const normalizedToCurrency = currencyMap[toCurrency] || toCurrency;

    // Simple conversion rates (you can enhance this with real-time rates)
    const conversionRates: Record<string, Record<string, number>> = {
      'USD': {
        'PKR': 280,
        'EUR': 0.85,
        'GBP': 0.73,
        'INR': 83,
        'CAD': 1.35,
        'AUD': 1.52,
        'JPY': 150,
        'CNY': 7.2,
      },
      'PKR': {
        'USD': 0.0036,
        'EUR': 0.003,
        'GBP': 0.0026,
        'INR': 0.3,
        'CAD': 0.0048,
        'AUD': 0.0054,
        'JPY': 0.54,
        'CNY': 0.026,
      },
      'EUR': {
        'USD': 1.18,
        'PKR': 330,
        'GBP': 0.86,
        'INR': 98,
        'CAD': 1.59,
        'AUD': 1.79,
        'JPY': 177,
        'CNY': 8.5,
      },
      'GBP': {
        'USD': 1.37,
        'PKR': 383,
        'EUR': 1.16,
        'INR': 114,
        'CAD': 1.85,
        'AUD': 2.08,
        'JPY': 205,
        'CNY': 9.9,
      },
      'INR': {
        'USD': 0.012,
        'PKR': 3.37,
        'EUR': 0.0102,
        'GBP': 0.0088,
        'CAD': 0.016,
        'AUD': 0.018,
        'JPY': 1.8,
        'CNY': 0.087,
      },
      'JPY': {
        'USD': 0.0067,
        'PKR': 1.87,
        'EUR': 0.0057,
        'GBP': 0.0049,
        'INR': 0.56,
        'CAD': 0.009,
        'AUD': 0.01,
        'CNY': 0.048,
      },
      'CNY': {
        'USD': 0.14,
        'PKR': 39.2,
        'EUR': 0.12,
        'GBP': 0.1,
        'INR': 11.6,
        'CAD': 0.19,
        'AUD': 0.21,
        'JPY': 20.8,
      },
    };

    const rate = conversionRates[normalizedFromCurrency]?.[normalizedToCurrency];
    if (rate) {
      return amount * rate;
    }

    // If no conversion rate found, return original amount
    console.log(`No conversion rate found from ${normalizedFromCurrency} to ${normalizedToCurrency}`);
    return amount;
  }

  private static extractAmountEnhanced(text: string): number {
    // Multiple strategies for amount extraction
    const strategies = [
      // Strategy 1: Look for TOTAL patterns
      () => {
        const totalPatterns = [
          /TOTAL[:\s]*[Rr]s?\.?\s*([\d,]+\.?\d*)/gi,
          /TOTAL[:\s]*\$?\s*([\d,]+\.?\d*)/gi,
          /GRAND TOTAL[:\s]*[Rr]s?\.?\s*([\d,]+\.?\d*)/gi,
          /AMOUNT DUE[:\s]*[Rr]s?\.?\s*([\d,]+\.?\d*)/gi,
          /BALANCE DUE[:\s]*[Rr]s?\.?\s*([\d,]+\.?\d*)/gi,
        ];
        
        for (const pattern of totalPatterns) {
          const matches = text.matchAll(pattern);
          for (const match of matches) {
            if (match[1]) {
              const cleanNumber = match[1].replace(/[^\d.]/g, '');
              const num = parseFloat(cleanNumber);
              if (num > 0 && num < 1000000) return num;
            }
          }
        }
        return 0;
      },

      // Strategy 2: Look for currency patterns
      () => {
        const currencyPatterns = [
          /[Rr]s\.\s*([\d,]+\.?\d*)/gi,
          /[Rr]s\s*([\d,]+\.?\d*)/gi,
          /\$\s*([\d,]+\.?\d*)/gi,
          /([\d,]+\.?\d*)\s*[Rr]s/gi,
          /([\d,]+\.?\d*)\s*USD/gi,
        ];
        
        let maxAmount = 0;
        for (const pattern of currencyPatterns) {
          const matches = text.matchAll(pattern);
          for (const match of matches) {
            if (match[1]) {
              const cleanNumber = match[1].replace(/[^\d.]/g, '');
              const num = parseFloat(cleanNumber);
              if (num > maxAmount && num < 1000000) {
                maxAmount = num;
              }
            }
          }
        }
        return maxAmount;
      },

      // Strategy 3: Look for the largest number that could be a total
      () => {
        const numbers = text.match(/[\d,]+\.?\d*/g) || [];
        let maxAmount = 0;
        
        for (const numStr of numbers) {
          const cleanNumber = numStr.replace(/[^\d.]/g, '');
          const num = parseFloat(cleanNumber);
          
          // Filter out unlikely amounts (too small or too large)
          if (num > 0.5 && num < 1000000 && num > maxAmount) {
            // Check if this number appears near "total" or at the end of lines
            const context = text.substring(Math.max(0, text.indexOf(numStr) - 20), 
                                         text.indexOf(numStr) + numStr.length + 20);
            if (/total|amount|due|balance/i.test(context) || 
                context.includes('\n') && context.split('\n').pop()?.includes(numStr)) {
              maxAmount = num;
            }
          }
        }
        return maxAmount;
      }
    ];

    // Try each strategy
    for (const strategy of strategies) {
      const amount = strategy();
      if (amount > 0) {
        return amount;
      }
    }

    return 0;
  }

  private static extractMerchantEnhanced(rawText: string): string {
    const lines = rawText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Multiple strategies for merchant extraction
    const strategies = [
      // Strategy 1: Look for business names in the first few lines
      () => {
        for (let i = 0; i < Math.min(5, lines.length); i++) {
          const line = lines[i];
          
          // Skip lines that are clearly not merchant names
          if (line.length < 3 || line.length > 60) continue;
          if (/\d{2,}/.test(line)) continue; // Skip lines with multiple digits
          if (/rs\.|total|amount|date|time|powered|by|from|to|thank|welcome|receipt/i.test(line.toLowerCase())) continue;
          
          // Check if line looks like a business name
          if (/^[A-Za-z\s&'.-]+$/.test(line) && line.length > 2) {
            // Additional validation
            const words = line.split(' ').filter(word => word.length > 0);
            if (words.length >= 1 && words.length <= 4) {
              return line;
            }
          }
        }
        return null;
      },

      // Strategy 2: Look for all caps business names
      () => {
        for (const line of lines) {
          if (line.length > 3 && line.length < 50 && 
              /^[A-Z\s&'.-]+$/.test(line) &&
              !/\d/.test(line) &&
              !/rs\.|total|amount|date|time|powered|by|from|to|thank|welcome|receipt/i.test(line.toLowerCase())) {
            return line;
          }
        }
        return null;
      },

      // Strategy 3: Look for common business patterns
      () => {
        const businessPatterns = [
          /^([A-Za-z\s&'.-]+)\s*(?:STORE|SHOP|MARKET|RESTAURANT|CAFE|PIZZA|BURGER)/i,
          /^([A-Za-z\s&'.-]+)\s*(?:GAS|FUEL|STATION)/i,
          /^([A-Za-z\s&'.-]+)\s*(?:SUPERSTORE|SUPERMARKET|GROCERY)/i,
        ];

        for (const line of lines) {
          for (const pattern of businessPatterns) {
            const match = line.match(pattern);
            if (match && match[1].trim().length > 2) {
              return match[1].trim();
            }
          }
        }
        return null;
      }
    ];

    // Try each strategy
    for (const strategy of strategies) {
      const merchant = strategy();
      if (merchant) {
        return merchant;
      }
    }

    return 'Unknown Merchant';
  }

  private static extractDateEnhanced(rawText: string): string {
    // Enhanced date extraction with multiple formats
    const datePatterns = [
      // Full month names
      /(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi,
      // Abbreviated month names
      /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/gi,
      // MM/DD/YYYY or MM/DD/YY
      /(\d{1,2}\/\d{1,2}\/\d{2,4})/g,
      // MM-DD-YYYY or MM-DD-YY
      /(\d{1,2}-\d{1,2}-\d{2,4})/g,
      // YYYY-MM-DD
      /(\d{4}-\d{2}-\d{2})/g,
      // DD/MM/YYYY (European format)
      /(\d{1,2}\/\d{1,2}\/\d{4})/g,
      // With DATE: prefix
      /DATE[:\s]*(\d{1,2}\/\d{1,2}\/\d{2,4})/gi,
      /DATE[:\s]*(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/gi,
    ];

    for (const pattern of datePatterns) {
      const match = rawText.match(pattern);
      if (match) {
        try {
          // Try to parse and format the date
          const dateStr = match[1];
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
          }
        } catch (error) {
          // Continue to next pattern
        }
      }
    }

    return new Date().toISOString().split('T')[0];
  }

  private static categorizeReceiptEnhanced(text: string): string {
    const lowerText = text.toLowerCase();
    
    // Food & Dining
    if (lowerText.includes('restaurant') || lowerText.includes('cafe') || lowerText.includes('food') || 
        lowerText.includes('dining') || lowerText.includes('pizza') || lowerText.includes('burger') ||
        lowerText.includes('kfc') || lowerText.includes('mcdonalds') || lowerText.includes('dominos') ||
        lowerText.includes('starbucks') || lowerText.includes('coffee') || lowerText.includes('meal')) {
      return 'Food & Dining';
    }
    
    // Transportation
    if (lowerText.includes('gas') || lowerText.includes('fuel') || lowerText.includes('uber') || 
        lowerText.includes('taxi') || lowerText.includes('parking') || lowerText.includes('petrol') ||
        lowerText.includes('shell') || lowerText.includes('station') || lowerText.includes('transport')) {
      return 'Transportation';
    }
    
    // Shopping
    if (lowerText.includes('store') || lowerText.includes('shop') || lowerText.includes('amazon') || 
        lowerText.includes('mall') || lowerText.includes('market') || lowerText.includes('clothes') ||
        lowerText.includes('walmart') || lowerText.includes('target') || lowerText.includes('superstore')) {
      return 'Shopping';
    }
    
    // Entertainment
    if (lowerText.includes('movie') || lowerText.includes('cinema') || lowerText.includes('game') || 
        lowerText.includes('netflix') || lowerText.includes('concert') || lowerText.includes('theater')) {
      return 'Entertainment';
    }
    
    // Bills & Utilities
    if (lowerText.includes('electric') || lowerText.includes('water') || lowerText.includes('internet') || 
        lowerText.includes('phone') || lowerText.includes('bill') || lowerText.includes('utility')) {
      return 'Bills & Utilities';
    }
    
    // Healthcare
    if (lowerText.includes('doctor') || lowerText.includes('hospital') || lowerText.includes('medicine') || 
        lowerText.includes('pharmacy') || lowerText.includes('clinic') || lowerText.includes('medical')) {
      return 'Healthcare';
    }
    
    // Education
    if (lowerText.includes('school') || lowerText.includes('college') || lowerText.includes('university') || 
        lowerText.includes('tuition') || lowerText.includes('books') || lowerText.includes('fees')) {
      return 'Education';
    }
    
    return 'Other';
  }

  private static extractItemsEnhanced(rawText: string): string[] {
    const items: string[] = [];
    const lines = rawText.split('\n');
    
    const itemPatterns = [
      // Pattern: Item name followed by price
      /^([A-Za-z\s&'.-]+)\s+[Rr]s?\.?\s*[\d,]+\.?\d*$/i,
      /^([A-Za-z\s&'.-]+)\s+\$\s*[\d,]+\.?\d*$/i,
      // Pattern: Price followed by item name
      /[Rr]s?\.?\s*[\d,]+\.?\d*\s+([A-Za-z\s&'.-]+)$/i,
      /\$\s*[\d,]+\.?\d*\s+([A-Za-z\s&'.-]+)$/i,
    ];

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip lines that are clearly not items
      if (trimmed.length < 3) continue;
      if (/total|subtotal|tax|amount|due|balance|change/i.test(trimmed)) continue;
      if (/date|time|receipt|thank|welcome|powered|by/i.test(trimmed)) continue;
      
      // Try to extract item name using patterns
      for (const pattern of itemPatterns) {
        const match = trimmed.match(pattern);
        if (match && match[1]) {
          const itemName = match[1].trim();
          if (itemName.length > 2 && itemName.length < 50) {
            items.push(itemName);
            break;
          }
        }
      }
      
      // Fallback: if line contains price but no pattern matched
      if ((trimmed.includes('Rs') || trimmed.includes('$')) && 
          !items.some(item => trimmed.includes(item))) {
        // Extract text before the price
        const priceMatch = trimmed.match(/([A-Za-z\s&'.-]+)\s+[Rr]s?\.?\s*[\d,]+\.?\d*/i);
        if (priceMatch && priceMatch[1]) {
          const itemName = priceMatch[1].trim();
          if (itemName.length > 2 && itemName.length < 50) {
            items.push(itemName);
          }
        }
      }
    }
    
    // Remove duplicates and limit results
    return [...new Set(items)].slice(0, 8);
  }

  private static extractCurrencyEnhanced(rawText: string): string {
    // Check for currency codes first (more reliable)
    const currencyCodeMatch = rawText.match(/\b(USD|EUR|GBP|PKR|INR|CAD|AUD|JPY|CNY|RUB|KRW|NGN|UAH|KZT|TRY|AZN|GEL)\b/i);
    if (currencyCodeMatch) {
      return currencyCodeMatch[0].toUpperCase();
    }
    
    // Check for currency symbols
    const currencyMatch = rawText.match(/[\$£€₹₨₦₩¥₽₴₸₺₼₾₿]/);
    if (currencyMatch) {
      const symbol = currencyMatch[0];
      // Map symbols to currency codes
      const symbolMap: Record<string, string> = {
        '$': 'USD',
        '€': 'EUR',
        '£': 'GBP',
        '₹': 'INR',
        '₨': 'PKR',
        '¥': 'JPY',
        '₽': 'RUB',
        '₩': 'KRW',
        '₦': 'NGN',
        '₴': 'UAH',
        '₸': 'KZT',
        '₺': 'TRY',
        '₼': 'AZN',
        '₾': 'GEL',
        '₿': 'BTC'
      };
      return symbolMap[symbol] || 'USD';
    }
    
    return 'USD';
  }

  private static extractTaxEnhanced(text: string): number {
    const taxMatch = text.match(/(?:tax|vat|gst|hst|pst)[\s:]*[\$£€₹₨₦₩¥₽₴₸₺₼₾₿]?\s*([\d,]+\.?\d*)/i);
    return taxMatch ? parseFloat(taxMatch[1].replace(/,/g, '')) : 0;
  }

  private static calculateConfidence(rawText: string, amount: number, merchant: string, items: string[]): number {
    let confidence = 0;
    
    // Text quality (0-20 points)
    if (rawText.length > 50) confidence += 10;
    if (rawText.length > 100) confidence += 10;
    
    // Amount confidence (0-30 points)
    if (amount > 0) confidence += 15;
    if (amount > 1 && amount < 10000) confidence += 15;
    
    // Merchant confidence (0-20 points)
    if (merchant !== 'Unknown Merchant') confidence += 10;
    if (merchant.length > 3 && merchant.length < 50) confidence += 10;
    
    // Items confidence (0-20 points)
    if (items.length > 0) confidence += 10;
    if (items.length > 2) confidence += 10;
    
    // Pattern recognition (0-10 points)
    if (/total|amount|rs\.|\$/.test(rawText.toLowerCase())) confidence += 5;
    if (/date|time/.test(rawText.toLowerCase())) confidence += 5;
    
    return Math.min(confidence / 100, 1);
  }

  static async validateReceiptData(data: LLMReceiptData): Promise<{
    isValid: boolean;
    suggestions: string[];
    confidence: number;
  }> {
    const suggestions: string[] = [];
    let confidence = data.confidence;

    // Validate amount
    if (data.amount <= 0) {
      suggestions.push('Amount seems invalid. Please check the receipt.');
      confidence -= 0.2;
    }

    // Validate merchant
    if (data.merchant === 'Unknown' || data.merchant.length < 2) {
      suggestions.push('Could not identify merchant. Please enter manually.');
      confidence -= 0.1;
    }

    // Validate date
    const dateRegex = /^\d{4}-\d{2}-\d{2}$|^\d{1,2}\/\d{1,2}\/\d{2,4}$/;
    if (!dateRegex.test(data.date)) {
      suggestions.push('Date format seems incorrect. Please verify.');
      confidence -= 0.1;
    }

    // Validate category
    if (data.category === 'Other') {
      suggestions.push('Category could not be determined. Please select manually.');
      confidence -= 0.1;
    }

    return {
      isValid: confidence > 0.4,
      suggestions,
      confidence: Math.max(0, confidence),
    };
  }

    /**
   * Test method to verify Google Gemini 2.5 Flash is working
   */
  static async testLLMService(): Promise<{
    google: boolean;
    details: Record<string, string>;
  }> {
    const results = {
      google: false,
      details: {} as Record<string, string>
    };

    // Test Google Gemini 2.5 Flash
    try {
      const googleKey = Constants.expoConfig?.extra?.googleAiApiKey;
      if (googleKey) {
        console.log('🧪 Testing Google Gemini 2.5 Flash...');
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${googleKey}`,
          {
            contents: [{ parts: [{ text: 'Hello' }] }],
            generationConfig: {
              thinkingConfig: {
                thinkingBudget: 0 // Disable thinking for faster response
              }
            }
          },
          { timeout: 5000 }
        );
        results.google = true;
        results.details.google = 'Success';
      } else {
        results.details.google = 'No API key configured';
      }
    } catch (error) {
      results.details.google = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    console.log('🧪 Google Gemini 2.5 Flash Test Results:', results);
    return results;
  }
}