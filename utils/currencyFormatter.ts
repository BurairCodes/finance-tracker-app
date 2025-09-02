import { CURRENCIES } from '@/constants/Categories';

export interface CurrencyFormatOptions {
  showSymbol?: boolean;
  showCode?: boolean;
  decimalPlaces?: number;
  useGrouping?: boolean;
}

export class CurrencyFormatter {
  private static readonly currencySymbols: Record<string, string> = {
    PKR: 'Rs.',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    INR: '₹',
    CAD: 'C$',
    AUD: 'A$',
    CHF: 'Fr',
    CNY: '¥',
    BRL: 'R$',
  };

  private static readonly currencyNames: Record<string, string> = {
    PKR: 'Pakistani Rupee',
    USD: 'US Dollar',
    EUR: 'Euro',
    GBP: 'British Pound',
    JPY: 'Japanese Yen',
    INR: 'Indian Rupee',
    CAD: 'Canadian Dollar',
    AUD: 'Australian Dollar',
    CHF: 'Swiss Franc',
    CNY: 'Chinese Yuan',
    BRL: 'Brazilian Real',
  };

  /**
   * Format a number with proper comma separators
   */
  private static formatNumberWithCommas(num: number, decimalPlaces: number = 2): string {
    try {
      // Handle very large numbers that might cause issues with toFixed
      if (num >= 1e15) {
        return num.toExponential(2);
      }

      // Convert to string with fixed decimal places
      const fixedNum = num.toFixed(decimalPlaces);
      
      // Split into integer and decimal parts
      const [integerPart, decimalPart] = fixedNum.split('.');
      
      // Add commas to integer part
      const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      
      // Return formatted number
      return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
    } catch (error) {
      console.error('Error formatting number with commas:', error);
      return num.toFixed(decimalPlaces);
    }
  }

  /**
   * Format currency amount with proper comma separators and currency symbol
   */
  static formatCurrency(
    amount: number, 
    currencyCode: string, 
    options: CurrencyFormatOptions = {}
  ): string {
    try {
      // Validate inputs
      if (typeof amount !== 'number' || isNaN(amount)) {
        console.warn('Invalid amount provided to formatCurrency:', amount);
        return '0.00';
      }
      
      if (typeof currencyCode !== 'string' || !currencyCode) {
        console.warn('Invalid currency provided to formatCurrency:', currencyCode);
        return '0.00';
      }

      // Default options
      const {
        showSymbol = true,
        showCode = false,
        decimalPlaces = 2,
        useGrouping = true
      } = options;

      // Get currency symbol
      const symbol = this.currencySymbols[currencyCode] || currencyCode;
      
      // Format the number
      let formattedAmount: string;
      if (useGrouping) {
        formattedAmount = this.formatNumberWithCommas(amount, decimalPlaces);
      } else {
        formattedAmount = amount.toFixed(decimalPlaces);
      }

      // Build the result string
      let result = '';
      
      if (showSymbol) {
        result += symbol;
      }
      
      result += formattedAmount;
      
      if (showCode && !showSymbol) {
        result += ` ${currencyCode}`;
      }

      return result;
    } catch (error) {
      console.error('Error in formatCurrency:', error);
      return '0.00';
    }
  }

  /**
   * Format currency for display with symbol (default behavior)
   */
  static formatDisplay(amount: number, currencyCode: string): string {
    return this.formatCurrency(amount, currencyCode, {
      showSymbol: true,
      showCode: false,
      decimalPlaces: 2,
      useGrouping: true
    });
  }

  /**
   * Format currency for input fields (no symbol, with grouping)
   */
  static formatInput(amount: number, currencyCode: string): string {
    return this.formatCurrency(amount, currencyCode, {
      showSymbol: false,
      showCode: false,
      decimalPlaces: 2,
      useGrouping: true
    });
  }

  /**
   * Format currency for compact display (no decimals for whole numbers)
   */
  static formatCompact(amount: number, currencyCode: string): string {
    const decimalPlaces = amount % 1 === 0 ? 0 : 2;
    return this.formatCurrency(amount, currencyCode, {
      showSymbol: true,
      showCode: false,
      decimalPlaces,
      useGrouping: true
    });
  }

  /**
   * Format currency for detailed display (with currency code)
   */
  static formatDetailed(amount: number, currencyCode: string): string {
    return this.formatCurrency(amount, currencyCode, {
      showSymbol: true,
      showCode: true,
      decimalPlaces: 2,
      useGrouping: true
    });
  }

  /**
   * Get currency symbol
   */
  static getSymbol(currencyCode: string): string {
    return this.currencySymbols[currencyCode] || currencyCode;
  }

  /**
   * Get currency name
   */
  static getName(currencyCode: string): string {
    return this.currencyNames[currencyCode] || currencyCode;
  }

  /**
   * Parse formatted currency string back to number
   */
  static parseFormatted(formattedString: string, currencyCode: string): number {
    try {
      // Remove currency symbol and any non-numeric characters except decimal point
      const symbol = this.getSymbol(currencyCode);
      let cleaned = formattedString.replace(symbol, '').trim();
      
      // Remove commas
      cleaned = cleaned.replace(/,/g, '');
      
      // Parse to number
      const parsed = parseFloat(cleaned);
      
      if (isNaN(parsed)) {
        throw new Error('Invalid number format');
      }
      
      return parsed;
    } catch (error) {
      console.error('Error parsing formatted currency:', error);
      return 0;
    }
  }

  /**
   * Validate if a string is a valid formatted currency
   */
  static isValidFormatted(formattedString: string, currencyCode: string): boolean {
    try {
      const parsed = this.parseFormatted(formattedString, currencyCode);
      return parsed > 0 && !isNaN(parsed);
    } catch {
      return false;
    }
  }
}
