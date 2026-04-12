import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { TrendingUp, TrendingDown, RefreshCw, DollarSign, Activity, BarChart3 } from 'lucide-react';

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_7d_in_currency?: number;
}

export default function Market() {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMarketData = async () => {
    setIsRefreshing(true);
    try {
      // Using CoinGecko API for comprehensive market data
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=1h,24h,7d'
      );
      if (!response.ok) throw new Error('Failed to fetch market data');
      const data = await response.json();
      setCoins(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMarketData();

    // Auto update every 15 minutes (15 * 60 * 1000 ms)
    const interval = setInterval(fetchMarketData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const formatPercentage = (value?: number) => {
    if (value === undefined || value === null) return '0.00%';
    const formatted = Math.abs(value).toFixed(2) + '%';
    return value >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  return (
    <div className="min-h-screen bg-gray-950 py-12 relative">
      <Helmet>
        <title>أسعار العملات الرقمية | كريبتو بالعربي</title>
        <meta name="description" content="تابع أسعار العملات الرقمية لحظة بلحظة، القيمة السوقية، وحجم التداول لأهم العملات المشفرة." />
      </Helmet>

      {/* Background Aesthetics */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, rgba(0,0,0,0) 70%)' }}></div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 bg-gray-900/40 backdrop-blur-sm p-8 rounded-[2rem] border border-gray-800/60 shadow-2xl">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-500/10 p-3 rounded-xl">
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white">أسعار السوق المباشرة</h1>
            </div>
            <p className="text-gray-400 text-lg max-w-2xl">
              تابع تحركات السوق، القيمة السوقية، وحجم التداول لأكبر 50 عملة رقمية. يتم التحديث تلقائياً كل 15 دقيقة.
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-2 text-sm font-medium bg-gray-950/50 px-4 py-2 rounded-full border border-gray-800">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-gray-300">
                آخر تحديث: {format(lastUpdated, 'hh:mm:ss a', { locale: ar })}
              </span>
            </div>
            <button 
              onClick={fetchMarketData}
              disabled={isRefreshing}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              تحديث الآن
            </button>
          </div>
        </div>

        {/* Market Table */}
        <div className="bg-gray-900/40 backdrop-blur-sm rounded-[2rem] border border-gray-800/60 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-gray-950/50 border-b border-gray-800/60 text-gray-400 text-sm">
                  <th className="p-5 font-bold w-16 text-center">#</th>
                  <th className="p-5 font-bold">العملة</th>
                  <th className="p-5 font-bold">السعر</th>
                  <th className="p-5 font-bold">تغير (1 س)</th>
                  <th className="p-5 font-bold">تغير (24 س)</th>
                  <th className="p-5 font-bold">تغير (7 أ)</th>
                  <th className="p-5 font-bold hidden md:table-cell">حجم التداول (24س)</th>
                  <th className="p-5 font-bold hidden lg:table-cell">القيمة السوقية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="p-5"><div className="h-4 bg-gray-800 rounded w-4 mx-auto"></div></td>
                      <td className="p-5"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-gray-800 rounded-full"></div><div className="h-4 bg-gray-800 rounded w-24"></div></div></td>
                      <td className="p-5"><div className="h-4 bg-gray-800 rounded w-20"></div></td>
                      <td className="p-5"><div className="h-4 bg-gray-800 rounded w-16"></div></td>
                      <td className="p-5"><div className="h-4 bg-gray-800 rounded w-16"></div></td>
                      <td className="p-5"><div className="h-4 bg-gray-800 rounded w-16"></div></td>
                      <td className="p-5 hidden md:table-cell"><div className="h-4 bg-gray-800 rounded w-24"></div></td>
                      <td className="p-5 hidden lg:table-cell"><div className="h-4 bg-gray-800 rounded w-24"></div></td>
                    </tr>
                  ))
                ) : (
                  coins.map((coin) => (
                    <tr key={coin.id} className="hover:bg-gray-800/20 transition-colors group">
                      <td className="p-5 text-gray-500 font-medium text-center">{coin.market_cap_rank}</td>
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full shadow-lg" />
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-100">{coin.name}</span>
                            <span className="text-xs text-gray-500 uppercase font-medium">{coin.symbol}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-5 font-bold text-white tracking-wide">
                        {formatCurrency(coin.current_price)}
                      </td>
                      <td className="p-5 font-medium">
                        <div className={`flex items-center justify-end gap-1 ${
                          (coin.price_change_percentage_1h_in_currency || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {(coin.price_change_percentage_1h_in_currency || 0) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          <span dir="ltr">{formatPercentage(coin.price_change_percentage_1h_in_currency)}</span>
                        </div>
                      </td>
                      <td className="p-5 font-bold">
                        <div className={`flex items-center justify-end gap-1 ${
                          coin.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {coin.price_change_percentage_24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          <span dir="ltr">{formatPercentage(coin.price_change_percentage_24h)}</span>
                        </div>
                      </td>
                      <td className="p-5 font-medium">
                        <div className={`flex items-center justify-end gap-1 ${
                          (coin.price_change_percentage_7d_in_currency || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {(coin.price_change_percentage_7d_in_currency || 0) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          <span dir="ltr">{formatPercentage(coin.price_change_percentage_7d_in_currency)}</span>
                        </div>
                      </td>
                      <td className="p-5 text-gray-300 font-medium hidden md:table-cell tracking-wide">
                        {formatCurrency(coin.total_volume)}
                      </td>
                      <td className="p-5 text-gray-300 font-medium hidden lg:table-cell tracking-wide">
                        {formatCurrency(coin.market_cap)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
    </div>
  );
}
