import React from 'react';
import { Helmet } from 'react-helmet-async';
import FearAndGreedIndex from '../components/FearAndGreedIndex';
import TechnicalAnalysisWidget from '../components/TechnicalAnalysisWidget';
import { TrendingUp, Activity } from 'lucide-react';

export default function BtcAnalysis() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-12 transition-colors duration-300">
      <Helmet>
        <title>تحليل البيتكوين المباشر ومؤشر الخوف والطمع | كريبتو بالعربي</title>
        <meta name="description" content="تابع تحليل البيتكوين (BTC) المباشر لحظة بلحظة، وتعرف على حالة السوق المشفر من خلال مؤشر الخوف والطمع للعملات الرقمية. تحديثات مستمرة وتوقعات دقيقة." />
        <meta name="keywords" content="تحليل البيتكوين, مؤشر الخوف والطمع, سعر البيتكوين مباشر, توقعات البيتكوين, تحليل BTC, الكريبتو, العملات الرقمية, تداول البيتكوين, مؤشر الخوف والطمع للعملات الرقمية, تحليل فني للبيتكوين, Bitcoin Analysis, Fear and Greed Index Crypto, BTC USD, اتجاه السوق المشفر, تحديثات البيتكوين, اخبار البيتكوين, شارت البيتكوين, منصات تداول" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="تحليل البيتكوين المباشر ومؤشر الخوف والطمع | كريبتو بالعربي" />
        <meta property="og:description" content="تابع تحليل البيتكوين (BTC) المباشر لحظة بلحظة، وتعرف على حالة السوق المشفر من خلال مؤشر الخوف والطمع للعملات الرقمية." />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="تحليل البيتكوين المباشر ومؤشر الخوف والطمع | كريبتو بالعربي" />
        <meta name="twitter:description" content="تابع تحليل البيتكوين (BTC) المباشر لحظة بلحظة، وتعرف على حالة السوق المشفر من خلال مؤشر الخوف والطمع للعملات الرقمية." />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
            تحليل <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">البيتكوين</span> ومؤشر السوق
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            نظرة شاملة على أداء البيتكوين (BTC) وحالة المشاعر العامة في سوق العملات الرقمية من خلال مؤشر الخوف والطمع.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Fear and Greed Index Section */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-200 dark:border-gray-800 shadow-xl p-6 transition-colors duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-yellow-100 dark:bg-yellow-500/10 p-3 rounded-xl">
                  <Activity className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">مؤشر الخوف والطمع</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">تحديث يومي لمشاعر السوق</p>
                </div>
              </div>
              <FearAndGreedIndex />
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-sm">كيف تقرأ المؤشر؟</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li><strong className="text-red-500">الخوف الشديد (0-24):</strong> قد يكون علامة على قلق المستثمرين، مما يمثل فرصة شراء محتملة.</li>
                  <li><strong className="text-green-500">الطمع الشديد (75-100):</strong> يعني أن المستثمرين متفائلون جداً، وقد يكون السوق على وشك تصحيح.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* BTC Technical Analysis Section */}
          <div className="lg:col-span-8">
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden flex flex-col h-[600px] transition-colors duration-300">
              <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/20">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-100 dark:bg-yellow-500/10 p-3 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">تحليل BTC المباشر</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">مؤشرات فنية ورسوم بيانية حية</p>
                  </div>
                </div>
                <span className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs px-3 py-1.5 rounded-lg font-mono font-medium">
                  BINANCE:BTCUSDT
                </span>
              </div>
              <div className="flex-grow w-full h-full p-2">
                <TechnicalAnalysisWidget height="100%" symbol="BINANCE:BTCUSDT" />
              </div>
            </div>
          </div>
        </div>

        {/* SEO Content Section */}
        <div className="mt-16 bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-200 dark:border-gray-800 shadow-xl p-8 lg:p-12 transition-colors duration-300">
          <article className="prose prose-lg dark:prose-invert max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">أهمية متابعة تحليل البيتكوين ومؤشر الخوف والطمع</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
              يعتبر <strong>تحليل البيتكوين (BTC)</strong> حجر الزاوية لأي مستثمر في سوق العملات الرقمية. نظراً لاستحواذ البيتكوين على النسبة الأكبر من القيمة السوقية الإجمالية، فإن تحركاته السعرية تؤثر بشكل مباشر على باقي العملات البديلة (Altcoins). من خلال متابعة <em>التحليل الفني المباشر</em>، يمكنك تحديد نقاط الدعم والمقاومة، وفهم الاتجاه العام للسوق.
            </p>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">ما هو مؤشر الخوف والطمع للعملات الرقمية؟</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
              <strong>مؤشر الخوف والطمع (Fear and Greed Index)</strong> هو أداة تحليلية تقيس المشاعر العامة للمستثمرين في سوق الكريبتو. يعتمد المؤشر على عدة عوامل منها التقلبات (Volatility)، زخم السوق وحجم التداول (Market Momentum/Volume)، وسائل التواصل الاجتماعي (Social Media)، والهيمنة (Dominance).
            </p>
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl">
                <h4 className="font-bold text-gray-900 dark:text-white mb-3">عندما يسيطر الخوف</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  غالباً ما يؤدي الخوف الشديد إلى عمليات بيع هلع (Panic Selling)، مما يهبط بالأسعار إلى مستويات مغرية. المستثمرون المحنكون يرون في هذه الفترات فرصاً ممتازة لتجميع البيتكوين بأسعار منخفضة.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl">
                <h4 className="font-bold text-gray-900 dark:text-white mb-3">عندما يسيطر الطمع</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  الطمع الشديد يشير إلى حالة من "الفومو" (FOMO - الخوف من تفويت الفرصة). في هذه الأوقات، يرتفع السوق بشكل غير مبرر أحياناً، مما ينذر باقتراب حركة تصحيحية هابطة.
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
