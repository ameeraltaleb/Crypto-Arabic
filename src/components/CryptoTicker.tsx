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
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin,ripple,cardano&vs_currencies=usd&include_24hr_change=true');
        const data = await res.json();
        setPrices(data);
      } catch (error) {
        console.error('Failed to fetch crypto prices', error);
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
