import { createPublicClient, http, type PublicClient } from "viem";
import { mainnet } from "viem/chains";
import { BaseProvider } from "./BaseProvider";
import type { PriceData, ProviderConfig } from "../types";

// Chainlink Price Feed contract addresses on Ethereum Mainnet
const PRICE_FEED_ADDRESSES: Record<string, `0x${string}`> = {
  "ETH/USD": "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
  "BTC/USD": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
  "JPY/USD": "0xBcE206caE7f0ec07b545EddE332A47C2F75bbeb3",
};

// Chainlink uses 8 decimals for USD pairs
const USD_DECIMALS = 8;

// ABI for Chainlink Price Feed
const PRICE_FEED_ABI = [
  {
    inputs: [],
    name: "latestRoundData",
    outputs: [
      { name: "roundId", type: "uint80" },
      { name: "answer", type: "int256" },
      { name: "startedAt", type: "uint256" },
      { name: "updatedAt", type: "uint256" },
      { name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Provider implementation for Chainlink Price Feed
 */
export class ChainlinkProvider extends BaseProvider {
  private client: PublicClient;

  constructor(config: ProviderConfig) {
    super(config);
    this.name = "Chainlink";

    if (!config.baseUrl) {
      config.baseUrl = mainnet.rpcUrls.default.http[0];
    }

    this.client = createPublicClient({
      chain: mainnet,
      transport: http(config.baseUrl),
    });
  }

  /**
   * Get the current price for a supported symbol
   * @param symbol - The trading pair symbol (e.g., 'ETH/USD', 'BTC/USD')
   * @returns Promise<PriceData>
   */
  async getPrice(symbol: string): Promise<PriceData> {
    try {
      const feedAddress = PRICE_FEED_ADDRESSES[symbol];
      if (!feedAddress) {
        throw new Error(
          `ChainlinkProvider does not support the symbol: ${symbol}`
        );
      }

      const [roundId, answer, startedAt, updatedAt, answeredInRound] =
        await this.client.readContract({
          address: feedAddress,
          abi: PRICE_FEED_ABI,
          functionName: "latestRoundData",
        });

      // Adjust the price based on the decimals
      const price = Number(answer) / 10 ** USD_DECIMALS;

      return {
        symbol,
        price,
        timestamp: Math.floor(Date.now() / 1000), // Unix timestamp in seconds
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
      await this.client.getChainId();
      return true;
    } catch (error) {
      throw new Error("ChainlinkProvider health check failed");
    }
  }

  // Assume handleError is defined in BaseProvider or needs implementation
  // protected handleError(error: unknown): PriceData {
  //   console.error(`${this.name} provider error:`, error);
  //   // Return a default error structure or re-throw
  //   throw error; // Or return a specific error object/PriceData
  // }
}
