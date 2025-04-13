import { ChainlinkProvider } from "../../src/providers/ChainlinkProvider";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

// Mock viem
jest.mock("viem", () => {
  const mockHttp = jest.fn(() => "http-transport");
  return {
    createPublicClient: jest.fn(() => ({
      readContract: jest.fn(),
      getChainId: jest.fn(),
    })),
    http: mockHttp,
    mainnet: { id: 1 },
  };
});

const mockReadContract = jest.fn();
const mockGetChainId = jest.fn();

describe("ChainlinkProvider", () => {
  let provider: ChainlinkProvider;
  const mockConfig = { baseUrl: "https://ethereum-rpc.publicnode.com" };

  beforeEach(() => {
    jest.clearAllMocks();
    (createPublicClient as jest.Mock).mockImplementation(() => ({
      readContract: mockReadContract,
      getChainId: mockGetChainId,
    }));
    provider = new ChainlinkProvider(mockConfig);
  });

  describe("constructor", () => {
    it("should initialize with provided config", () => {
      expect(provider).toBeInstanceOf(ChainlinkProvider);
      expect(http).toHaveBeenCalledWith(mockConfig.baseUrl);
      expect(createPublicClient).toHaveBeenCalledWith({
        chain: mainnet,
        transport: "http-transport",
      });
    });

    it("should throw error when RPC URL is not provided", () => {
      expect(() => new ChainlinkProvider({})).toThrow(
        "RPC URL is required for ChainlinkProvider"
      );
    });
  });

  describe("getPrice", () => {
    it("should return price data for ETH/USD", async () => {
      mockReadContract.mockResolvedValueOnce([
        BigInt(1), // roundId
        BigInt(300000000000), // answer (3000.00000000)
        BigInt(1234567890), // startedAt
        BigInt(1234567890), // updatedAt
        BigInt(1), // answeredInRound
      ]);

      const result = await provider.getPrice("ETH/USD");

      expect(result).toEqual({
        symbol: "ETH/USD",
        price: 3000,
        timestamp: expect.any(Number),
      });

      expect(mockReadContract).toHaveBeenCalledWith({
        address: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
        abi: expect.any(Array),
        functionName: "latestRoundData",
      });
    });

    it("should throw error for unsupported symbol", async () => {
      await expect(provider.getPrice("BTC/USD")).rejects.toThrow(
        "ChainlinkProvider only supports ETH/USD"
      );
    });

    it("should handle contract read errors", async () => {
      mockReadContract.mockRejectedValueOnce(new Error("Contract read error"));

      await expect(provider.getPrice("ETH/USD")).rejects.toThrow(
        "Error in Chainlink: Contract read error"
      );
    });
  });

  describe("healthCheck", () => {
    it("should return true when RPC is healthy", async () => {
      mockGetChainId.mockResolvedValueOnce(1);

      const result = await provider.healthCheck();
      expect(result).toBe(true);
    });

    it("should return false when RPC is not healthy", async () => {
      mockGetChainId.mockRejectedValueOnce(new Error("RPC error"));

      const result = await provider.healthCheck();
      expect(result).toBe(false);
    });
  });
});
