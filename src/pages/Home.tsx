import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { TrendingUp, Clock, ChevronLeft, Search, Filter, Flame, BookOpen } from 'lucide-react';
import FearAndGreedIndex from '../components/FearAndGreedIndex';
import { collection, query, where, orderBy, limit, getDocs, startAfter, count } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Article {
  id: number;
  title: string;
  slug: string;
  summary: string;
  image_url: string;
  category: string;
  published_at: string;
  views?: number;
  content_length?: number;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const CATEGORIES = ['الكل', 'أخبار', 'تحليل', 'تعليم', 'عملات بديلة', 'بيتكوين'];

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [trending, setTrending] = useState<Article[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const currentPage = parseInt(searchParams.get('page') || '1');
  const currentCategory = searchParams.get('category') || 'الكل';
  const currentSearch = searchParams.get('search') || '';

  const [searchInput, setSearchInput] = useState(currentSearch);

  useEffect(() => {
    fetchArticles();
  }, [currentPage, currentCategory, searchParams.get('search')]);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const q = query(
          collection(db, 'articles'),
          where('status', '==', 'published'),
          orderBy('views', 'desc'),
          limit(5)
        );
        const snapshot = await getDocs(q);
        const trendingData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        setTrending(trendingData);
      } catch (err) {
        console.error('Failed to fetch trending articles', err);
      }
    };
    fetchTrending();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      let q = query(
        collection(db, 'articles'),
        where('status', '==', 'published'),
        orderBy('published_at', 'desc')
      );

      if (currentCategory !== 'الكل') {
        q = query(q, where('category', '==', currentCategory));
      }

      // Simple pagination logic (for a real app, use startAfter)
      const snapshot = await getDocs(q);
      let allArticles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

      // Client-side search for simplicity if needed, or better firestore queries
      if (currentSearch) {
        allArticles = allArticles.filter(a => 
          a.title.includes(currentSearch) || a.summary.includes(currentSearch)
        );
      }

      const limitPerPage = 9;
      const total = allArticles.length;
      const totalPages = Math.ceil(total / limitPerPage);
      const start = (currentPage - 1) * limitPerPage;
      const paginatedArticles = allArticles.slice(start, start + limitPerPage);

      setArticles(paginatedArticles);
      setPagination({
        total,
        page: currentPage,
        limit: limitPerPage,
        totalPages
      });
    } catch (err) {
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(prev => {
      if (searchInput) prev.set('search', searchInput);
      else prev.delete('search');
      prev.set('page', '1');
      return prev;
    });
  };

  const handleCategoryChange = (category: string) => {
    setSearchParams(prev => {
      if (category !== 'الكل') prev.set('category', category);
      else prev.delete('category');
      prev.set('page', '1');
      return prev;
    });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams(prev => {
      prev.set('page', newPage.toString());
      return prev;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const calculateReadingTime = (contentLength?: number) => {
    if (!contentLength) return 3; // Default 3 mins
    // Approx 200 words per minute, average word length in Arabic is 5-6 chars
    const words = contentLength / 6; 
    return Math.max(1, Math.ceil(words / 200));
  };

  const isDefaultView = currentPage === 1 && !currentSearch && currentCategory === 'الكل';

  return (
    <div className="relative min-h-screen bg-gray-950">
      <Helmet>
        <title>كريبتو بالعربي - أخبار وتحليلات العملات الرقمية</title>
        <meta name="description" content="منصة متخصصة في أخبار وتحليلات العملات الرقمية والتداول، مدعومة بالذكاء الاصطناعي." />
      </Helmet>

      {/* Web3 Background Aesthetics */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.3) 0%, rgba(0,0,0,0) 70%)' }}></div>

      <div className="max-w-7xl mx-auto px-4 py-12 relative z-10">
        
        {/* Featured Bento Grid Section */}
        {!loading && isDefaultView && articles.length > 0 && (
          <section className="mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Main Featured Article */}
              <Link 
                to={`/article/${articles[0].slug}`} 
                className="lg:col-span-8 group relative rounded-[2.5rem] overflow-hidden border border-gray-800/60 hover:border-green-500/50 transition-all duration-500 shadow-2xl min-h-[400px] lg:min-h-[500px] flex flex-col justify-end"
              >
                <div className="absolute inset-0">
                  {articles[0].image_url ? (
                    <img 
                      src={articles[0].image_url} 
                      alt={articles[0].title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <TrendingUp className="w-20 h-20 text-gray-700" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent opacity-90 group-hover:opacity-70 transition-opacity"></div>
                </div>
                
                <div className="relative z-10 p-8 lg:p-12 w-full lg:w-4/5">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="bg-green-500 text-white text-xs px-4 py-1.5 rounded-full font-bold uppercase tracking-wider shadow-lg shadow-green-500/30">
                      {articles[0].category || 'أخبار'}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-gray-300 font-medium bg-gray-900/50 backdrop-blur-md px-3 py-1 rounded-full border border-gray-700/50">
                      <Clock className="w-4 h-4" />
                      {format(new Date(articles[0].published_at), 'dd MMMM yyyy', { locale: ar })}
                    </span>
                  </div>
                  <h2 className="text-3xl lg:text-4xl xl:text-5xl font-extrabold text-white leading-[1.3] mb-4 group-hover:text-green-400 transition-colors drop-shadow-lg">
                    {articles[0].title}
                  </h2>
                  <p className="text-gray-200 text-lg line-clamp-2 mb-6 drop-shadow-md font-medium">
                    {articles[0].summary}
                  </p>
                </div>
              </Link>

              {/* Secondary Featured Articles */}
              {articles.length > 1 && (
                <div className="lg:col-span-4 flex flex-col gap-6">
                  {articles.slice(1, 3).map((article) => (
                    <Link 
                      key={article.id}
                      to={`/article/${article.slug}`} 
                      className="group relative rounded-[2rem] overflow-hidden border border-gray-800/60 hover:border-green-500/50 transition-all duration-500 shadow-xl flex-1 min-h-[200px] lg:min-h-[240px] flex flex-col justify-end"
                    >
                      <div className="absolute inset-0">
                        {article.image_url ? (
                          <img 
                            src={article.image_url} 
                            alt={article.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                            <TrendingUp className="w-10 h-10 text-gray-700" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent opacity-90 group-hover:opacity-70 transition-opacity"></div>
                      </div>
                      
                      <div className="relative z-10 p-6">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="bg-green-500/90 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg">
                            {article.category || 'أخبار'}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-white leading-snug group-hover:text-green-400 transition-colors line-clamp-3 drop-shadow-lg">
                          {article.title}
                        </h3>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content Area */}
          <div className="lg:col-span-8">
            {/* Categories Filter */}
            <section className="mb-10">
              <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
                <div className="bg-gray-900/80 backdrop-blur-md border border-gray-800 p-2.5 rounded-2xl shrink-0 ml-2 shadow-lg">
                  <Filter className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex bg-gray-900/40 backdrop-blur-sm border border-gray-800/60 p-1.5 rounded-2xl">
                  {CATEGORIES.map(category => (
                    <button
                      key={category}
                      onClick={() => handleCategoryChange(category)}
                      className={`shrink-0 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                        currentCategory === category
                          ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Articles Grid */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  {currentSearch ? `نتائج البحث عن "${currentSearch}"` : 'أحدث المقالات'}
                </h2>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="animate-pulse bg-gray-900/50 rounded-3xl h-[400px] border border-gray-800/60"></div>
                  ))}
                </div>
              ) : (isDefaultView ? articles.slice(3) : articles).length === 0 ? (
                <div className="text-center py-20 bg-gray-900/50 rounded-3xl border border-gray-800/60">
                  <p className="text-gray-400 text-lg">لم يتم العثور على مقالات تطابق بحثك.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    {(isDefaultView ? articles.slice(3) : articles).map((article) => (
                      <Link 
                        key={article.id} 
                        to={`/article/${article.slug}`}
                        className="group bg-gray-900/40 backdrop-blur-sm rounded-3xl overflow-hidden border border-gray-800/60 hover:border-green-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-green-500/10 flex flex-col"
                      >
                        <div className="relative aspect-[16/10] overflow-hidden bg-gray-800">
                          {article.image_url ? (
                            <img 
                              src={article.image_url} 
                              alt={article.title}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                              <TrendingUp className="w-12 h-12 opacity-20" />
                            </div>
                          )}
                          <div className="absolute top-4 right-4 bg-gray-950/80 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-gray-700/50">
                            <Clock className="w-3.5 h-3.5 text-green-400" />
                            {format(new Date(article.published_at), 'dd MMM', { locale: ar })}
                          </div>
                        </div>
                        
                        <div className="p-6 lg:p-8 flex flex-col flex-grow">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-green-500 text-sm font-bold">
                              {article.category || 'أخبار'}
                            </div>
                            <div className="text-gray-500 text-xs font-medium flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5" />
                              {calculateReadingTime(article.content_length)} د
                            </div>
                          </div>
                          <h3 className="text-xl font-bold text-gray-100 mb-4 line-clamp-2 group-hover:text-green-400 transition-colors leading-snug">
                            {article.title}
                          </h3>
                          <p className="text-gray-400 text-sm line-clamp-3 mb-6 flex-grow leading-relaxed">
                            {article.summary}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-12">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-xl bg-gray-900/50 border border-gray-800/60 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors font-medium"
                      >
                        السابق
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                              currentPage === page
                                ? 'bg-green-500 text-white font-bold shadow-lg shadow-green-500/25 scale-105'
                                : 'bg-gray-900/50 border border-gray-800/60 text-gray-400 hover:bg-gray-800 hover:text-white font-medium'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === pagination.totalPages}
                        className="px-4 py-2 rounded-xl bg-gray-900/50 border border-gray-800/60 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors font-medium"
                      >
                        التالي
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            {/* Search Widget */}
            <div className="bg-gray-900/40 backdrop-blur-sm rounded-3xl p-6 lg:p-8 border border-gray-800/60 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                <div className="bg-green-500/10 p-2 rounded-lg">
                  <Search className="w-5 h-5 text-green-500" />
                </div>
                البحث في الموقع
              </h3>
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="ابحث عن عملة، خبر..."
                    className="w-full bg-gray-950 border border-gray-800 rounded-2xl py-4 px-5 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder:text-gray-600"
                  />
                  <button 
                    type="submit"
                    className="absolute left-2 top-2 bottom-2 bg-green-500 hover:bg-green-600 text-white px-4 rounded-xl transition-colors flex items-center justify-center shadow-lg shadow-green-500/20"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>

            {/* Fear and Greed Index Widget */}
            <FearAndGreedIndex />

            {/* Telegram Community Widget */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-extrabold text-white mb-3">انضم لمجتمعنا!</h3>
                <p className="text-blue-100 mb-6 text-sm leading-relaxed">
                  احصل على أحدث الأخبار والتحليلات الحصرية مباشرة على هاتفك عبر قناتنا على تيليجرام.
                </p>
                <a 
                  href="https://t.me/your_channel" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full bg-white text-blue-700 font-bold py-3 px-6 rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
                >
                  <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                  انضم للقناة الآن
                </a>
              </div>
            </div>

            {/* Trending Widget */}
            {trending.length > 0 && (
              <div className="bg-gray-900/40 backdrop-blur-sm rounded-3xl p-6 lg:p-8 border border-gray-800/60 shadow-xl sticky top-28">
                <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-3">
                  <div className="bg-orange-500/10 p-2 rounded-lg">
                    <Flame className="w-5 h-5 text-orange-500" />
                  </div>
                  الأكثر قراءة
                </h3>
                <div className="space-y-6">
                  {trending.map((article, index) => (
                    <Link key={article.id} to={`/article/${article.slug}`} className="flex gap-5 group items-start">
                      <div className="text-4xl font-black text-gray-800 group-hover:text-green-500/30 transition-colors mt-1">
                        0{index + 1}
                      </div>
                      <div>
                        <h4 className="text-gray-200 font-bold group-hover:text-green-400 transition-colors line-clamp-2 mb-2 leading-snug text-base">
                          {article.title}
                        </h4>
                        <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {format(new Date(article.published_at), 'dd MMM yyyy', { locale: ar })}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
