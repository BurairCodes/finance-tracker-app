export class ValidationUtils {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPassword(password: string): boolean {
    // At least 6 characters
    return password.length >= 6;
  }

  static isValidAmount(amount: string): boolean {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
  }

  static isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  static sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  static isValidCurrency(currency: string): boolean {
    const validCurrencies = ['PKR', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'];
    return validCurrencies.includes(currency);
  }

  static formatCurrency(amount: number, currency: string): string {
    try {
      // Validate inputs
      if (typeof amount !== 'number' || isNaN(amount)) {
        console.warn('Invalid amount provided to formatCurrency:', amount);
        return '0.00';
      }
      
      if (typeof currency !== 'string' || !currency) {
        console.warn('Invalid currency provided to formatCurrency:', currency);
        return '0.00';
      }

      // Always use fallback to avoid Intl.NumberFormat issues in React Native
      const symbols: Record<string, string> = {
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
      
      const symbol = symbols[currency] || currency;
      const formattedAmount = amount.toFixed(2);
      
      // Ensure we return a valid string
      const result = `${symbol}${formattedAmount}`;
      
      // Additional validation to ensure the result is a valid string
      if (typeof result !== 'string' || result.length === 0) {
        console.warn('formatCurrency returned invalid result:', result);
        return '0.00';
      }
      
      return result;
    } catch (error) {
      console.error('Error in formatCurrency:', error);
      return '0.00';
    }
  }
}