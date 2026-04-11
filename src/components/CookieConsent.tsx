import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4 z-50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-gray-300 text-sm md:text-base text-center sm:text-right">
          نستخدم ملفات تعريف الارتباط (Cookies) لتحسين تجربتك على موقعنا، وتحليل حركة المرور، وتخصيص المحتوى والإعلانات. 
          باستمرارك في استخدام الموقع، فإنك توافق على <Link to="/privacy" className="text-green-500 hover:underline">سياسة الخصوصية</Link> الخاصة بنا.
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={acceptCookies}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
          >
            موافق
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-500 hover:text-white transition-colors p-2"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
