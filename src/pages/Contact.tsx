import { Helmet } from 'react-helmet-async';
import { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'حدث خطأ غير متوقع');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('تعذر الاتصال بالخادم. يرجى المحاولة لاحقاً.');
    }
  };

  return (
    <>
      <Helmet>
        <title>اتصل بنا | كريبتو بالعربي</title>
        <meta name="description" content="تواصل مع فريق كريبتو بالعربي لأي استفسارات أو اقتراحات." />
      </Helmet>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-100 mb-8 text-center">اتصل بنا</h1>
        
        <div className="bg-gray-900 rounded-2xl p-8 shadow-sm border border-gray-800">
          <h2 className="text-xl font-bold text-gray-100 mb-6">أرسل لنا رسالة</h2>
          
          {status === 'success' && (
            <div className="mb-6 p-4 bg-green-500/10 text-green-500 rounded-lg border border-green-500/20">
              تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.
            </div>
          )}
          
          {status === 'error' && (
            <div className="mb-6 p-4 bg-red-500/10 text-red-500 rounded-lg border border-red-500/20">
              {errorMessage}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">الاسم الكامل</label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 bg-gray-950 border border-gray-800 text-white rounded-xl focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none transition-colors" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">البريد الإلكتروني</label>
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 bg-gray-950 border border-gray-800 text-white rounded-xl focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none transition-colors" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">موضوع الرسالة</label>
              <input 
                type="text" 
                value={formData.subject}
                onChange={e => setFormData({...formData, subject: e.target.value})}
                className="w-full px-4 py-3 bg-gray-950 border border-gray-800 text-white rounded-xl focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none transition-colors" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">الرسالة</label>
              <textarea 
                rows={5} 
                required
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
                className="w-full px-4 py-3 bg-gray-950 border border-gray-800 text-white rounded-xl focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none transition-colors resize-none"
              ></textarea>
            </div>
            <button 
              type="submit" 
              disabled={status === 'loading'}
              className="w-full bg-green-500 text-white px-4 py-3 rounded-xl font-medium hover:bg-green-600 transition-colors disabled:opacity-70 mt-2"
            >
              {status === 'loading' ? 'جاري الإرسال...' : 'إرسال الرسالة'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
