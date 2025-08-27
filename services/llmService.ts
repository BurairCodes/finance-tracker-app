import { ReceiptData } from './ocrService';
import axios from 'axios';

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
  // Multiple free LLM endpoints to try (prioritized by reliability)
  private static readonly LLM_ENDPOINTS = [
    // OpenAI (Most Reliable)
    {
      name: 'OpenAI GPT-3.5',
      url: 'https://api.openai.com/v1/chat/completions',
      apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
      headers: { 'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}` },
      type: 'openai'
    },
    // Google AI (Good Free Tier)
    {
      name: 'Google Gemini',
      url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
      apiKey: process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY,
      headers: { 'Content-Type': 'application/json' },
      type: 'google'
    },
    // Hugging Face Models (Fallback)
    {
      name: 'HuggingFace GPT2',
      url: 'https://api-inference.huggingface.co/models/gpt2',
      apiKey: process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY,
      headers: { 'Authorization': `Bearer ${process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY}` },
      type: 'huggingface'
    },
    {
      name: 'HuggingFace DistilGPT2',
      url: 'https://api-inference.huggingface.co/models/distilgpt2',
      apiKey: process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY,
      headers: { 'Authorization': `Bearer ${process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY}` },
      type: 'huggingface'
    },
    {
      name: 'HuggingFace GPT-Neo-125M',
      url: 'https://api-inference.huggingface.co/models/EleutherAI/gpt-neo-125M',
      apiKey: process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY,
      headers: { 'Authorization': `Bearer ${process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY}` },
      type: 'huggingface'
    },
    {
      name: 'HuggingFace T5-Small',
      url: 'https://api-inference.huggingface.co/models/t5-small',
      apiKey: process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY,
      headers: { 'Authorization': `Bearer ${process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY}` },
      type: 'huggingface'
    }
  ];
  
  private static readonly API_KEY = process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY;

      static async processReceiptText(rawText: string, userCurrency: string = 'PKR'): Promise<LLMReceiptData> {
        try {
          if (!this.API_KEY) {
            console.log('Hugging Face API key not configured, using enhanced fallback processing');
            return this.enhancedFallbackProcessing(rawText, userCurrency);
          }

          // Try multiple LLM endpoints
          for (const endpoint of this.LLM_ENDPOINTS) {
            try {
              console.log(`Trying ${endpoint.name}...`);
              
              let response;
              let result;
              
              if (endpoint.type === 'openai') {
                // OpenAI API format
                response = await axios.post(endpoint.url, {
                  model: 'gpt-3.5-turbo',
                  messages: [
                    {
                      role: 'system',
                      content: 'You are a helpful assistant that extracts information from receipts and returns JSON data.'
                    },
                    {
                      role: 'user',
                      content: this.createReceiptPrompt(rawText, userCurrency)
                    }
                  ],
                  temperature: 0.1,
                  max_tokens: 300
                }, {
                  headers: {
                    ...endpoint.headers,
                    'Content-Type': 'application/json',
                  },
                  timeout: 15000,
                });
                
                result = (response.data as any).choices[0]?.message?.content || '';
                
              } else if (endpoint.type === 'google') {
                // Google AI API format
                response = await axios.post(`${endpoint.url}?key=${endpoint.apiKey}`, {
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
                    maxOutputTokens: 300
                  }
                }, {
                  headers: {
                    ...endpoint.headers,
                  },
                  timeout: 15000,
                });
                
                result = (response.data as any).candidates[0]?.content?.parts[0]?.text || '';
                
              } else {
                // Hugging Face API format
                response = await axios.post(endpoint.url, {
                  inputs: this.createReceiptPrompt(rawText, userCurrency),
                  parameters: {
                    max_new_tokens: 150,
                    temperature: 0.1,
                    return_full_text: false,
                    do_sample: true,
                  },
                }, {
                  headers: {
                    ...endpoint.headers,
                    'Content-Type': 'application/json',
                  },
                  timeout: 10000,
                });
                
                result = (response.data as any)[0]?.generated_text || '';
              }

              const llmData = this.parseLLMResponse(result, rawText, userCurrency);
              
              // If LLM processing was successful, return the result
              if (llmData.confidence > 0.6) {
                console.log(`${endpoint.name} processing successful`);
                return llmData;
              }
            } catch (llmError: any) {
              if (llmError.response) {
                console.log(`${endpoint.name} API error: ${llmError.response.status} - ${llmError.response.statusText}`);
                console.log('Response data:', llmError.response.data);
              } else {
                console.log(`${endpoint.name} processing failed:`, llmError.message);
              }
              // Continue to next endpoint
            }
          }
     
          // If all LLM endpoints fail, throw error instead of falling back
          throw new Error('All LLM endpoints failed. Please check your API key and try again.');
        } catch (error) {
          console.error('LLM service error:', error);
          throw error; // Don't fallback, let the caller handle it
        }
      }

  private static createReceiptPrompt(rawText: string, userCurrency: string): string {
    return `Analyze this receipt and extract key information. Convert all amounts to ${userCurrency}. Return a JSON object with: amount (total amount in ${userCurrency}), merchant (business name), date (YYYY-MM-DD format), category (Food & Dining, Shopping, Transportation, Healthcare, Entertainment, Bills & Utilities, Education, or Other), items (array of purchased items), currency (${userCurrency}), tax (tax amount in ${userCurrency}), total (total including tax in ${userCurrency}).

Receipt text:
${rawText}

JSON:`;
  }

  private static parseLLMResponse(llmResponse: string, rawText: string, userCurrency: string): LLMReceiptData {
    try {
      console.log('Raw LLM response:', llmResponse);
      
      // Try to extract JSON from the response
      const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        console.log('Extracted JSON string:', jsonStr);
        
        const parsed = JSON.parse(jsonStr);
        console.log('Parsed JSON:', parsed);
        
        // Validate and clean the parsed data
        const amount = typeof parsed.amount === 'number' ? parsed.amount : 
                      typeof parsed.amount === 'string' ? parseFloat(parsed.amount) || 0 : 0;
        
        const merchant = parsed.merchant && typeof parsed.merchant === 'string' ? parsed.merchant : 'Unknown';
        const date = parsed.date && typeof parsed.date === 'string' ? parsed.date : new Date().toISOString().split('T')[0];
        const category = parsed.category && typeof parsed.category === 'string' ? parsed.category : 'Other';
        const items = Array.isArray(parsed.items) ? parsed.items : [];
        const tax = typeof parsed.tax === 'number' ? parsed.tax : 
                   typeof parsed.tax === 'string' ? parseFloat(parsed.tax) || 0 : 0;
        const total = typeof parsed.total === 'number' ? parsed.total : 
                     typeof parsed.total === 'string' ? parseFloat(parsed.total) || amount : amount;
        
        return {
          amount,
          merchant,
          date,
          category,
          items,
          confidence: 0.85, // Higher confidence for LLM results
          currency: userCurrency,
          tax,
          total,
        };
      }
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
    }

    // Fallback to enhanced processing
    return this.enhancedFallbackProcessing(rawText, userCurrency);
  }

  private static enhancedFallbackProcessing(rawText: string, userCurrency: string): LLMReceiptData {
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
}
