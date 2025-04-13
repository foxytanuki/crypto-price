/**
 * Price data structure returned by providers
 */
export interface PriceData {
  symbol: string; // The trading pair symbol (e.g., 'BTC/USD')
  price: number; // The current price of the trading pair
  timestamp: number; // The timestamp of the price data
}

/**
 * Configuration options for providers
 */
export interface ProviderConfig {
  baseUrl?: string; // The base URL for the provider
  apiKey?: string; // The API key for the provider
}
