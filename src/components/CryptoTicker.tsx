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
        // Try Binance API first
        const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT'];
        const pricePromises = symbols.map(s => 
          fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${s}`).then(r => {
            if (!r.ok) throw new Error('Binance response not ok');
            return r.json();
          })
        );
        
        const results = await Promise.all(pricePromises);
        const newPrices: Record<string, CoinData> = {};
        
        results.forEach(data => {
          const coinId = data.symbol.replace('USDT', '').toLowerCase();
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
        console.warn('Binance API failed, falling back to CoinGecko...', error);
        try {
          // Fallback to CoinGecko API if Binance is blocked (common in some regions/ISPs)
          const cgResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin,ripple,cardano&vs_currencies=usd&include_24hr_change=true');
          const cgData = await cgResponse.json();
          
          const newPrices: Record<string, CoinData> = {};
          Object.keys(cgData).forEach(coinId => {
            newPrices[coinId] = {
              usd: cgData[coinId].usd,
              usd_24h_change: cgData[coinId].usd_24h_change
            };
          });
          setPrices(newPrices);
        } catch (cgError) {
          console.error('Both Binance and CoinGecko APIs failed to fetch crypto prices', cgError);
        }
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
    <div className="bg-gray-100 dark:bg-gray-950 border-b border-gray-200 dark:border-yellow-500/10 text-xs py-3 overflow-hidden whitespace-nowrap relative z-50 transition-colors duration-300" dir="ltr">
      <div className="animate-marquee inline-block">
        {displayCoins.map((coin, index) => {
          const data = prices[coin.id];
          if (!data) return null;
          const isPositive = data.usd_24h_change >= 0;
          
          return (
            <span key={`${coin.id}-${index}`} className="inline-flex items-center gap-3 mx-10 text-gray-700 dark:text-gray-300 font-bold font-mono cursor-default group">
              <span className="text-yellow-600 dark:text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-md group-hover:bg-yellow-500 group-hover:text-gray-950 transition-colors">{coin.symbol}</span>
              <span className="text-gray-900 dark:text-white">${data.usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md ${isPositive ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
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
