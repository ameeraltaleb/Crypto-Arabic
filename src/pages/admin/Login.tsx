import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Lock } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';

export default function AdminLogin() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      navigate('/admin/dashboard');
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    try {
      setErrorMsg('');
      await login();
      // Navigation will be handled by the useEffect once user state updates
    } catch (err: any) {
      console.error('Login failed:', err);
      setErrorMsg('فشل تسجيل الدخول: ' + (err.message || 'يرجى المحاولة مرة أخرى'));
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <Helmet>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="max-w-md w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-2xl text-center transition-colors duration-300">
        <div className="flex justify-center mb-8">
          <div className="bg-yellow-100 dark:bg-yellow-500/10 p-4 rounded-full">
            <Lock className="w-8 h-8 text-yellow-600 dark:text-yellow-500" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">تسجيل الدخول للإدارة</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">يرجى تسجيل الدخول باستخدام حساب جوجل المعتمد للوصول إلى لوحة التحكم.</p>
        
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-red-600 dark:text-red-500 text-sm">
            {errorMsg}
          </div>
        )}
        
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-gray-100 dark:bg-white hover:bg-gray-200 dark:hover:bg-gray-100 text-gray-900 font-bold py-3 px-4 rounded-xl transition-colors"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          <span>تسجيل الدخول بواسطة Google</span>
        </button>
      </div>
    </div>
  );
}
