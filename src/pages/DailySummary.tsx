import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Sparkles, TrendingUp, TrendingDown, Clock, RefreshCw, BarChart2, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import axios from 'axios';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { generateDailySummary } from '../lib/gemini';

export default function DailySummary() {
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchDataAndGenerate = async () => {
    setIsGenerating(true);
    try {
      // 1. Fetch Market Data
      const marketRes = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 10,
          sparkline: false,
          price_change_percentage: '24h'
        }
      });

      // 2. Fetch Latest News from Firebase
      const path = 'articles';
      const q = query(collection(db, path), orderBy('published_at', 'desc'), limit(5));
      const snapshot = await getDocs(q);
      const news = snapshot.docs.map(doc => doc.data());

      // 3. Generate with Gemini
      const aiSummary = await generateDailySummary(marketRes.data, news);
      setSummary(aiSummary);
    } catch (error) {
      console.error("Failed to generate summary:", error);
      if (axios.isAxiosError(error)) {
        setSummary("عذراً، واجهنا مشكلة في جلب بيانات السوق. يرجى المحاولة مرة أخرى.");
      } else {
        handleFirestoreError(error, OperationType.GET, 'articles');
      }
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    fetchDataAndGenerate();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 relative overflow-hidden transition-colors duration-300">
      <Helmet>
        <title>ملخص السوق اليومي بالذكاء الاصطناعي | كريبتو بالعربي</title>
        <meta name="description" content="احصل على ملخص يومي شامل لسوق العملات الرقمية، مدعوم بالذكاء الاصطناعي لتحليل أحدث الأخبار والأسعار." />
        <link rel="canonical" href="https://crypto-arabic.vercel.app/daily-summary" />
      </Helmet>

      {/* Decorative Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] opacity-10 dark:opacity-20 pointer-events-none" 
           style={{ background: 'radial-gradient(circle, rgba(243,186,47,0.15) 0%, rgba(0,0,0,0) 70%)' }}></div>

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 px-4 py-2 rounded-full border border-yellow-500/20 mb-6">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-bold">مدعوم بالذكاء الاصطناعي</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
            ملخص السوق <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-700 dark:from-yellow-400 dark:to-yellow-600">اليومي</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            نحلل لك آلاف البيانات والأخبار في ثوانٍ لنقدم لك زبدة ما يحدث في عالم الكريبتو اليوم.
          </p>
        </div>

        <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-[2.5rem] border border-gray-200 dark:border-gray-800/60 shadow-2xl overflow-hidden min-h-[400px] transition-colors duration-300">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800/60 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/20 transition-colors duration-300">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-500/10 p-2 rounded-lg">
                <BarChart2 className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
              </div>
              <span className="text-gray-900 dark:text-white font-bold">تقرير اليوم</span>
            </div>
            <button 
              onClick={fetchDataAndGenerate}
              disabled={isGenerating}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors disabled:opacity-50"
              title="تحديث الملخص"
            >
              <RefreshCw className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="p-8 md:p-12">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 dark:text-gray-400 animate-pulse">جاري تحليل بيانات السوق والأخبار...</p>
              </div>
            ) : (
              <div className="prose dark:prose-invert prose-yellow max-w-none prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-headings:text-gray-900 dark:prose-headings:text-white prose-strong:text-yellow-600 dark:prose-strong:text-yellow-400">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
              </div>
            )}
          </div>

          <div className="p-6 bg-gray-50/80 dark:bg-gray-950/50 border-t border-gray-200 dark:border-gray-800/60 flex items-center justify-center gap-4 transition-colors duration-300">
            <p className="text-xs text-gray-500 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              يتم توليد هذا التقرير آلياً بناءً على أحدث البيانات المتاحة.
            </p>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm p-6 rounded-3xl border border-gray-200 dark:border-gray-800/60 hover:border-yellow-500/30 dark:hover:border-yellow-500/30 transition-colors duration-300 group">
            <div className="bg-yellow-500/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
            </div>
            <h3 className="text-gray-900 dark:text-white font-bold mb-2">تحليل الأسعار</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">تابع أسعار العملات الرقمية لحظة بلحظة مع أدوات التحليل المتقدمة.</p>
          </div>
          <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm p-6 rounded-3xl border border-gray-200 dark:border-gray-800/60 hover:border-yellow-500/30 dark:hover:border-yellow-500/30 transition-colors duration-300 group">
            <div className="bg-purple-500/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-500" />
            </div>
            <h3 className="text-gray-900 dark:text-white font-bold mb-2">مجتمعنا</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">انضم لقناتنا على تيليجرام لتصلك أهم التنبيهات والفرص الاستثمارية.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
