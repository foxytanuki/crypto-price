import axios from "axios";
import { BaseProvider } from "./BaseProvider";
import type { PriceData, ProviderConfig } from "../types";

/**
 * Provider implementation for CoinGecko API
 */
export class CoinGeckoProvider extends BaseProvider {
  private readonly baseUrl: string;

  constructor(config: ProviderConfig) {
    super(config);
    this.baseUrl = config.baseUrl || "https://api.coingecko.com/api/v3";
    this.name = "CoinGecko";
  }

  /**
   * Get the current price for a given symbol
   * @param symbol - The trading pair symbol (e.g., 'BTC/USD')
   * @returns Promise<PriceData>
   */
  async getPrice(symbol: string): Promise<PriceData> {
    try {
      const [base, quote] = symbol.split("/");
      const response = await axios.get(
        `${
          this.baseUrl
        }/simple/price?ids=${base.toLowerCase()}&vs_currencies=${quote.toLowerCase()}`
      );

      const price = response.data[base.toLowerCase()]?.[quote.toLowerCase()];
      if (price === undefined) {
        throw new Error(`Price not found for ${symbol}`);
      }

      return {
        symbol,
        price,
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Check if the provider is healthy and available
   * @returns Promise<boolean>
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/ping`);
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}
