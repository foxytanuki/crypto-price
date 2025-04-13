import { createPublicClient, http, type PublicClient } from "viem";
import { mainnet } from "viem/chains";
import { BaseProvider } from "./BaseProvider";
import type { PriceData, ProviderConfig } from "../types";

// Chainlink ETH/USD Price Feed contract address on Ethereum Mainnet
const ETH_USD_PRICE_FEED = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";

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
   * Get the current price for ETH/USD
   * @param symbol - The trading pair symbol (must be 'ETH/USD')
   * @returns Promise<PriceData>
   */
  async getPrice(symbol: string): Promise<PriceData> {
    try {
      if (symbol !== "ETH/USD") {
        throw new Error("ChainlinkProvider only supports ETH/USD");
      }

      const [roundId, answer, startedAt, updatedAt, answeredInRound] =
        await this.client.readContract({
          address: ETH_USD_PRICE_FEED as `0x${string}`,
          abi: PRICE_FEED_ABI,
          functionName: "latestRoundData",
        });

      // Chainlink uses 8 decimals for USD pairs
      const price = Number(answer) / 10 ** 8;

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
}
