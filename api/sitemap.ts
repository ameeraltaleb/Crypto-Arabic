import { db } from '../src/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export default async function handler(req: any, res: any) {
  try {
    const q = query(collection(db, 'articles'), where('status', '==', 'published'));
    const snapshot = await getDocs(q);
    const articles = snapshot.docs.map(doc => doc.data());
    
    const baseUrl = 'https://crypto-arabic.vercel.app';

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    const staticPages = ['', '/about', '/contact', '/privacy', '/terms'];
    staticPages.forEach(page => {
      xml += `  <url>\n    <loc>${baseUrl}${page}</loc>\n    <changefreq>daily</changefreq>\n    <priority>${page === '' ? '1.0' : '0.8'}</priority>\n  </url>\n`;
    });

    articles.forEach(article => {
      xml += `  <url>\n    <loc>${baseUrl}/article/${article.slug}</loc>\n    <lastmod>${new Date(article.published_at).toISOString()}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
    });

    xml += '</urlset>';

    res.setHeader('Content-Type', 'text/xml');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).send(xml);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
}
