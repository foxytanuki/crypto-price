import { CoingeckoProvider } from "../../src/providers/CoinGeckoProvider";
import axios from "axios";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("CoingeckoProvider", () => {
  let provider: CoingeckoProvider;
  const mockConfig = { baseUrl: "https://api.coingecko.com/api/v3" };

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new CoingeckoProvider(mockConfig);
  });

  describe("constructor", () => {
    it("should initialize with default baseUrl when not provided", () => {
      const defaultProvider = new CoingeckoProvider({});
      expect(defaultProvider).toBeInstanceOf(CoingeckoProvider);
    });

    it("should initialize with provided baseUrl", () => {
      expect(provider).toBeInstanceOf(CoingeckoProvider);
    });
  });

  describe("getPrice", () => {
    it("should return price data for valid symbol", async () => {
      const mockResponse = {
        data: {
          bitcoin: {
            usd: 50000,
          },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await provider.getPrice("bitcoin/usd");

      expect(result).toEqual({
        symbol: "bitcoin/usd",
        price: 50000,
        timestamp: expect.any(Number),
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
      );
    });

    it("should throw error for invalid symbol format", async () => {
      await expect(provider.getPrice("BTC")).rejects.toThrow();
    });

    it("should throw error when price is not found", async () => {
      const mockResponse = {
        data: {
          bitcoin: {
            // No price data
          },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      await expect(provider.getPrice("BTC/USD")).rejects.toThrow(
        "Price not found for BTC/USD"
      );
    });

    it("should handle API errors", async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error("API Error"));

      await expect(provider.getPrice("BTC/USD")).rejects.toThrow("API Error");
    });
  });

  describe("healthCheck", () => {
    it("should return true when API is healthy", async () => {
      mockedAxios.get.mockResolvedValueOnce({ status: 200 });

      const result = await provider.healthCheck();
      expect(result).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://api.coingecko.com/api/v3/ping"
      );
    });

    it("should return false when API is not healthy", async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error("API Error"));

      const result = await provider.healthCheck();
      expect(result).toBe(false);
    });
  });
});
