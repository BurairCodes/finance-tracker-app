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
      const fallbackRates: Record<string, number> = {};
      
      // Add all supported currencies with reasonable fallback rates
      const supportedCurrencies = ['PKR', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'];
      
      for (const currency of supportedCurrencies) {
        if (currency === baseCurrency) {
          fallbackRates[currency] = 1;
        } else {
          // Use approximate rates as fallback
          switch (currency) {
            case 'PKR': fallbackRates[currency] = baseCurrency === 'USD' ? 280 : 0.0036; break;
            case 'USD': fallbackRates[currency] = baseCurrency === 'PKR' ? 0.0036 : 1; break;
            case 'EUR': fallbackRates[currency] = 0.85; break;
            case 'GBP': fallbackRates[currency] = 0.73; break;
            case 'JPY': fallbackRates[currency] = 110; break;
            case 'CAD': fallbackRates[currency] = 1.35; break;
            case 'AUD': fallbackRates[currency] = 1.52; break;
            case 'CHF': fallbackRates[currency] = 0.92; break;
            case 'CNY': fallbackRates[currency] = 7.2; break;
            case 'INR': fallbackRates[currency] = 83; break;
            case 'BRL': fallbackRates[currency] = 5.2; break;
            default: fallbackRates[currency] = 1; break;
          }
        }
      }
      
      return {
        base: baseCurrency,
        date: new Date().toISOString().split('T')[0],
        rates: fallbackRates
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