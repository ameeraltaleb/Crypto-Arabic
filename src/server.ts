import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cron from 'node-cron';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { getDb } from './lib/db';
import { fetchAndGenerateArticle } from './services/aiWriter';

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

  // Initialize DB
  await getDb();

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
      const db = await getDb();
      const articles = await db.all('SELECT id, title, slug, status, views, category, published_at FROM articles ORDER BY published_at DESC');
      res.json(articles);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch articles' });
    }
  });

  app.post('/api/admin/articles', authenticateAdmin, async (req, res) => {
    try {
      const db = await getDb();
      const { title, slug, summary, content, status, image_url, keywords, category } = req.body;
      
      // Check if slug exists
      const existing = await db.get('SELECT id FROM articles WHERE slug = ?', [slug]);
      if (existing) {
        return res.status(400).json({ error: 'Slug already exists' });
      }

      await db.run(
        'INSERT INTO articles (title, slug, summary, content, status, image_url, keywords, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [title, slug, summary, content, status, image_url, keywords, category || 'أخبار']
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create article' });
    }
  });

  app.put('/api/admin/articles/:id', authenticateAdmin, async (req, res) => {
    try {
      const db = await getDb();
      const { title, summary, content, status, image_url, keywords, category } = req.body;
      await db.run(
        'UPDATE articles SET title = ?, summary = ?, content = ?, status = ?, image_url = ?, keywords = ?, category = ? WHERE id = ?',
        [title, summary, content, status, image_url, keywords, category || 'أخبار', req.params.id]
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update article' });
    }
  });

  app.delete('/api/admin/articles/:id', authenticateAdmin, async (req, res) => {
    try {
      const db = await getDb();
      await db.run('DELETE FROM articles WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete article' });
    }
  });

  // Settings Routes
  app.get('/api/settings', async (req, res) => {
    try {
      const db = await getDb();
      const settings = await db.all('SELECT key, value FROM settings');
      const settingsObj = settings.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {} as Record<string, string>);
      res.json(settingsObj);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.post('/api/admin/settings', authenticateAdmin, async (req, res) => {
    try {
      const db = await getDb();
      const settings = req.body; // Expecting { key: value, ... }
      
      // Begin transaction
      await db.run('BEGIN TRANSACTION');
      
      for (const [key, value] of Object.entries(settings)) {
        await db.run(
          'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?',
          [key, value, value]
        );
      }
      
      await db.run('COMMIT');
      res.json({ success: true });
    } catch (error) {
      const db = await getDb();
      await db.run('ROLLBACK');
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // Public Routes
  app.get('/api/articles/trending', async (req, res) => {
    try {
      const db = await getDb();
      const articles = await db.all("SELECT id, title, slug, image_url, published_at, views, category, LENGTH(content) as content_length FROM articles WHERE status = 'published' ORDER BY views DESC, published_at DESC LIMIT 5");
      res.json(articles);
    } catch (error) {
      console.error('Error fetching trending articles:', error);
      res.status(500).json({ error: 'Failed to fetch trending articles' });
    }
  });

  app.get('/api/articles', async (req, res) => {
    try {
      const db = await getDb();
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 9;
      const search = req.query.search as string || '';
      const category = req.query.category as string || '';
      const offset = (page - 1) * limit;

      let query = "SELECT id, title, slug, summary, image_url, published_at, views, category, LENGTH(content) as content_length FROM articles WHERE status = 'published'";
      let countQuery = "SELECT COUNT(*) as total FROM articles WHERE status = 'published'";
      const params: any[] = [];

      if (search) {
        query += " AND (title LIKE ? OR summary LIKE ? OR content LIKE ?)";
        countQuery += " AND (title LIKE ? OR summary LIKE ? OR content LIKE ?)";
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam);
      }

      if (category && category !== 'الكل') {
        query += " AND category = ?";
        countQuery += " AND category = ?";
        params.push(category);
      }

      query += " ORDER BY published_at DESC LIMIT ? OFFSET ?";
      
      const totalResult = await db.get(countQuery, params);
      const total = totalResult.total;
      
      params.push(limit, offset);
      const articles = await db.all(query, params);
      
      res.json({
        articles,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching articles:', error);
      res.status(500).json({ error: 'Failed to fetch articles' });
    }
  });

  app.get('/api/articles/:slug/related', async (req, res) => {
    try {
      const db = await getDb();
      const { slug } = req.params;
      
      // Get current article category
      const currentArticle = await db.get("SELECT id, category FROM articles WHERE slug = ?", [slug]);
      if (!currentArticle) return res.status(404).json({ error: 'Article not found' });

      // Fetch related articles from same category
      const articles = await db.all(
        "SELECT id, title, slug, image_url, published_at, category, LENGTH(content) as content_length FROM articles WHERE status = 'published' AND category = ? AND id != ? ORDER BY published_at DESC LIMIT 3",
        [currentArticle.category, currentArticle.id]
      );
      
      res.json(articles);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch related articles' });
    }
  });

  app.get('/api/articles/:slug', async (req, res) => {
    try {
      const db = await getDb();
      const article = await db.get("SELECT * FROM articles WHERE slug = ? AND status = 'published'", [req.params.slug]);
      if (!article) return res.status(404).json({ error: 'Article not found' });
      
      // Increment views
      await db.run('UPDATE articles SET views = views + 1 WHERE id = ?', [article.id]);
      
      res.json(article);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch article' });
    }
  });

  // Dynamic Sitemap for Google Search Console
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const db = await getDb();
      const articles = await db.all("SELECT slug, published_at FROM articles WHERE status = 'published' ORDER BY published_at DESC");
      
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
      const db = await getDb();
      const articles = await db.all("SELECT * FROM articles WHERE status = 'published' ORDER BY published_at DESC LIMIT 20");
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

  // Schedule AI Article Generation (runs every hour)
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { maxAge: '1y', etag: true }));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
