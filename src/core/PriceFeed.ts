import type { BaseProvider } from "../providers/BaseProvider";
import type { PriceData } from "../types";
import { ProviderError } from "./errors";

/**
 * Main class for managing multiple price providers and implementing failover logic
 */
export class PriceFeed {
  private providers: BaseProvider[] = [];
  private activeProvider: BaseProvider | null = null;

  private constructor(providers: BaseProvider[]) {
    if (providers.length === 0) {
      throw new Error("At least one provider must be specified");
    }
    this.providers = providers;
  }

  /**
   * Factory method to create and initialize a PriceFeed instance
   * @param providers - Array of price providers
   * @returns Promise<PriceFeed>
   */
  static async create(providers: BaseProvider[]): Promise<PriceFeed> {
    const instance = new PriceFeed(providers);
    await instance.initializeProviders();
    return instance;
  }

  /**
   * Initialize providers and set the first healthy provider as active
   */
  private async initializeProviders(): Promise<void> {
    for (const provider of this.providers) {
      try {
        const isHealthy = await provider.healthCheck();
        if (isHealthy && !this.activeProvider) {
          this.activeProvider = provider;
        }
      } catch (error) {
        throw new ProviderError(
          `Failed to initialize provider ${provider.getName()}: ${error}`,
          provider.getName()
        );
      }
    }

    if (!this.activeProvider) {
      throw new Error("No healthy providers available");
    }
  }

  /**
   * Get current price from the active provider
   * @param symbol - Trading pair symbol
   * @returns Promise<PriceData>
   */
  async getPrice(symbol: string): Promise<PriceData> {
    if (!this.activeProvider) {
      throw new Error("No active provider available");
    }

    try {
      return await this.activeProvider.getPrice(symbol);
    } catch (error) {
      await this.handleProviderFailure();
      return this.getPrice(symbol); // Retry with new active provider
    }
  }

  /**
   * Handle provider failure by switching to a healthy provider
   */
  private async handleProviderFailure(): Promise<void> {
    const currentProvider = this.activeProvider;
    this.activeProvider = null;

    for (const provider of this.providers) {
      if (provider === currentProvider) continue;

      const isHealthy = await provider.healthCheck();
      if (isHealthy) {
        this.activeProvider = provider;
        break;
      }
    }

    if (!this.activeProvider) {
      throw new Error("No healthy providers available after failover");
    }
  }

  /**
   * Get the currently active provider
   * @returns BaseProvider | null
   */
  getActiveProvider(): BaseProvider | null {
    return this.activeProvider;
  }
}
