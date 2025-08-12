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

  static formatCurrency(amount: number, currency: string): string {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      // Fallback for unsupported currencies
      const symbols: Record<string, string> = {
        PKR: '₨',
        USD: '$',
        EUR: '€',
        GBP: '£',
        JPY: '¥',
        INR: '₹',
      };
      const symbol = symbols[currency] || currency;
      return `${symbol}${amount.toFixed(2)}`;
    }
  }
}