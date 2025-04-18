import { useState, useEffect } from "react";
import { PriceFeed, ChainlinkProvider } from "@foxytanuki/crypto-price";
import "./App.css";

function App() {
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [jpyPrice, setJpyPrice] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const provider = new ChainlinkProvider({});
        const cryptoPrice = await PriceFeed.create([provider]);
        const priceData = await cryptoPrice.getPrice("ETH/USD");
        setEthPrice(priceData.price);
        const priceDataBTC = await cryptoPrice.getPrice("BTC/USD");
        setBtcPrice(priceDataBTC.price);
        const priceDataJPY = await cryptoPrice.getPrice("JPY/USD");
        setJpyPrice(priceDataJPY.price);
        setError(null);
      } catch (err) {
        console.error("Error fetching price:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        setEthPrice(null);
      }
    };

    fetchPrice();
  }, []);

  return (
    <div>
      <h2>Crypto Price Example</h2>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {ethPrice !== null ? (
        <p>ETH Price (USD): ${ethPrice}</p>
      ) : (
        <p>Loading price...</p>
      )}
      {btcPrice !== null ? (
        <p>BTC Price (USD): ${btcPrice}</p>
      ) : (
        <p>Loading price...</p>
      )}
      {jpyPrice !== null ? (
        <p>
          USD Price (JPY):¥{1 / jpyPrice}
          <br />
          JPY Price (USD):${jpyPrice}
        </p>
      ) : (
        <p>Loading price...</p>
      )}
    </div>
  );
}

export default App;
