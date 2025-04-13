import type { PriceData, ProviderConfig } from "../../types";
import { ProviderError } from "../../core/errors";

/**
 * Abstract base class for all price providers
 * Defines the common interface that all providers must implement
 */
export abstract class BaseProvider {
  protected config: ProviderConfig;
  protected name: string;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.name = this.constructor.name;
  }

  /**
   * Get the current price for a given symbol
   * @param symbol - The trading pair symbol (e.g., 'BTC/USD')
   * @returns Promise<PriceData>
   */
  abstract getPrice(symbol: string): Promise<PriceData>;

  /**
   * Check if the provider is healthy and available
   * @returns Promise<boolean>
   */
  abstract healthCheck(): Promise<boolean>;

  /**
   * Get provider name
   * @returns string
   */
  getName(): string {
    return this.name;
  }

  /**
   * Handle provider-specific errors
   * @param error - The error to handle
   * @throws ProviderError
   */
  protected handleError(error: unknown): never {
    throw new ProviderError(
      `Error in ${this.name}: ${
        error instanceof Error ? error.message : String(error)
      }`,
      this.name
    );
  }
}
