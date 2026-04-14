import { Helmet } from 'react-helmet-async';

export default function About() {
  return (
    <>
      <Helmet>
        <title>من نحن | كريبتو بالعربي</title>
        <meta name="description" content="تعرف على منصة كريبتو بالعربي، المنصة الرائدة في أخبار وتحليلات العملات الرقمية في العالم العربي." />
        <link rel="canonical" href="https://crypto-arabic.vercel.app/about" />
      </Helmet>
      <div className="max-w-3xl mx-auto bg-gray-900 rounded-2xl p-8 shadow-sm border border-gray-800">
        <h1 className="text-3xl font-bold text-gray-100 mb-6">من نحن</h1>
        <div className="prose prose-invert prose-green max-w-none text-gray-300 leading-relaxed">
          <p>
            مرحباً بك في <strong>كريبتو بالعربي</strong>، المنصة الأولى المتخصصة في تقديم أحدث أخبار وتحليلات سوق العملات الرقمية (الكريبتو) للمتداول والمستثمر العربي.
          </p>
          <p>
            تأسست المنصة بهدف إثراء المحتوى العربي المالي والتقني، من خلال توفير تغطية شاملة ودقيقة لأهم الأحداث الاقتصادية وتطورات تقنية البلوكشين (Blockchain) باستخدام أحدث تقنيات الذكاء الاصطناعي.
          </p>
          <h2 className="text-xl font-bold text-gray-100 mt-8 mb-4">رؤيتنا</h2>
          <p>
            أن نكون الوجهة الأولى والموثوقة لكل مهتم بمجال العملات الرقمية في العالم العربي، والمساهمة في نشر الوعي المالي والتقني لبناء مجتمع استثماري واعي.
          </p>
          <h2 className="text-xl font-bold text-gray-100 mt-8 mb-4">ماذا نقدم؟</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>تغطية إخبارية لحظية لأهم أحداث سوق الكريبتو.</li>
            <li>تحليلات فنية وأساسية للعملات الرقمية الرائدة والبديلة.</li>
            <li>محتوى تعليمي مبسط للمبتدئين في مجال التداول والاستثمار.</li>
            <li>استخدام الذكاء الاصطناعي لتقديم ملخصات دقيقة وسريعة للأخبار العالمية.</li>
          </ul>
        </div>
      </div>
    </>
  );
}
