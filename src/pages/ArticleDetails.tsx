import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ArrowRight, Share2, Twitter, Facebook, Link as LinkIcon, ChevronLeft, Clock, BookOpen, MessageCircle, BarChart3 } from 'lucide-react';
import { collection, query, where, limit, getDocs, updateDoc, doc, increment } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import TechnicalAnalysisWidget from '../components/TechnicalAnalysisWidget';

interface Article {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  image_url: string;
  source_url: string;
  keywords: string;
  category: string;
  published_at: string;
  content_length?: number;
}

export default function ArticleDetails() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);

  // Helper to get symbol from category or keywords
  const getSymbol = () => {
    if (!article) return "BINANCE:BTCUSDT";
    const text = (article.title + " " + article.category + " " + (article.keywords || "")).toLowerCase();
    if (text.includes('بيتكوين') || text.includes('bitcoin') || text.includes('btc')) return "BINANCE:BTCUSDT";
    if (text.includes('إيثيريوم') || text.includes('ethereum') || text.includes('eth')) return "BINANCE:ETHUSDT";
    if (text.includes('سولانا') || text.includes('solana') || text.includes('sol')) return "BINANCE:SOLUSDT";
    if (text.includes('ريبل') || text.includes('ripple') || text.includes('xrp')) return "BINANCE:XRPUSDT";
    if (text.includes('كاردانو') || text.includes('cardano') || text.includes('ada')) return "BINANCE:ADAUSDT";
    if (text.includes('دوجكوين') || text.includes('dogecoin') || text.includes('doge')) return "BINANCE:DOGEUSDT";
    return "BINANCE:BTCUSDT";
  };

  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = `${totalScroll / windowHeight}`;
      setScrollProgress(Number(scroll));
    }
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) return;
      setLoading(true);
      const path = 'articles';
      try {
        const q = query(
          collection(db, path),
          where('slug', '==', slug),
          limit(1)
        );
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const docData = snapshot.docs[0];
          const data = { id: docData.id, ...docData.data() } as any;
          
          // Fix potential markdown formatting issues from AI
          // Sometimes AI escapes newlines like \n instead of actual newlines
          if (data.content && typeof data.content === 'string') {
            data.content = data.content.replace(/\\n/g, '\n');
          }
          
          setArticle(data);

          // Increment views
          try {
            await updateDoc(doc(db, path, docData.id), {
              views: increment(1)
            });
          } catch (e) {
            console.warn('Failed to increment views', e);
          }

          // Fetch related articles
          const relatedQ = query(
            collection(db, path),
            where('category', '==', data.category),
            limit(4)
          );
          const relatedSnapshot = await getDocs(relatedQ);
          let related = relatedSnapshot.docs
            .map(d => ({ id: d.id, ...d.data() } as any))
            .filter(a => a.slug !== slug)
            .slice(0, 3);

          // Fallback: If no related articles in the same category, fetch latest articles
          if (related.length === 0) {
            const fallbackQ = query(
              collection(db, path),
              where('status', '==', 'published'),
              limit(4)
            );
            const fallbackSnapshot = await getDocs(fallbackQ);
            related = fallbackSnapshot.docs
              .map(d => ({ id: d.id, ...d.data() } as any))
              .filter(a => a.slug !== slug)
              .slice(0, 3);
          }
          
          setRelatedArticles(related);
        }
      } catch (err) {
        console.error('Error fetching article:', err);
        handleFirestoreError(err, OperationType.GET, path);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold text-gray-100 mb-4">المقال غير موجود</h1>
        <Link to="/" className="text-green-500 hover:text-green-400 inline-flex items-center gap-2">
          <ArrowRight className="w-5 h-5" />
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const calculateReadingTime = (content: string) => {
    if (!content) return 3;
    const words = content.length / 6; 
    return Math.max(1, Math.ceil(words / 200));
  };

  const readingTime = calculateReadingTime(article.content);

  // JSON-LD Structured Data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "image": [article.image_url || "https://crypto-arabic.vercel.app/logo.png"],
    "datePublished": new Date(article.published_at).toISOString(),
    "dateModified": new Date(article.published_at).toISOString(),
    "author": {
      "@type": "Organization",
      "name": "كريبتو بالعربي",
      "url": "https://crypto-arabic.vercel.app"
    },
    "publisher": {
      "@type": "Organization",
      "name": "كريبتو بالعربي",
      "logo": {
        "@type": "ImageObject",
        "url": "https://crypto-arabic.vercel.app/logo.png"
      }
    },
    "description": article.summary,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": shareUrl
    }
  };

  return (
    <>
      <div className="fixed top-0 left-0 w-full h-1.5 bg-gray-200 dark:bg-gray-900 z-50 transition-colors duration-300">
        <div className="h-full bg-yellow-500 transition-all duration-150" style={{ width: `${scrollProgress * 100}%` }}></div>
      </div>
      <article className="max-w-4xl mx-auto px-4 py-8">
        <Helmet>
          <title>{article.title} | كريبتو بالعربي</title>
          <meta name="description" content={article.summary} />
          <meta name="keywords" content={article.keywords} />
          <link rel="canonical" href={shareUrl} />
          <meta property="og:title" content={article.title} />
          <meta property="og:description" content={article.summary} />
          <meta property="og:url" content={shareUrl} />
          {article.image_url && <meta property="og:image" content={article.image_url} />}
          <meta property="og:type" content="article" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={article.title} />
          <meta name="twitter:description" content={article.summary} />
          {article.image_url && <meta name="twitter:image" content={article.image_url} />}
          <script type="application/ld+json">
            {JSON.stringify(jsonLd)}
          </script>
        </Helmet>

      <Link to="/" className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-500 mb-8 transition-colors">
        <ArrowRight className="w-5 h-5" />
        العودة للأخبار
      </Link>

      <header className="mb-10">
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
          <span className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 px-4 py-1.5 rounded-full font-bold border border-yellow-500/20">
            {article.category || 'أخبار الكريبتو'}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <time dateTime={article.published_at}>
              {format(new Date(article.published_at), 'dd MMMM yyyy', { locale: ar })}
            </time>
          </span>
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            {readingTime} دقائق قراءة
          </span>
        </div>
        
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-gray-100 leading-[1.3] mb-6">
          {article.title}
        </h1>

        <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed mb-8 border-r-4 border-yellow-500 pr-5 py-2 bg-gradient-to-l from-yellow-500/5 to-transparent rounded-l-xl">
          {article.summary}
        </p>

        {article.image_url && (
          <div className="relative rounded-3xl overflow-hidden shadow-2xl mb-8 border border-gray-200 dark:border-gray-800/60 transition-colors duration-300">
            <img 
              src={article.image_url} 
              alt={article.title} 
              className="w-full h-auto max-h-[300px] md:max-h-[500px] object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 dark:from-gray-950/60 to-transparent pointer-events-none"></div>
          </div>
        )}

        {/* Social Share */}
        <div className="grid grid-cols-5 sm:flex sm:items-center gap-3 sm:gap-4 py-6 border-y border-gray-200 dark:border-gray-800/60 transition-colors duration-300">
          <span className="col-span-5 sm:col-span-1 text-gray-600 dark:text-gray-400 font-bold flex items-center gap-2 mb-2 sm:mb-0">
            <Share2 className="w-5 h-5" />
            مشاركة الخبر:
          </span>
          <a 
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-[#1DA1F2] hover:border-[#1DA1F2] dark:hover:bg-[#1DA1F2] dark:hover:border-[#1DA1F2] text-gray-600 dark:text-gray-300 hover:text-white dark:hover:text-white rounded-xl transition-all shadow-lg flex items-center justify-center"
            title="مشاركة على X (تويتر)"
          >
            <Twitter className="w-5 h-5" />
          </a>
          <a 
            href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(article.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-[#0088cc] hover:border-[#0088cc] dark:hover:bg-[#0088cc] dark:hover:border-[#0088cc] text-gray-600 dark:text-gray-300 hover:text-white dark:hover:text-white rounded-xl transition-all shadow-lg flex items-center justify-center"
            title="مشاركة على تيليجرام"
          >
            <MessageCircle className="w-5 h-5" />
          </a>
          <a 
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(article.title + ' ' + shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-[#25D366] hover:border-[#25D366] dark:hover:bg-[#25D366] dark:hover:border-[#25D366] text-gray-600 dark:text-gray-300 hover:text-white dark:hover:text-white rounded-xl transition-all shadow-lg flex items-center justify-center"
            title="مشاركة على واتساب"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </a>
          <a 
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-[#4267B2] hover:border-[#4267B2] dark:hover:bg-[#4267B2] dark:hover:border-[#4267B2] text-gray-600 dark:text-gray-300 hover:text-white dark:hover:text-white rounded-xl transition-all shadow-lg flex items-center justify-center"
            title="مشاركة على فيسبوك"
          >
            <Facebook className="w-5 h-5" />
          </a>
          <button 
            onClick={copyLink}
            className="p-3 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-yellow-500 hover:border-yellow-500 dark:hover:bg-yellow-500 dark:hover:border-yellow-500 text-gray-600 dark:text-gray-300 hover:text-gray-950 dark:hover:text-gray-950 rounded-xl transition-all relative shadow-lg flex items-center justify-center"
            title="نسخ الرابط"
          >
            <LinkIcon className="w-5 h-5" />
            {copied && (
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-yellow-500 text-gray-950 text-xs py-1.5 px-3 rounded-lg font-bold shadow-lg whitespace-nowrap">
                تم النسخ!
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="prose dark:prose-invert prose-yellow max-w-none prose-img:rounded-2xl prose-img:shadow-xl prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-a:text-yellow-600 dark:prose-a:text-yellow-500 hover:prose-a:text-yellow-500 dark:hover:prose-a:text-yellow-400 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-li:text-gray-700 dark:prose-li:text-gray-300 break-words prose-pre:overflow-x-auto">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.content}</ReactMarkdown>
      </div>

      {/* Technical Analysis Section */}
      <section className="mt-12 p-6 md:p-8 bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm rounded-[2rem] border border-gray-200 dark:border-gray-800/60 shadow-2xl transition-colors duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-2">
              <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-500" />
              التحليل الفني المباشر
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              مؤشرات فنية حية لعملة {article.category === 'أخبار' ? 'البيتكوين' : article.category} بناءً على البيانات الحالية من TradingView.
            </p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-950 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 text-xs font-mono text-gray-600 dark:text-gray-400 transition-colors duration-300">
            {getSymbol()}
          </div>
        </div>
        <div className="max-w-2xl mx-auto">
          <TechnicalAnalysisWidget symbol={getSymbol()} height={450} />
        </div>
      </section>

      {article.source_url && (
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800/60 transition-colors duration-300">
          <a 
            href={article.source_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-500 text-sm bg-gray-50 dark:bg-gray-900/50 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800/60 transition-colors"
          >
            <LinkIcon className="w-4 h-4" />
            المصدر الأصلي للخبر
          </a>
        </div>
      )}

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="mt-16 pt-12 border-t border-gray-200 dark:border-gray-800/60 transition-colors duration-300">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
            <span className="w-2 h-8 bg-yellow-500 rounded-full shadow-lg shadow-yellow-500/50"></span>
            مقالات ذات صلة قد تهمك
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map((related) => (
              <Link 
                key={related.id} 
                to={`/article/${related.slug}`}
                className="group bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800/60 hover:border-yellow-500/30 dark:hover:border-yellow-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-yellow-500/10 flex flex-col"
              >
                <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800 transition-colors duration-300">
                  {related.image_url ? (
                    <img 
                      src={related.image_url} 
                      alt={related.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
                      <BookOpen className="w-8 h-8 opacity-20" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md text-gray-900 dark:text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1 border border-gray-200 dark:border-gray-700/50 transition-colors duration-300">
                    <Clock className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                    {format(new Date(related.published_at), 'dd MMM', { locale: ar })}
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3 line-clamp-2 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors leading-snug">
                    {related.title}
                  </h3>
                  <div className="flex items-center text-yellow-600 dark:text-yellow-500 text-xs font-bold mt-auto group-hover:gap-1.5 transition-all">
                    اقرأ المزيد
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
    </>
  );
}
