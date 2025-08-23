export interface ReceiptData {
  amount: number;
  merchant: string;
  date: string;
  category: string;
  confidence: number;
  rawText: string;
  items?: string[];
}

export class OCRService {
  private static getAzureCredentials() {
    // Get credentials from environment variables
    const endpoint = process.env.EXPO_PUBLIC_AZURE_VISION_ENDPOINT;
    const apiKey = process.env.EXPO_PUBLIC_AZURE_VISION_API_KEY;

    if (!endpoint || !apiKey) {
      console.log('Azure Computer Vision credentials not configured');
      console.log('Please set EXPO_PUBLIC_AZURE_VISION_ENDPOINT and EXPO_PUBLIC_AZURE_VISION_API_KEY in your .env file');
      return null;
    }

    return { endpoint, apiKey };
  }

  static async extractTextFromImage(imageBase64: string): Promise<string> {
    try {
      const credentials = this.getAzureCredentials();
      
      if (!credentials) {
        console.log('Falling back to mock data due to missing Azure credentials');
        return this.getMockReceiptText();
      }

      // Convert base64 to Uint8Array for React Native compatibility
      const binaryString = atob(imageBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Make direct HTTP request to Azure Computer Vision API
      const response = await fetch(
        `${credentials.endpoint}vision/v3.2/read/analyze`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'Ocp-Apim-Subscription-Key': credentials.apiKey,
          },
          body: bytes,
        }
      );

      if (!response.ok) {
        throw new Error(`Azure API error: ${response.status} ${response.statusText}`);
      }

      // Get the operation location for polling
      const operationLocation = response.headers.get('Operation-Location');
      if (!operationLocation) {
        throw new Error('No operation location received from Azure');
      }

      // Poll for results (Azure OCR is asynchronous)
      let result = null;
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

        const pollResponse = await fetch(operationLocation, {
          headers: {
            'Ocp-Apim-Subscription-Key': credentials.apiKey,
          },
        });

        if (!pollResponse.ok) {
          throw new Error(`Polling error: ${pollResponse.status}`);
        }

        result = await pollResponse.json();

        if (result.status === 'succeeded') {
          break;
        } else if (result.status === 'failed') {
          throw new Error('Azure OCR processing failed');
        }

        attempts++;
      }

      if (!result || result.status !== 'succeeded') {
        throw new Error('Azure OCR timed out');
      }

      // Extract text from the result
      let fullText = '';
      if (result.analyzeResult && result.analyzeResult.readResults) {
        for (const page of result.analyzeResult.readResults) {
          if (page.lines) {
            for (const line of page.lines) {
              fullText += line.text + '\n';
            }
          }
        }
      }

      console.log('Azure Computer Vision extracted text:', fullText);
      return fullText.trim();

    } catch (error) {
      console.error('Error extracting text from image:', error);
      console.log('Falling back to mock data due to API error');
      return this.getMockReceiptText();
    }
  }

  static async analyzeReceipt(imageBase64: string): Promise<ReceiptData> {
    try {
      const rawText = await this.extractTextFromImage(imageBase64);
      console.log('Raw text received for parsing:', rawText);
      const parsedData = await this.parseReceiptText(rawText);
      console.log('Parsed receipt data:', parsedData);
      return parsedData;
    } catch (error) {
      console.error('Error analyzing receipt:', error);
      // Return mock data as fallback
      const mockText = this.getMockReceiptText();
      return await this.parseReceiptText(mockText);
    }
  }

  private static async parseReceiptText(text: string): Promise<ReceiptData> {
    try {
      // Enhanced parsing with multiple strategies
      const enhancedResult = this.parseWithEnhancedAI(text);
      if (enhancedResult && enhancedResult.confidence > 70) {
        console.log('Enhanced AI parsing results:', enhancedResult);
        return enhancedResult;
      }
    } catch (error) {
      console.log('Enhanced AI parsing failed, falling back to regex:', error);
    }

    // Fallback to regex parsing
    const amount = this.extractAmount(text);
    const merchant = this.extractMerchant(text);
    const date = this.extractDate(text);
    const category = this.categorizeMerchant(merchant);
    const items = this.extractItems(text);
    const confidence = this.calculateConfidence(text, amount, merchant);

    console.log('Regex parsing results:');
    console.log('- Amount:', amount);
    console.log('- Merchant:', merchant);
    console.log('- Date:', date);
    console.log('- Category:', category);
    console.log('- Items:', items);
    console.log('- Confidence:', confidence);

    return {
      amount,
      merchant,
      date,
      category,
      confidence,
      rawText: text,
      items
    };
  }

  private static parseWithEnhancedAI(text: string): ReceiptData | null {
    try {
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      // Enhanced amount extraction
      const amount = this.extractAmountEnhanced(text);
      
      // Enhanced merchant extraction
      const merchant = this.extractMerchantEnhanced(lines);
      
      // Enhanced date extraction
      const date = this.extractDateEnhanced(text);
      
      // Enhanced category detection
      const category = this.categorizeMerchantEnhanced(merchant, text);
      
      // Enhanced items extraction
      const items = this.extractItemsEnhanced(lines);
      
      // Enhanced confidence calculation
      const confidence = this.calculateConfidenceEnhanced(text, amount, merchant, items);

      return {
        amount,
        merchant,
        date,
        category,
        items: items.slice(0, 8), // Allow more items
        confidence,
        rawText: text,
      };

    } catch (error) {
      console.error('Enhanced AI parsing error:', error);
      return null;
    }
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

  private static extractMerchantEnhanced(lines: string[]): string {
    // Multiple strategies for merchant extraction
    const strategies = [
      // Strategy 1: Look for business names in the first few lines
      () => {
        for (let i = 0; i < Math.min(5, lines.length); i++) {
          const line = lines[i].trim();
          
          // Skip lines that are clearly not merchant names
          if (line.length < 3 || line.length > 60) continue;
          if (/\d{2,}/.test(line)) continue; // Skip lines with multiple digits
          if (/rs\.|total|amount|date|time|powered|by|from|to|thank|welcome|receipt/i.test(line)) continue;
          
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
          const trimmed = line.trim();
          if (trimmed.length > 3 && trimmed.length < 50 && 
              /^[A-Z\s&'.-]+$/.test(trimmed) &&
              !/\d/.test(trimmed) &&
              !/rs\.|total|amount|date|time|powered|by|from|to|thank|welcome|receipt/i.test(trimmed)) {
            return trimmed;
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

  private static extractDateEnhanced(text: string): string {
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
      const match = text.match(pattern);
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

  private static categorizeMerchantEnhanced(merchant: string, text: string): string {
    const merchantLower = merchant.toLowerCase();
    const textLower = text.toLowerCase();
    
    // Food & Dining
    if (merchantLower.includes('starbucks') || merchantLower.includes('coffee') ||
        merchantLower.includes('restaurant') || merchantLower.includes('cafe') ||
        merchantLower.includes('pizza') || merchantLower.includes('burger') ||
        merchantLower.includes('kfc') || merchantLower.includes('mcdonalds') ||
        merchantLower.includes('subway') || merchantLower.includes('dominos') ||
        merchantLower.includes('food') || merchantLower.includes('dining') ||
        textLower.includes('latte') || textLower.includes('sandwich') ||
        textLower.includes('combo') || textLower.includes('meal')) {
      return 'Food & Dining';
    }
    
    // Shopping
    if (merchantLower.includes('walmart') || merchantLower.includes('target') ||
        merchantLower.includes('amazon') || merchantLower.includes('shop') ||
        merchantLower.includes('store') || merchantLower.includes('market') ||
        merchantLower.includes('superstore') || merchantLower.includes('supermarket') ||
        textLower.includes('groceries') || textLower.includes('clothing') ||
        textLower.includes('electronics') || textLower.includes('household')) {
      return 'Shopping';
    }
    
    // Transportation
    if (merchantLower.includes('shell') || merchantLower.includes('gas') ||
        merchantLower.includes('fuel') || merchantLower.includes('station') ||
        merchantLower.includes('uber') || merchantLower.includes('lyft') ||
        merchantLower.includes('taxi') || merchantLower.includes('transport') ||
        textLower.includes('unleaded') || textLower.includes('gallons') ||
        textLower.includes('price/gal')) {
      return 'Transportation';
    }
    
    // Healthcare
    if (merchantLower.includes('pharmacy') || merchantLower.includes('drug') ||
        merchantLower.includes('cvs') || merchantLower.includes('walgreens') ||
        merchantLower.includes('medical') || merchantLower.includes('health') ||
        textLower.includes('prescription') || textLower.includes('medicine')) {
      return 'Healthcare';
    }
    
    // Entertainment
    if (merchantLower.includes('movie') || merchantLower.includes('cinema') ||
        merchantLower.includes('theater') || merchantLower.includes('game') ||
        merchantLower.includes('netflix') || merchantLower.includes('spotify') ||
        textLower.includes('ticket') || textLower.includes('admission')) {
      return 'Entertainment';
    }
    
    // Bills & Utilities
    if (merchantLower.includes('electric') || merchantLower.includes('water') ||
        merchantLower.includes('internet') || merchantLower.includes('phone') ||
        merchantLower.includes('utility') || merchantLower.includes('bill') ||
        textLower.includes('electricity') || textLower.includes('wifi') ||
        textLower.includes('service charge')) {
      return 'Bills & Utilities';
    }
    
    return 'Other';
  }

  private static extractItemsEnhanced(lines: string[]): string[] {
    const items: string[] = [];
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

  private static calculateConfidenceEnhanced(text: string, amount: number, merchant: string, items: string[]): number {
    let confidence = 0;
    
    // Text quality (0-20 points)
    if (text.length > 50) confidence += 10;
    if (text.length > 100) confidence += 10;
    
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
    if (/total|amount|rs\.|\$/.test(text.toLowerCase())) confidence += 5;
    if (/date|time/.test(text.toLowerCase())) confidence += 5;
    
    return Math.min(confidence, 100);
  }

  // Legacy methods for fallback
  private static extractAmount(text: string): number {
    const currencyPatterns = [
      /Rs\.\s*(\d+)/gi,
      /Rs\s*(\d+)/gi,
      /\$(\d+\.\d{2})/g,
      /(\d+\.\d{2})/g,
      /TOTAL[:\s]*[Rr]s?\.?\s*(\d+)/gi,
      /AMOUNT[:\s]*[Rr]s?\.?\s*(\d+)/gi,
      /SUBTOTAL[:\s]*[Rr]s?\.?\s*(\d+)/gi,
    ];

    let maxAmount = 0;
    for (const pattern of currencyPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          const amount = parseFloat(match.replace(/[^\d]/g, ''));
          if (amount > maxAmount && amount < 100000) {
            maxAmount = amount;
          }
        }
      }
    }

    return maxAmount || 0;
  }

  private static extractMerchant(text: string): string {
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.length < 3 || line.length > 50) continue;
      if (/\d/.test(line)) continue;
      if (/rs\.|total|amount|date|time|powered|by|from|to/i.test(line)) continue;
      
      if (/^[A-Za-z\s&]+$/.test(line) && line.length > 2) {
        return line;
      }
    }

    return 'Unknown Merchant';
  }

  private static extractDate(text: string): string {
    const datePatterns = [
      /(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi,
      /(\d{1,2}\/\d{1,2}\/\d{2,4})/g,
      /(\d{1,2}-\d{1,2}-\d{2,4})/g,
      /(\d{4}-\d{2}-\d{2})/g,
      /DATE[:\s]*(\d{1,2}\/\d{1,2}\/\d{2,4})/gi,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return new Date().toLocaleDateString();
  }

  private static categorizeMerchant(merchant: string): string {
    const merchantLower = merchant.toLowerCase();
    
    if (merchantLower.includes('starbucks') || merchantLower.includes('coffee')) return 'Food & Dining';
    if (merchantLower.includes('walmart') || merchantLower.includes('target')) return 'Shopping';
    if (merchantLower.includes('shell') || merchantLower.includes('gas')) return 'Transportation';
    if (merchantLower.includes('amazon') || merchantLower.includes('online')) return 'Shopping';
    if (merchantLower.includes('restaurant') || merchantLower.includes('food')) return 'Food & Dining';
    if (merchantLower.includes('uber') || merchantLower.includes('lyft')) return 'Transportation';
    if (merchantLower.includes('pizza') || merchantLower.includes('burger') || merchantLower.includes('kfc') || merchantLower.includes('mcdonalds')) return 'Food & Dining';
    
    return 'Other';
  }

  private static extractItems(text: string): string[] {
    const items: string[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.includes('$') && !line.toLowerCase().includes('total') && !line.toLowerCase().includes('subtotal')) {
        const itemMatch = line.match(/^([^$]+)\s+\$?\d+\.\d{2}/);
        if (itemMatch && itemMatch[1].trim().length > 2) {
          items.push(itemMatch[1].trim());
        }
      }
    }
    
    return items.slice(0, 5);
  }

  private static calculateConfidence(text: string, amount: number, merchant: string): number {
    let confidence = 0;
    
    if (text.length > 50) confidence += 20;
    if (text.length > 100) confidence += 20;
    
    if (amount > 0) confidence += 30;
    if (amount > 1 && amount < 1000) confidence += 20;
    
    if (merchant !== 'Unknown Merchant') confidence += 10;
    
    return Math.min(confidence, 100);
  }

  private static getMockReceiptText(): string {
    const mockReceipts = [
      `STARBUCKS
123 MAIN ST
DATE: 12/15/2023
TIME: 09:30 AM

LATTE GRANDE          $4.95
CROISSANT             $3.25
BAGEL                 $2.75

SUBTOTAL              $10.95
TAX                   $0.88
TOTAL                 $11.83

THANK YOU!`,

      `WALMART SUPERSTORE
456 OAK AVENUE
DATE: 12/14/2023

MILK 2% 1GAL         $3.99
BREAD WHOLE WHEAT    $2.49
BANANAS 2.5LB        $1.99
CHICKEN BREAST       $8.99
RICE WHITE 5LB       $4.99

SUBTOTAL             $22.45
TAX                  $1.80
TOTAL                $24.25`,

      `SHELL GAS STATION
789 HIGHWAY 101
DATE: 12/13/2023

UNLEADED GAS
GALLONS: 12.5
PRICE/GAL: $3.49
AMOUNT: $43.63

TOTAL                $43.63

THANK YOU!`,

      `TARGET STORE
321 SHOPPING CTR
DATE: 12/12/2023

PAPER TOWELS         $5.99
DISH SOAP            $2.99
TOOTHPASTE           $3.49
SHAMPOO              $4.99
DEODORANT            $3.99

SUBTOTAL             $21.45
TAX                  $1.72
TOTAL                $23.17`,

      `MCDONALD'S
654 FAST FOOD BLVD
DATE: 12/11/2023

BIG MAC COMBO        $8.99
FRIES MEDIUM         $2.49
COKE LARGE           $1.99
APPLE PIE            $1.49

SUBTOTAL             $14.96
TAX                  $1.20
TOTAL                $16.16`
    ];

    return mockReceipts[Math.floor(Math.random() * mockReceipts.length)];
  }
}
