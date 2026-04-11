import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface CoinData {
  usd: number;
  usd_24h_change: number;
}

export default function CryptoTicker() {
  const [prices, setPrices] = useState<Record<string, CoinData>>({});

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        // Using Binance API for better reliability and higher rate limits
        const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT'];
        const pricePromises = symbols.map(s => 
          fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${s}`).then(r => r.json())
        );
        
        const results = await Promise.all(pricePromises);
        const newPrices: Record<string, CoinData> = {};
        
        results.forEach(data => {
          const coinId = data.symbol.replace('USDT', '').toLowerCase();
          // Map binance symbols back to our coin IDs
          const idMap: Record<string, string> = {
            'btc': 'bitcoin',
            'eth': 'ethereum',
            'sol': 'solana',
            'bnb': 'binancecoin',
            'xrp': 'ripple',
            'ada': 'cardano'
          };
          
          if (idMap[coinId]) {
            newPrices[idMap[coinId]] = {
              usd: parseFloat(data.lastPrice),
              usd_24h_change: parseFloat(data.priceChangePercent)
            };
          }
        });
        
        setPrices(newPrices);
      } catch (error) {
        console.error('Failed to fetch crypto prices from Binance', error);
      }
    };
    
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const coins = [
    { id: 'bitcoin', symbol: 'BTC' },
    { id: 'ethereum', symbol: 'ETH' },
    { id: 'solana', symbol: 'SOL' },
    { id: 'binancecoin', symbol: 'BNB' },
    { id: 'ripple', symbol: 'XRP' },
    { id: 'cardano', symbol: 'ADA' },
  ];

  if (Object.keys(prices).length === 0) return null;

  // Tripling the array to ensure smooth infinite scrolling
  const displayCoins = [...coins, ...coins, ...coins];

  return (
    <div className="bg-gray-950 border-b border-gray-800 text-xs py-2.5 overflow-hidden whitespace-nowrap relative z-50" dir="ltr">
      <div className="animate-marquee inline-block">
        {displayCoins.map((coin, index) => {
          const data = prices[coin.id];
          if (!data) return null;
          const isPositive = data.usd_24h_change >= 0;
          
          return (
            <span key={`${coin.id}-${index}`} className="inline-flex items-center gap-2 mx-8 text-gray-300 font-medium font-mono cursor-default">
              <span className="text-gray-500 font-bold">{coin.symbol}</span>
              <span>${data.usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className={`inline-flex items-center ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {Math.abs(data.usd_24h_change).toFixed(2)}%
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
