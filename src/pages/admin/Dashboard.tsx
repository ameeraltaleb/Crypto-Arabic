import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Edit, Trash2, Eye, LogOut, CheckCircle, Clock, Settings, FileText, Save } from 'lucide-react';
import { collection, getDocs, deleteDoc, doc, setDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';

interface Article {
  id: number;
  title: string;
  slug: string;
  status: 'published' | 'draft';
  views: number;
  category: string;
  published_at: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'articles' | 'settings'>('articles');
  const [articles, setArticles] = useState<Article[]>([]);
  const [settings, setSettings] = useState({
    twitter_url: '',
    telegram_url: '',
    facebook_url: '',
    instagram_url: '',
    youtube_url: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState({ type: '', text: '' });
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/admin/login');
    } else if (user) {
      fetchData();
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch articles
      const q = query(collection(db, 'articles'), orderBy('published_at', 'desc'));
      const snapshot = await getDocs(q);
      const articlesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setArticles(articlesData);

      // Fetch settings
      const settingsSnapshot = await getDocs(collection(db, 'settings'));
      const settingsData: any = {};
      settingsSnapshot.forEach(doc => {
        settingsData[doc.id] = doc.data().value;
      });
      setSettings(prev => ({ ...prev, ...settingsData }));
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المقال؟')) return;
    
    try {
      await deleteDoc(doc(db, 'articles', id));
      setArticles(articles.filter(a => a.id !== (id as any)));
    } catch (error) {
      console.error('Failed to delete article:', error);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsMessage({ type: '', text: '' });

    try {
      const promises = Object.entries(settings).map(([key, value]) => 
        setDoc(doc(db, 'settings', key), { key, value })
      );
      await Promise.all(promises);
      setSettingsMessage({ type: 'success', text: 'تم حفظ الإعدادات بنجاح!' });
    } catch (error) {
      setSettingsMessage({ type: 'error', text: 'حدث خطأ أثناء الحفظ.' });
    } finally {
      setIsSavingSettings(false);
      setTimeout(() => setSettingsMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  if (isLoading) {
    return <div className="min-h-[50vh] flex items-center justify-center text-green-500">جاري التحميل...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">لوحة التحكم</h1>
        <div className="flex items-center gap-4">
          {activeTab === 'articles' && (
            <Link
              to="/admin/articles/new"
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              <Edit className="w-4 h-4" />
              <span>مقال جديد</span>
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>تسجيل خروج</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-gray-800 pb-4">
        <button
          onClick={() => setActiveTab('articles')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'articles' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <FileText className="w-5 h-5" />
          المقالات
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'settings' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <Settings className="w-5 h-5" />
          الإعدادات
        </button>
      </div>

      {activeTab === 'articles' ? (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-950 border-b border-gray-800 text-gray-400">
                <tr>
                  <th className="px-6 py-4 font-medium">عنوان المقال</th>
                  <th className="px-6 py-4 font-medium">التصنيف</th>
                  <th className="px-6 py-4 font-medium">الحالة</th>
                  <th className="px-6 py-4 font-medium">المشاهدات</th>
                  <th className="px-6 py-4 font-medium">تاريخ النشر</th>
                  <th className="px-6 py-4 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {articles.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-white font-medium line-clamp-1">{article.title}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      <span className="bg-gray-800 px-2 py-1 rounded text-xs">{article.category || 'أخبار'}</span>
                    </td>
                    <td className="px-6 py-4">
                      {article.status === 'published' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                          <CheckCircle className="w-3.5 h-3.5" />
                          منشور
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                          <Clock className="w-3.5 h-3.5" />
                          مسودة
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-4 h-4" />
                        {article.views}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {new Date(article.published_at).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Link
                          to={`/article/${article.slug}`}
                          target="_blank"
                          className="text-gray-400 hover:text-white transition-colors"
                          title="عرض"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(article.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {articles.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      لا يوجد مقالات حالياً
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 max-w-2xl">
          <h2 className="text-xl font-bold text-white mb-6">روابط التواصل الاجتماعي</h2>
          
          {settingsMessage.text && (
            <div className={`mb-6 p-4 rounded-lg border ${
              settingsMessage.type === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
            }`}>
              {settingsMessage.text}
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">رابط تويتر (X)</label>
              <input 
                type="url" 
                value={settings.twitter_url}
                onChange={e => setSettings({...settings, twitter_url: e.target.value})}
                placeholder="https://twitter.com/..."
                className="w-full px-4 py-3 bg-gray-950 border border-gray-800 text-white rounded-xl focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none transition-colors" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">رابط تيليجرام</label>
              <input 
                type="url" 
                value={settings.telegram_url}
                onChange={e => setSettings({...settings, telegram_url: e.target.value})}
                placeholder="https://t.me/..."
                className="w-full px-4 py-3 bg-gray-950 border border-gray-800 text-white rounded-xl focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none transition-colors" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">رابط فيسبوك</label>
              <input 
                type="url" 
                value={settings.facebook_url}
                onChange={e => setSettings({...settings, facebook_url: e.target.value})}
                placeholder="https://facebook.com/..."
                className="w-full px-4 py-3 bg-gray-950 border border-gray-800 text-white rounded-xl focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none transition-colors" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">رابط انستغرام</label>
              <input 
                type="url" 
                value={settings.instagram_url}
                onChange={e => setSettings({...settings, instagram_url: e.target.value})}
                placeholder="https://instagram.com/..."
                className="w-full px-4 py-3 bg-gray-950 border border-gray-800 text-white rounded-xl focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none transition-colors" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">رابط يوتيوب</label>
              <input 
                type="url" 
                value={settings.youtube_url}
                onChange={e => setSettings({...settings, youtube_url: e.target.value})}
                placeholder="https://youtube.com/..."
                className="w-full px-4 py-3 bg-gray-950 border border-gray-800 text-white rounded-xl focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none transition-colors" 
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isSavingSettings}
              className="flex items-center justify-center gap-2 w-full bg-green-500 text-white px-4 py-3 rounded-xl font-medium hover:bg-green-600 transition-colors disabled:opacity-70 mt-6"
            >
              <Save className="w-5 h-5" />
              {isSavingSettings ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
