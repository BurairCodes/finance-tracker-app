import { CURRENCIES } from '@/constants/Categories';
import { ValidationUtils } from '@/utils/validation';

interface ExchangeRateResponse {
  base: string;
  date: string;
  rates: Record<string, number>;
}

const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes
let rateCache: { [key: string]: { data: ExchangeRateResponse; timestamp: number } } = {};

export class ExchangeRateService {
  private static readonly BASE_URL = 'https://api.exchangerate-api.com/v4/latest';

  static async getExchangeRates(baseCurrency: string = 'USD'): Promise<ExchangeRateResponse | null> {
    try {
      const cacheKey = baseCurrency;
      const now = Date.now();
      
      // Check cache first
      if (rateCache[cacheKey] && (now - rateCache[cacheKey].timestamp) < CACHE_DURATION) {
        return rateCache[cacheKey].data;
      }

      const response = await fetch(`${this.BASE_URL}/${baseCurrency}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ExchangeRateResponse = await response.json();
      
      // Cache the result
      rateCache[cacheKey] = {
        data,
        timestamp: now
      };
      
      return data;
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      // Return fallback rates if API fails
      return {
        base: baseCurrency,
        date: new Date().toISOString().split('T')[0],
        rates: { 
          PKR: baseCurrency === 'PKR' ? 1 : 280,
          USD: baseCurrency === 'USD' ? 1 : 0.0036,
          EUR: 0.85, 
          GBP: 0.73, 
          JPY: 110 
        }
      };
    }
  }

  static async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    if (fromCurrency === toCurrency) return amount;

    try {
      const rates = await this.getExchangeRates(fromCurrency);
      if (!rates || !rates.rates[toCurrency]) {
        return amount; // Return original amount if conversion fails
      }
      
      return amount * rates.rates[toCurrency];
    } catch (error) {
      console.error('Currency conversion error:', error);
      return amount;
    }
  }

  static getCurrencySymbol(currencyCode: string): string {
    const currency = CURRENCIES.find(c => c.code === currencyCode);
    return currency?.symbol || currencyCode;
  }

  static formatCurrency(amount: number, currencyCode: string): string {
    return ValidationUtils.formatCurrency(amount, currencyCode);
  }
}