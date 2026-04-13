import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import cron from 'node-cron';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { fetchAndGenerateArticle } from './services/aiWriter';
import { db as firestore } from './lib/firebase';
import { collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, startAfter, getCountFromServer } from 'firebase/firestore';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY2 || process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('CRITICAL: GEMINI_API_KEY is missing or invalid.');
}

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(compression());
  app.use(cors());
  app.use(helmet({
    contentSecurityPolicy: false,
  }));
  app.use(express.json());
  app.use(cookieParser());

  // Auth Middleware
  const authenticateAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = req.cookies.admin_token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      jwt.verify(token, JWT_SECRET);
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Admin Auth Routes
  app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
      const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
      res.cookie('admin_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
      res.json({ success: true });
    } else {
      res.status(401).json({ error: 'Invalid password' });
    }
  });

  app.post('/api/admin/logout', (req, res) => {
    res.clearCookie('admin_token');
    res.json({ success: true });
  });

  // Admin Article Management
  app.get('/api/admin/articles', authenticateAdmin, async (req, res) => {
    try {
      const q = query(collection(firestore, 'articles'), orderBy('published_at', 'desc'));
      const snapshot = await getDocs(q);
      const articles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(articles);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch articles' });
    }
  });

  app.post('/api/admin/articles', authenticateAdmin, async (req, res) => {
    try {
      const { title, slug, summary, content, status, image_url, keywords, category } = req.body;
      
      const q = query(collection(firestore, 'articles'), where('slug', '==', slug));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return res.status(400).json({ error: 'Slug already exists' });
      }

      await addDoc(collection(firestore, 'articles'), {
        title, slug, summary, content, status, image_url, keywords, category: category || 'أخبار',
        views: 0, published_at: new Date().toISOString()
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create article' });
    }
  });

  app.put('/api/admin/articles/:id', authenticateAdmin, async (req, res) => {
    try {
      const { title, summary, content, status, image_url, keywords, category } = req.body;
      await updateDoc(doc(firestore, 'articles', req.params.id), {
        title, summary, content, status, image_url, keywords, category: category || 'أخبار'
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update article' });
    }
  });

  app.delete('/api/admin/articles/:id', authenticateAdmin, async (req, res) => {
    try {
      await deleteDoc(doc(firestore, 'articles', req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete article' });
    }
  });

  // Settings Routes
  app.get('/api/settings', async (req, res) => {
    try {
      const snapshot = await getDocs(collection(firestore, 'settings'));
      const settingsObj: Record<string, string> = {};
      snapshot.forEach(doc => {
        settingsObj[doc.id] = doc.data().value;
      });
      res.json(settingsObj);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.post('/api/admin/settings', authenticateAdmin, async (req, res) => {
    try {
      const settings = req.body;
      for (const [key, value] of Object.entries(settings)) {
        // Use setDoc with merge to update or create
        const { setDoc } = await import('firebase/firestore');
        await setDoc(doc(firestore, 'settings', key), { key, value }, { merge: true });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // External Cron Endpoint
  app.get('/api/cron/generate', async (req, res) => {
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Run in background
    fetchAndGenerateArticle().catch(console.error);
    res.json({ success: true, message: 'Article generation started in background' });
  });

  // Public Routes
  app.get('/api/articles/trending', async (req, res) => {
    try {
      const q = query(collection(firestore, 'articles'), where('status', '==', 'published'), orderBy('views', 'desc'), limit(5));
      const snapshot = await getDocs(q);
      const articles = snapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, ...data, content_length: data.content?.length || 0 };
      });
      res.json(articles);
    } catch (error) {
      console.error('Error fetching trending articles:', error);
      res.status(500).json({ error: 'Failed to fetch trending articles' });
    }
  });

  app.get('/api/articles', async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limitNum = parseInt(req.query.limit as string) || 9;
      const search = req.query.search as string || '';
      const category = req.query.category as string || '';

      let q = query(collection(firestore, 'articles'), where('status', '==', 'published'));
      
      if (category && category !== 'الكل') {
        q = query(q, where('category', '==', category));
      }

      // Note: Firestore doesn't support native full-text search with LIKE. 
      // We will fetch all matching category/status and filter in memory for search.
      // For a real app, Algolia or Typesense is recommended.
      const snapshot = await getDocs(q);
      let allArticles = snapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, ...data, content_length: data.content?.length || 0 };
      });

      // Sort by published_at desc
      allArticles.sort((a: any, b: any) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

      if (search) {
        const s = search.toLowerCase();
        allArticles = allArticles.filter((a: any) => 
          (a.title && a.title.toLowerCase().includes(s)) || 
          (a.summary && a.summary.toLowerCase().includes(s)) || 
          (a.content && a.content.toLowerCase().includes(s))
        );
      }

      const total = allArticles.length;
      const offset = (page - 1) * limitNum;
      const paginatedArticles = allArticles.slice(offset, offset + limitNum);

      res.json({
        articles: paginatedArticles,
        pagination: {
          total,
          page,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      console.error('Error fetching articles:', error);
      res.status(500).json({ error: 'Failed to fetch articles' });
    }
  });

  app.get('/api/articles/:slug/related', async (req, res) => {
    try {
      const { slug } = req.params;
      
      const q1 = query(collection(firestore, 'articles'), where('slug', '==', slug), limit(1));
      const snap1 = await getDocs(q1);
      if (snap1.empty) return res.status(404).json({ error: 'Article not found' });
      
      const currentArticle = snap1.docs[0].data();
      const currentId = snap1.docs[0].id;

      const q2 = query(collection(firestore, 'articles'), where('status', '==', 'published'), where('category', '==', currentArticle.category), limit(4));
      const snap2 = await getDocs(q2);
      
      const articles = snap2.docs
        .filter(doc => doc.id !== currentId)
        .slice(0, 3)
        .map(doc => ({ id: doc.id, ...doc.data() }));
      
      res.json(articles);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch related articles' });
    }
  });

  app.get('/api/articles/:slug', async (req, res) => {
    try {
      const q = query(collection(firestore, 'articles'), where('slug', '==', req.params.slug), where('status', '==', 'published'), limit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return res.status(404).json({ error: 'Article not found' });
      
      const docSnap = snapshot.docs[0];
      const article = { id: docSnap.id, ...docSnap.data() };
      
      // Increment views
      await updateDoc(doc(firestore, 'articles', docSnap.id), {
        views: (article.views as number || 0) + 1
      });
      
      res.json(article);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch article' });
    }
  });

  // Dynamic Sitemap for Google Search Console
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const q = query(collection(firestore, 'articles'), where('status', '==', 'published'));
      const snapshot = await getDocs(q);
      const articles = snapshot.docs.map(doc => doc.data());
      
      const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`; 

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

      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).end();
    }
  });

  // RSS Feed
  app.get('/rss.xml', async (req, res) => {
    try {
      const q = query(collection(firestore, 'articles'), where('status', '==', 'published'), orderBy('published_at', 'desc'), limit(20));
      const snapshot = await getDocs(q);
      const articles = snapshot.docs.map(doc => doc.data());
      
      const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`; 

      let xml = '<?xml version="1.0" encoding="UTF-8" ?>\n';
      xml += '<rss version="2.0">\n';
      xml += '<channel>\n';
      xml += '  <title>كريبتو بالعربي - أخبار وتحليلات العملات الرقمية</title>\n';
      xml += `  <link>${baseUrl}</link>\n`;
      xml += '  <description>أحدث أخبار وتحليلات العملات الرقمية بالذكاء الاصطناعي</description>\n';

      articles.forEach(article => {
        xml += '  <item>\n';
        xml += `    <title><![CDATA[${article.title}]]></title>\n`;
        xml += `    <link>${baseUrl}/article/${article.slug}</link>\n`;
        xml += `    <description><![CDATA[${article.summary}]]></description>\n`;
        xml += `    <pubDate>${new Date(article.published_at).toUTCString()}</pubDate>\n`;
        xml += '  </item>\n';
      });

      xml += '</channel>\n</rss>';

      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      res.status(500).end();
    }
  });

  // API Endpoint for external cron jobs (e.g., cron-job.org)
  // This solves the "Server Sleep" issue on serverless platforms
  app.get('/api/cron/generate', async (req, res) => {
    console.log('External cron job triggered AI Article Generation...');
    try {
      await fetchAndGenerateArticle();
      res.status(200).json({ success: true, message: 'Article generation triggered successfully' });
    } catch (error) {
      console.error('External cron generation failed:', error);
      res.status(500).json({ success: false, error: 'Failed to generate article' });
    }
  });

  // Schedule AI Article Generation (runs every hour internally)
  cron.schedule('0 * * * *', async () => {
    console.log('Running scheduled AI Article Generation...');
    try {
      await fetchAndGenerateArticle();
    } catch (error) {
      console.error('Scheduled generation failed:', error);
    }
  });

  // Run once on startup for demonstration purposes
  setTimeout(async () => {
    console.log('Running initial AI Article Generation on startup...');
    try {
      await fetchAndGenerateArticle();
    } catch (error) {
      console.error('Initial generation failed:', error);
    }
  }, 5000);

  // Dynamic robots.txt
  app.get('/robots.txt', (req, res) => {
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    res.type('text/plain');
    res.send(`User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${baseUrl}/sitemap.xml`);
  });

  // Vite middleware for development
  let vite: any;
  if (process.env.NODE_ENV !== 'production') {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false, maxAge: '1y', etag: true }));
  }

  // Catch-all route to serve index.html with Open Graph injection
  app.get('*', async (req, res) => {
    try {
      const url = req.originalUrl;
      let template = '';
      
      if (process.env.NODE_ENV !== 'production') {
        template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
      } else {
        template = fs.readFileSync(path.resolve(process.cwd(), 'dist/index.html'), 'utf-8');
      }

      // Check if it's an article page
      const articleMatch = url.match(/^\/article\/([^\/]+)/);
      if (articleMatch) {
        const slug = articleMatch[1];
        const q = query(collection(firestore, 'articles'), where('slug', '==', slug), limit(1));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const article = snapshot.docs[0].data();
          const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
          const articleUrl = `${baseUrl}/article/${slug}`;
          const imageUrl = article.image_url || `${baseUrl}/default-image.jpg`;

          const metaTags = `
    <title>${article.title} | كريبتو بالعربي</title>
    <meta name="description" content="${article.summary}" />
    <meta property="og:title" content="${article.title}" />
    <meta property="og:description" content="${article.summary}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:url" content="${articleUrl}" />
    <meta property="og:type" content="article" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${article.title}" />
    <meta name="twitter:description" content="${article.summary}" />
    <meta name="twitter:image" content="${imageUrl}" />
          `;

          // Replace default title and description
          template = template.replace(/<title>.*?<\/title>/, '');
          template = template.replace(/<meta name="description".*?\/>/, '');
          template = template.replace('</head>', `${metaTags}\n</head>`);
        }
      }

      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      console.error('Error serving HTML:', e);
      res.status(500).end(e instanceof Error ? e.message : String(e));
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
