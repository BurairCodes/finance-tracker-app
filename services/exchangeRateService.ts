import { CURRENCIES } from '@/constants/Categories';
import { CurrencyFormatter } from '@/utils/currencyFormatter';
import { ValidationUtils } from '@/utils/validation';

interface ExchangeRateResponse {
  base: string;
  date: string;
  rates: Record<string, number>;
}

const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes
let rateCache: { [key: string]: { data: ExchangeRateResponse; timestamp: number } } = {};

export class ExchangeRateService {
  // Multiple API endpoints for redundancy
  private static readonly API_ENDPOINTS = [
    {
      name: 'ExchangeRate-API (Primary with Key)',
      url: 'https://api.exchangerate-api.com/v4/latest',
      requiresKey: true,
      key: process.env.EXPO_PUBLIC_EXCHANGE_RATE_API_KEY,
      priority: 1
    },
    {
      name: 'ExchangeRate-API (Free Tier)',
      url: 'https://api.exchangerate-api.com/v4/latest',
      requiresKey: false,
      key: null,
      priority: 2
    },
    {
      name: 'Fixer.io (Alternative)',
      url: 'https://api.fixer.io/latest',
      requiresKey: false,
      key: null,
      priority: 3
    }
  ];
  

  static async getExchangeRates(baseCurrency: string = 'USD'): Promise<ExchangeRateResponse | null> {
    try {
      const cacheKey = baseCurrency;
      const now = Date.now();
      
      // Check cache first
      if (rateCache[cacheKey] && (now - rateCache[cacheKey].timestamp) < CACHE_DURATION) {
        console.log(`📊 Using cached exchange rates for ${baseCurrency}`);
        return rateCache[cacheKey].data;
      }

      console.log(`🔄 Fetching fresh exchange rates for ${baseCurrency}...`);

      // Try each API endpoint in priority order
      for (const endpoint of this.API_ENDPOINTS) {
        try {
          console.log(`🌐 Trying ${endpoint.name}...`);
          
          let apiUrl = `${endpoint.url}/${baseCurrency}`;
          let headers: Record<string, string> = {};
          
          // Add API key if required and available
          if (endpoint.requiresKey && endpoint.key) {
            apiUrl += `?api_key=${endpoint.key}`;
            console.log(`🔑 Using API key for ${endpoint.name}`);
          } else if (endpoint.requiresKey && !endpoint.key) {
            console.log(`⚠️ API key required but not available for ${endpoint.name}, skipping...`);
            continue;
          }

          const response = await fetch(apiUrl, { headers });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data: ExchangeRateResponse = await response.json();
          
          // Validate response data
          if (!data.rates || Object.keys(data.rates).length === 0) {
            throw new Error('Invalid response: no rates data');
          }
          
          console.log(`✅ Successfully fetched rates from ${endpoint.name}`);
          console.log(`📊 Got ${Object.keys(data.rates).length} currency rates`);
          
          // Cache the result
          rateCache[cacheKey] = {
            data,
            timestamp: now
          };
          
          return data;
          
        } catch (error) {
          console.error(`❌ Failed to fetch from ${endpoint.name}:`, error);
          // Continue to next endpoint
          continue;
        }
      }
      
      // If all APIs fail, throw error to trigger fallback
      throw new Error('All exchange rate APIs failed');
      
    } catch (error) {
      console.error('🚨 All exchange rate APIs failed, using fallback rates:', error);
      return this.getFallbackRates(baseCurrency);
    }
  }

  private static getFallbackRates(baseCurrency: string): ExchangeRateResponse {
    console.log(`🔄 Generating fallback rates for ${baseCurrency}`);
    
    const fallbackRates: Record<string, number> = {};
    
    // Add all supported currencies with reasonable fallback rates
    const supportedCurrencies = ['PKR', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'];
    
    for (const currency of supportedCurrencies) {
      if (currency === baseCurrency) {
        fallbackRates[currency] = 1;
      } else {
        // Use approximate rates as fallback (updated with more recent values)
        switch (currency) {
          case 'PKR': 
            fallbackRates[currency] = baseCurrency === 'USD' ? 280 : 
                                    baseCurrency === 'EUR' ? 330 : 
                                    baseCurrency === 'GBP' ? 383 : 0.0036; 
            break;
          case 'USD': 
            fallbackRates[currency] = baseCurrency === 'PKR' ? 0.0036 : 
                                    baseCurrency === 'EUR' ? 0.85 : 
                                    baseCurrency === 'GBP' ? 0.73 : 1; 
            break;
          case 'EUR': 
            fallbackRates[currency] = baseCurrency === 'USD' ? 1.18 : 
                                    baseCurrency === 'PKR' ? 0.003 : 
                                    baseCurrency === 'GBP' ? 0.86 : 0.85; 
            break;
          case 'GBP': 
            fallbackRates[currency] = baseCurrency === 'USD' ? 1.37 : 
                                    baseCurrency === 'PKR' ? 0.0026 : 
                                    baseCurrency === 'EUR' ? 1.16 : 0.73; 
            break;
          case 'JPY': 
            fallbackRates[currency] = baseCurrency === 'USD' ? 0.0067 : 
                                    baseCurrency === 'PKR' ? 0.54 : 
                                    baseCurrency === 'EUR' ? 0.0057 : 110; 
            break;
          case 'CAD': 
            fallbackRates[currency] = baseCurrency === 'USD' ? 1.35 : 
                                    baseCurrency === 'PKR' ? 0.0048 : 
                                    baseCurrency === 'EUR' ? 1.59 : 1.35; 
            break;
          case 'AUD': 
            fallbackRates[currency] = baseCurrency === 'USD' ? 1.52 : 
                                    baseCurrency === 'PKR' ? 0.0054 : 
                                    baseCurrency === 'EUR' ? 1.79 : 1.52; 
            break;
          case 'CHF': 
            fallbackRates[currency] = baseCurrency === 'USD' ? 0.92 : 
                                    baseCurrency === 'PKR' ? 0.0033 : 
                                    baseCurrency === 'EUR' ? 1.08 : 0.92; 
            break;
          case 'CNY': 
            fallbackRates[currency] = baseCurrency === 'USD' ? 7.2 : 
                                    baseCurrency === 'PKR' ? 0.026 : 
                                    baseCurrency === 'EUR' ? 8.5 : 7.2; 
            break;
          case 'INR': 
            fallbackRates[currency] = baseCurrency === 'USD' ? 83 : 
                                    baseCurrency === 'PKR' ? 0.3 : 
                                    baseCurrency === 'EUR' ? 98 : 83; 
            break;
          case 'BRL': 
            fallbackRates[currency] = baseCurrency === 'USD' ? 5.2 : 
                                    baseCurrency === 'PKR' ? 0.019 : 
                                    baseCurrency === 'EUR' ? 6.1 : 5.2; 
            break;
          default: 
            fallbackRates[currency] = 1; 
            break;
        }
      }
    }
    
    console.log(`📊 Generated ${Object.keys(fallbackRates).length} fallback rates for ${baseCurrency}`);
    
    return {
      base: baseCurrency,
      date: new Date().toISOString().split('T')[0],
      rates: fallbackRates
    };
  }

  static async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    if (fromCurrency === toCurrency) return amount;

    try {
      console.log(`💱 Converting ${amount} from ${fromCurrency} to ${toCurrency}`);
      
      const rates = await this.getExchangeRates(fromCurrency);
      if (!rates || !rates.rates[toCurrency]) {
        console.warn(`⚠️ No conversion rate found from ${fromCurrency} to ${toCurrency}`);
        return amount; // Return original amount if conversion fails
      }
      
      const convertedAmount = amount * rates.rates[toCurrency];
      console.log(`✅ Converted: ${amount} ${fromCurrency} = ${convertedAmount} ${toCurrency}`);
      
      return convertedAmount;
    } catch (error) {
      console.error(`❌ Currency conversion error from ${fromCurrency} to ${toCurrency}:`, error);
      return amount;
    }
  }

  static getCurrencySymbol(currencyCode: string): string {
    const currency = CURRENCIES.find(c => c.code === currencyCode);
    return currency?.symbol || currencyCode;
  }

  static formatCurrency(amount: number, currencyCode: string): string {
    return CurrencyFormatter.formatDisplay(amount, currencyCode);
  }

  // New method to check API status
  static async checkAPIStatus(): Promise<{
    status: 'operational' | 'warning' | 'error';
    message: string;
    lastUpdate: string;
  }> {
    try {
      const rates = await this.getExchangeRates('USD');
      if (rates && Object.keys(rates.rates).length > 0) {
        return {
          status: 'operational',
          message: 'Exchange rate API is working normally',
          lastUpdate: rates.date
        };
      } else {
        return {
          status: 'warning',
          message: 'Using fallback rates - API may be experiencing issues',
          lastUpdate: new Date().toISOString().split('T')[0]
        };
      }
    } catch (error) {
      return {
        status: 'error',
        message: 'Exchange rate service is down - using fallback rates',
        lastUpdate: new Date().toISOString().split('T')[0]
      };
    }
  }

  // Method to clear cache (useful for testing or force refresh)
  static clearCache(): void {
    rateCache = {};
    console.log('🗑️ Exchange rate cache cleared');
  }

  // Method to get cache info
  static getCacheInfo(): {
    cachedCurrencies: string[];
    cacheSize: number;
    oldestEntry: string | null;
  } {
    const cachedCurrencies = Object.keys(rateCache);
    const timestamps = Object.values(rateCache).map(entry => entry.timestamp);
    const oldestTimestamp = timestamps.length > 0 ? Math.min(...timestamps) : null;
    
    return {
      cachedCurrencies,
      cacheSize: cachedCurrencies.length,
      oldestEntry: oldestTimestamp ? new Date(oldestTimestamp).toISOString() : null
    };
  }
}