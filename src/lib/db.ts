import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  dbInstance = await open({
    filename: path.join(process.cwd(), 'database.sqlite'),
    driver: sqlite3.Database
  });

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT,
      source_url TEXT,
      keywords TEXT,
      published_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Migrations for new columns
  const tableInfo = await dbInstance.all("PRAGMA table_info(articles)");
  const columns = tableInfo.map(c => c.name);
  
  if (!columns.includes('status')) {
    await dbInstance.exec("ALTER TABLE articles ADD COLUMN status TEXT DEFAULT 'published'");
  }
  if (!columns.includes('views')) {
    await dbInstance.exec("ALTER TABLE articles ADD COLUMN views INTEGER DEFAULT 0");
  }
  if (!columns.includes('category')) {
    await dbInstance.exec("ALTER TABLE articles ADD COLUMN category TEXT DEFAULT 'أخبار'");
  }

  return dbInstance;
}
