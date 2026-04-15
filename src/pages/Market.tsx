import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { TrendingUp, TrendingDown, RefreshCw, DollarSign, Activity, BarChart3, Clock, BookOpen, ChevronLeft, LineChart } from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import TradingViewWidget from '../components/TradingViewWidget';
import TechnicalAnalysisWidget from '../components/TechnicalAnalysisWidget';

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

interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  image_url: string;
  category: string;
  published_at: string;
}

export default function Market() {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [selectedCoin, setSelectedCoin] = useState<string>("BINANCE:BTCUSDT");

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
    
    // Fetch latest articles
    const fetchArticles = async () => {
      try {
        const q = query(
          collection(db, 'articles'),
          where('status', '==', 'published'),
          orderBy('published_at', 'desc'),
          limit(3)
        );
        const snapshot = await getDocs(q);
        const articlesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
        setArticles(articlesData);
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setLoadingArticles(false);
      }
    };
    
    fetchArticles();

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
        <title>أسعار العملات الرقمية والتحليل الفني | كريبتو بالعربي</title>
        <meta name="description" content="تابع أسعار العملات الرقمية لحظة بلحظة مع أدوات التحليل الفني المتقدمة من TradingView." />
        <link rel="canonical" href="https://crypto-arabic.vercel.app/market" />
      </Helmet>

      {/* Background Aesthetics */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-20" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, rgba(0,0,0,0) 70%)' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 bg-gray-900/40 backdrop-blur-sm p-5 md:p-8 rounded-[2rem] border border-gray-800/60 shadow-2xl">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-500/10 p-3 rounded-xl">
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white">أسعار السوق والتحليل الفني</h1>
            </div>
            <p className="text-gray-400 text-lg max-w-2xl">
              تابع تحركات السوق لحظة بلحظة مع أدوات تحليل احترافية. اختر أي عملة من الجدول أدناه لتحديث الرسم البياني.
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
              تحديث البيانات
            </button>
          </div>
        </div>

        {/* TradingView Analysis Section */}
        <section className="mb-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-gray-900/40 backdrop-blur-sm rounded-[2.5rem] border border-gray-800/60 shadow-2xl overflow-hidden p-1">
            <div className="p-6 border-b border-gray-800/60 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <LineChart className="w-5 h-5 text-green-500" />
                الرسم البياني المتقدم
              </h2>
              <div className="text-xs text-gray-400 font-mono bg-gray-950 px-3 py-1 rounded-full border border-gray-800">
                {selectedCoin}
              </div>
            </div>
            <div className="h-[500px]">
              <TradingViewWidget symbol={selectedCoin} />
            </div>
          </div>
          
          <div className="bg-gray-900/40 backdrop-blur-sm rounded-[2.5rem] border border-gray-800/60 shadow-2xl overflow-hidden p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              مؤشر التحليل الفني
            </h2>
            <TechnicalAnalysisWidget symbol={selectedCoin} />
            <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
              <p className="text-xs text-gray-400 leading-relaxed text-center">
                هذا المؤشر يعتمد على مجموعة من المؤشرات الفنية (RSI, MACD, Moving Averages) لتقديم نظرة سريعة على اتجاه السعر.
              </p>
            </div>
          </div>
        </section>

        {/* Desktop Market Table */}
        <div className="hidden md:block bg-gray-900/40 backdrop-blur-sm rounded-[2rem] border border-gray-800/60 shadow-2xl overflow-hidden">
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
                  <th className="p-5 font-bold text-center">التحليل</th>
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
                      <td className="p-5"><div className="h-8 bg-gray-800 rounded-lg w-16 mx-auto"></div></td>
                    </tr>
                  ))
                ) : (
                  coins.map((coin) => (
                    <tr 
                      key={coin.id} 
                      className={`hover:bg-gray-800/20 transition-colors group cursor-pointer ${selectedCoin.includes(coin.symbol.toUpperCase()) ? 'bg-green-500/5' : ''}`}
                      onClick={() => setSelectedCoin(`BINANCE:${coin.symbol.toUpperCase()}USDT`)}
                    >
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
                      <td className="p-5 text-center">
                        <button 
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            selectedCoin.includes(coin.symbol.toUpperCase())
                              ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                              : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                          }`}
                        >
                          تحليل
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Market Cards */}
        <div className="md:hidden flex flex-col gap-4">
          {loading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-5 animate-pulse">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-800 rounded-full"></div>
                    <div className="h-4 bg-gray-800 rounded w-20"></div>
                  </div>
                  <div className="h-4 bg-gray-800 rounded w-16"></div>
                </div>
                <div className="h-3 bg-gray-800 rounded w-full"></div>
              </div>
            ))
          ) : (
            coins.map((coin) => (
              <div 
                key={coin.id} 
                className={`bg-gray-900/40 backdrop-blur-sm border border-gray-800/60 rounded-2xl p-5 shadow-lg transition-all ${selectedCoin.includes(coin.symbol.toUpperCase()) ? 'border-green-500/50 bg-green-500/5' : ''}`}
                onClick={() => setSelectedCoin(`BINANCE:${coin.symbol.toUpperCase()}USDT`)}
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 font-bold text-xs">#{coin.market_cap_rank}</span>
                    <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full shadow-md" />
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-100 text-sm">{coin.name}</span>
                      <span className="text-xs text-gray-500 uppercase">{coin.symbol}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-white tracking-wide">{formatCurrency(coin.current_price)}</span>
                    <div className={`flex items-center gap-1 text-xs font-bold mt-1 ${
                      coin.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {coin.price_change_percentage_24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span dir="ltr">{formatPercentage(coin.price_change_percentage_24h)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800/40">
                  <div>
                    <span className="block text-xs text-gray-500 mb-1">تغير (1 س)</span>
                    <div className={`flex items-center gap-1 text-sm font-medium ${
                      (coin.price_change_percentage_1h_in_currency || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      <span dir="ltr">{formatPercentage(coin.price_change_percentage_1h_in_currency)}</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <button 
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedCoin.includes(coin.symbol.toUpperCase())
                          ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                          : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      تحليل فني
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Latest News Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            <span className="w-2 h-8 bg-green-500 rounded-full shadow-lg shadow-green-500/50"></span>
            أخبار تهمك
          </h2>
          
          {loadingArticles ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse bg-gray-900/50 rounded-2xl h-[300px] border border-gray-800/60"></div>
              ))}
            </div>
          ) : articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {articles.map((article) => (
                <Link 
                  key={article.id} 
                  to={`/article/${article.slug}`}
                  className="group bg-gray-900/40 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-800/60 hover:border-green-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-green-500/10 flex flex-col"
                >
                  <div className="relative aspect-video overflow-hidden bg-gray-800">
                    {article.image_url ? (
                      <img 
                        src={article.image_url} 
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <BookOpen className="w-8 h-8 opacity-20" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-gray-950/80 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1 border border-gray-700/50">
                      <Clock className="w-3 h-3 text-green-400" />
                      {format(new Date(article.published_at), 'dd MMM', { locale: ar })}
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="text-green-500 text-xs font-bold mb-2">
                      {article.category || 'أخبار'}
                    </div>
                    <h3 className="text-base font-bold text-gray-100 mb-3 line-clamp-2 group-hover:text-green-400 transition-colors leading-snug">
                      {article.title}
                    </h3>
                    <div className="flex items-center text-green-500 text-xs font-bold mt-auto group-hover:gap-1.5 transition-all">
                      اقرأ المزيد
                      <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
}
