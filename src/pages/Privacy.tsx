import { Helmet } from 'react-helmet-async';

export default function Privacy() {
  return (
    <>
      <Helmet>
        <title>سياسة الخصوصية | كريبتو بالعربي</title>
        <meta name="description" content="سياسة الخصوصية لمنصة كريبتو بالعربي. تعرف على كيفية جمع واستخدام بياناتك." />
        <link rel="canonical" href="https://crypto-arabic.vercel.app/privacy" />
      </Helmet>
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">سياسة الخصوصية</h1>
        <div className="prose dark:prose-invert prose-yellow max-w-none text-gray-700 dark:text-gray-300 leading-relaxed">
          <p>
            نحن في <strong>كريبتو بالعربي</strong> نولي أهمية قصوى لخصوصية زوارنا. توضح سياسة الخصوصية هذه أنواع المعلومات الشخصية التي نتلقاها ونجمعها وكيفية استخدامها.
          </p>
          
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">1. جمع المعلومات</h2>
          <p>
            نقوم بجمع المعلومات التي تقدمها لنا طواعية عند استخدام الموقع، مثل عنوان البريد الإلكتروني عند مراسلتنا أو الاشتراك في خدماتنا.
          </p>

          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">2. ملفات تعريف الارتباط (Cookies)</h2>
          <p>
            يستخدم موقعنا ملفات تعريف الارتباط لتحسين تجربة المستخدم، وتخصيص المحتوى والإعلانات (مثل إعلانات Google AdSense)، وتحليل حركة المرور.
          </p>

          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">3. إعلانات Google AdSense</h2>
          <p>
            نستخدم Google AdSense كطرف ثالث لعرض الإعلانات. تستخدم Google ملفات تعريف الارتباط (DART) لعرض الإعلانات بناءً على زياراتك لموقعنا والمواقع الأخرى على الإنترنت. يمكنك إلغاء الاشتراك في استخدام ملفات تعريف الارتباط DART بزيارة سياسة الخصوصية الخاصة بإعلانات Google.
          </p>

          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">4. أمن البيانات</h2>
          <p>
            نحن نتخذ إجراءات أمنية مناسبة لحماية بياناتك من الوصول غير المصرح به أو التعديل أو الإفصاح أو الإتلاف.
          </p>

          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">5. التغييرات على سياسة الخصوصية</h2>
          <p>
            نحتفظ بالحق في تحديث سياسة الخصوصية هذه في أي وقت. سنقوم بنشر أي تغييرات على هذه الصفحة.
          </p>
        </div>
      </div>
    </>
  );
}
