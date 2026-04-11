import { getDb } from './src/lib/db.js';

async function seedArticles() {
  const db = await getDb();
  
  const articles = [
    {
      title: 'البيتكوين يتجاوز حاجز الـ 70 ألف دولار لأول مرة',
      slug: 'bitcoin-surpasses-70k',
      summary: 'سجلت عملة البيتكوين رقماً قياسياً جديداً متجاوزة حاجز 70,000 دولار أمريكي وسط تفاؤل المستثمرين.',
      content: '# البيتكوين يحقق أرقاماً تاريخية\n\nفي تطور لافت للسوق، تمكنت عملة البيتكوين من كسر حاجز المقاومة القوي عند 70 ألف دولار...\n\n## أسباب الارتفاع\n* زيادة الطلب المؤسسي\n* اقتراب موعد التنصيف (Halving)\n* الموافقة على صناديق الاستثمار المتداولة (ETFs)',
      image_url: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=1000&auto=format&fit=crop',
      keywords: 'بيتكوين,عملات رقمية,تداول,استثمار',
      status: 'published'
    },
    {
      title: 'إيثريوم تطلق تحديثها الجديد لتقليل رسوم الغاز',
      slug: 'ethereum-new-update-gas-fees',
      summary: 'شبكة إيثريوم تعلن عن نجاح التحديث الأخير الذي يهدف إلى تقليل رسوم المعاملات بشكل كبير.',
      content: '# تحديث إيثريوم الجديد\n\nأعلن مطورو شبكة إيثريوم عن نجاح التحديث المنتظر...\n\n## تأثير التحديث على المتداولين\nيتوقع الخبراء أن يؤدي هذا التحديث إلى زيادة نشاط التطبيقات اللامركزية (dApps) بفضل انخفاض التكلفة.',
      image_url: 'https://images.unsplash.com/photo-1622736136809-ce0b72b5ce9c?q=80&w=1000&auto=format&fit=crop',
      keywords: 'إيثريوم,تحديث,رسوم الغاز,عقود ذكية',
      status: 'published'
    },
    {
      title: 'تحليل فني: هل حان وقت شراء عملة سولانا (SOL)؟',
      slug: 'solana-sol-technical-analysis',
      summary: 'نظرة عميقة على المؤشرات الفنية لعملة سولانا وتوقعات الخبراء للأيام القادمة.',
      content: '# تحليل عملة سولانا\n\nتظهر المؤشرات الفنية لعملة سولانا (SOL) إشارات إيجابية...\n\n## مستويات الدعم والمقاومة\n* **الدعم الأول:** 120 دولار\n* **المقاومة الأولى:** 150 دولار',
      image_url: 'https://images.unsplash.com/photo-1641580529558-a96cf1e668b5?q=80&w=1000&auto=format&fit=crop',
      keywords: 'سولانا,تحليل فني,تداول,كريبتو',
      status: 'published'
    }
  ];

  for (const article of articles) {
    const existing = await db.get('SELECT id FROM articles WHERE slug = ?', [article.slug]);
    if (!existing) {
      await db.run(
        'INSERT INTO articles (title, slug, summary, content, image_url, keywords, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [article.title, article.slug, article.summary, article.content, article.image_url, article.keywords, article.status]
      );
      console.log(`Inserted: ${article.title}`);
    }
  }
  
  console.log('Done seeding articles.');
}

seedArticles().catch(console.error);
