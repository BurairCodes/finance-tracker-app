import { CurrencyFormatter } from './currencyFormatter';

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
    return CurrencyFormatter.formatDisplay(amount, currency);
  }
}