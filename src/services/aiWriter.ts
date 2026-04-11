import Parser from 'rss-parser';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { getDb } from '../lib/db';
import slugify from 'slugify';
import dotenv from 'dotenv';

dotenv.config();

const parser = new Parser();

// Use the GEMINI_API_KEY injected by AI Studio
const apiKey = process.env.GEMINI_API_KEY2 || process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

const RSS_FEEDS = [
  'https://cointelegraph.com/rss',
  'https://www.coindesk.com/arc/outboundfeeds/rss/',
  'https://cryptoslate.com/feed/',
  'https://bitcoinmagazine.com/.rss/full/',
  'https://decrypt.co/feed'
];

export async function fetchAndGenerateArticle() {
  console.log('Starting AI Article Generation Process...');
  try {
    const db = await getDb();
    
    // 1. Fetch latest news from RSS feeds
    let latestNewsItem = null;
    for (const feedUrl of RSS_FEEDS) {
      try {
        const feed = await parser.parseURL(feedUrl);
        if (feed.items && feed.items.length > 0) {
          // Find an item we haven't processed yet
          for (const item of feed.items) {
            const existing = await db.get('SELECT id FROM articles WHERE source_url = ?', [item.link]);
            if (!existing) {
              latestNewsItem = item;
              break;
            }
          }
        }
      } catch (e) {
        console.error(`Error fetching feed ${feedUrl}:`, e);
      }
      if (latestNewsItem) break;
    }

    if (!latestNewsItem) {
      console.log('No new articles found in RSS feeds.');
      return;
    }

    console.log(`Found new article to process: ${latestNewsItem.title}`);

    // 2. Use Gemini to rewrite and format the article
    const prompt = `
      You are an expert crypto and trading blogger writing for a high-quality Arabic blog.
      I will provide you with a news article from an English source.
      Your task is to rewrite it completely in professional, engaging Arabic.
      
      Requirements:
      1. Create a catchy, click-worthy Arabic title.
      2. Write a short, engaging summary (max 2 sentences).
      3. Write the full article content in Markdown format. The article MUST be detailed, comprehensive, and at least 400-600 words.
      4. Structure the Markdown content strictly as follows:
         - Engaging Introduction (مقدمة).
         - Main Details & Analysis (تفاصيل الخبر والتحليل) using ## headings.
         - Impact on the Crypto Market / Investors (التأثير على سوق الكريبتو) using ## headings.
         - Conclusion (خلاصة).
         - FAQ section (أسئلة شائعة) with 2-3 relevant questions and short answers using ### headings for questions.
      5. Use bold text for important terms, and bullet points where appropriate to make it easy to read.
      6. Extract 3-5 relevant SEO keywords in Arabic (comma separated).
      7. Categorize the article into ONE of the following categories: 'أخبار', 'تحليل', 'تعليم', 'عملات بديلة', 'بيتكوين'.
      8. Provide a single English keyword (e.g., "bitcoin", "trading", "chart", "money", "blockchain") that visually represents the article.
      9. Do not translate word-for-word; adapt the tone for an Arab crypto trader audience.

      Source Title: ${latestNewsItem.title}
      Source Content/Snippet: ${latestNewsItem.contentSnippet || latestNewsItem.content}
      Source Link: ${latestNewsItem.link}
    `;

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Catchy Arabic title" },
        summary: { type: Type.STRING, description: "Short Arabic summary" },
        content: { type: Type.STRING, description: "Full article content in Markdown format" },
        keywords: { type: Type.STRING, description: "Comma separated Arabic keywords" },
        category: { type: Type.STRING, description: "One of: أخبار, تحليل, تعليم, عملات بديلة, بيتكوين" },
        image_keyword: { type: Type.STRING, description: "A single English word representing the visual theme (e.g., bitcoin, chart, finance)" }
      },
      required: ["title", "summary", "content", "keywords", "category", "image_keyword"]
    };

    let response;
    let retries = 8;
    let delay = 5000; // Start with 5 seconds delay
    let currentModel = 'gemini-3-flash-preview';

    while (retries > 0) {
      try {
        response = await ai.models.generateContent({
          model: currentModel,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
            temperature: 0.7
          }
        });
        break; // Success, exit loop
      } catch (error: any) {
        const isUnavailable = error?.status === 503 || 
                              error?.message?.includes('503') || 
                              error?.message?.includes('UNAVAILABLE');
        const isRateLimited = error?.status === 429 || 
                              error?.message?.includes('429') || 
                              error?.message?.includes('RESOURCE_EXHAUSTED') ||
                              error?.message?.includes('Quota exceeded');
                              
        if ((isUnavailable || isRateLimited) && retries > 1) {
          let waitTime = delay;
          if (isRateLimited) {
            // Extract the suggested retry delay from the error message, default to 65 seconds
            const match = error?.message?.match(/retry in ([\d\.]+)s/i);
            waitTime = match ? (Math.ceil(parseFloat(match[1])) + 5) * 1000 : 65000;
          } else {
            // Add jitter to 503 wait time
            waitTime = delay + Math.random() * 2000;
            
            // Fallback to other models if 503 persists
            if (retries === 6) {
              console.log('Switching to gemini-flash-latest due to persistent 503 errors...');
              currentModel = 'gemini-flash-latest';
            } else if (retries === 3) {
              console.log('Switching to gemini-3.1-pro-preview due to persistent 503 errors...');
              currentModel = 'gemini-3.1-pro-preview';
            }
          }
          
          console.warn(`Gemini API error (${isRateLimited ? '429 Rate Limit' : '503 Unavailable'}) on ${currentModel}. Retries left: ${retries - 1}. Waiting ${Math.round(waitTime)}ms...`);
          retries--;
          await new Promise(resolve => setTimeout(resolve, waitTime));
          if (!isRateLimited) delay *= 2; // Exponential backoff only for 503
        } else {
          throw error; // Re-throw if out of retries or other error
        }
      }
    }

    if (!response || !response.text) {
      throw new Error("Gemini returned empty response");
    }

    const generatedData = JSON.parse(response.text);
    
    // 3. Save to Database
    const baseSlug = slugify(generatedData.title, { lower: true, strict: true, locale: 'ar' }) || 'crypto-news';
    let slug = baseSlug;
    let counter = 1;
    
    // Ensure unique slug
    while (await db.get('SELECT id FROM articles WHERE slug = ?', [slug])) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Generate a highly relevant, royalty-free AI image using Pollinations.ai based on the keyword
    const keyword = generatedData.image_keyword || 'cryptocurrency';
    const imagePrompt = `High quality professional digital art concept of ${keyword}, finance, trading, crypto blog header`;
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1200&height=630&nologo=true`;

    await db.run(
      `INSERT INTO articles (title, slug, summary, content, image_url, source_url, keywords, status, category) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        generatedData.title,
        slug,
        generatedData.summary,
        generatedData.content,
        imageUrl,
        latestNewsItem.link,
        generatedData.keywords,
        'published', // Save as published by default
        generatedData.category || 'أخبار'
      ]
    );

    console.log(`Successfully generated and saved article: ${generatedData.title}`);

  } catch (error) {
    console.error('Error in AI Article Generation:', error);
  }
}
