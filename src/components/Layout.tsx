import { Link, Outlet, useLocation } from 'react-router-dom';
import { TrendingUp, Menu, X, Twitter, Send, Facebook, Instagram, Youtube, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import CookieConsent from './CookieConsent';
import CryptoTicker from './CryptoTicker';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useTheme } from '../lib/ThemeContext';

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'settings'));
        const settingsData: Record<string, string> = {};
        snapshot.forEach(doc => {
          settingsData[doc.id] = doc.data().value;
        });
        setSettings(settingsData);
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const navLinks = [
    { path: '/', label: 'الرئيسية' },
    { path: '/daily-summary', label: 'ملخص اليوم' },
    { path: '/market', label: 'أسعار العملات' },
    { path: '/btc-analysis', label: 'تحليل ومؤشرات' },
    { path: '/about', label: 'من نحن' },
    { path: '/contact', label: 'اتصل بنا' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-100 selection:bg-yellow-500/30 transition-colors duration-300">
      <CryptoTicker />
      
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-gray-950 p-2 sm:p-2.5 rounded-xl group-hover:scale-105 transition-transform shadow-lg shadow-yellow-500/20">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                كريبتو <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">بالعربي</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium transition-colors hover:text-yellow-500 dark:hover:text-yellow-400 ${
                    isActive(link.path) ? 'text-yellow-600 dark:text-yellow-500' : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 hover:text-yellow-500 dark:text-gray-400 dark:hover:text-yellow-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </nav>

            {/* Mobile Actions */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 hover:text-yellow-500 dark:text-gray-400 dark:hover:text-yellow-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl flex flex-col transition-colors duration-300">
          <div className="flex justify-between items-center h-20 px-4 border-b border-gray-200 dark:border-gray-800/60">
            <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-gray-950 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">كريبتو بالعربي</span>
            </Link>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex flex-col px-6 py-8 gap-3 overflow-y-auto">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-6 py-4 rounded-2xl text-lg font-bold transition-all ${
                  isActive(link.path)
                    ? 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-500/20'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white border border-transparent'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pt-16 pb-8 mt-20 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-gray-950 p-2 rounded-lg">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">كريبتو بالعربي</span>
              </Link>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-md">
                منصتك الأولى لأخبار وتحليلات العملات الرقمية والتداول. نستخدم أحدث تقنيات الذكاء الاصطناعي لتقديم محتوى دقيق وموثوق لحظة بلحظة.
              </p>
            </div>
            
            <div>
              <h3 className="text-gray-900 dark:text-white font-bold mb-6">روابط سريعة</h3>
              <ul className="space-y-4">
                <li><Link to="/about" className="text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors">من نحن</Link></li>
                <li><Link to="/contact" className="text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors">اتصل بنا</Link></li>
                <li><a href="/rss.xml" className="text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors">خلاصة RSS</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-gray-900 dark:text-white font-bold mb-6">قانوني</h3>
              <ul className="space-y-4">
                <li><Link to="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors">سياسة الخصوصية</Link></li>
                <li><Link to="/terms" className="text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors">شروط الاستخدام</Link></li>
                <li><Link to="/admin" className="text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors">لوحة الإدارة</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} كريبتو بالعربي. جميع الحقوق محفوظة.
            </p>
            <div className="flex items-center gap-4">
              {settings.twitter_url && (
                <a href={settings.twitter_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-yellow-500 transition-colors" title="Twitter">
                  <Twitter className="w-5 h-5" />
                </a>
              )}
              {settings.telegram_url && (
                <a href={settings.telegram_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-yellow-500 transition-colors" title="Telegram">
                  <Send className="w-5 h-5" />
                </a>
              )}
              {settings.facebook_url && (
                <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-yellow-500 transition-colors" title="Facebook">
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {settings.instagram_url && (
                <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-yellow-500 transition-colors" title="Instagram">
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {settings.youtube_url && (
                <a href={settings.youtube_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-yellow-500 transition-colors" title="YouTube">
                  <Youtube className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </footer>
      <CookieConsent />
    </div>
  );
}
