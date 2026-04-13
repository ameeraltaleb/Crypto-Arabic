import Parser from 'rss-parser';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import slugify from 'slugify';
import dotenv from 'dotenv';
import { collection, query, where, getDocs, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

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
  'https://decrypt.co/feed',
  'https://blockworks.co/feed',
  'https://thedefiant.io/api/feed'
];

export async function fetchAndGenerateArticle() {
  console.log('Starting AI Article Generation Process...');
  try {
    // 1. Fetch latest news from RSS feeds
    let latestNewsItem = null;
    for (const feedUrl of RSS_FEEDS) {
      try {
        const feed = await parser.parseURL(feedUrl);
        if (feed.items && feed.items.length > 0) {
          // Find an item we haven't processed yet
          for (const item of feed.items) {
            const q = query(
              collection(db, 'articles'),
              where('source_url', '==', item.link),
              limit(1)
            );
            const snapshot = await getDocs(q);
            if (snapshot.empty) {
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
      8. Provide a highly descriptive English prompt (image_prompt) for an AI image generator. It should visually represent the specific news event in a cinematic, professional digital art style. Do NOT include text or words in the image.
      9. Do not translate word-for-word; adapt the tone for an Arab crypto trader audience.
      10. INTERNAL LINKING: Whenever you mention general terms like "بيتكوين" or "عملات بديلة" or "تداول", wrap them in markdown links pointing to the home page with category filter, e.g., [البيتكوين](/?category=بيتكوين) or [العملات البديلة](/?category=عملات+بديلة).

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
        image_prompt: { type: Type.STRING, description: "Highly descriptive English prompt for AI image generation representing the news event" }
      },
      required: ["title", "summary", "content", "keywords", "category", "image_prompt"]
    };

    let response;
    let retries = 5;
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
            // Extract the suggested retry delay from the error message, default to 10 seconds
            const match = error?.message?.match(/retry in ([\d\.]+)s/i);
            waitTime = match ? (Math.ceil(parseFloat(match[1])) + 2) * 1000 : 10000;
          } else {
            // Add jitter to 503 wait time
            waitTime = delay + Math.random() * 2000;
          }
          
          // Switch model on error to avoid waiting too long
          if (retries === 4) {
            console.log(`Switching to gemini-3.1-pro-preview due to ${isRateLimited ? '429' : '503'} error...`);
            currentModel = 'gemini-3.1-pro-preview';
          } else if (retries === 2) {
            console.log(`Switching to gemini-3.1-flash-lite-preview due to ${isRateLimited ? '429' : '503'} error...`);
            currentModel = 'gemini-3.1-flash-lite-preview';
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
    
    // 3. Save to Firestore
    const baseSlug = slugify(generatedData.title, { lower: true, strict: true, locale: 'ar' }) || 'crypto-news';
    let slug = baseSlug;
    let counter = 1;
    
    // Ensure unique slug (simple check)
    const slugQ = query(collection(db, 'articles'), where('slug', '==', slug), limit(1));
    const slugSnapshot = await getDocs(slugQ);
    if (!slugSnapshot.empty) {
      slug = `${baseSlug}-${Date.now()}`;
    }

    // Generate a highly relevant, royalty-free AI image using Pollinations.ai based on the detailed prompt
    const basePrompt = generatedData.image_prompt || 'cryptocurrency trading concept';
    const imagePrompt = `${basePrompt}, professional digital art, highly detailed, cinematic lighting, no text, no words`;
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1200&height=630&nologo=true`;

    await addDoc(collection(db, 'articles'), {
      title: generatedData.title,
      slug: slug,
      summary: generatedData.summary,
      content: generatedData.content,
      image_url: imageUrl,
      source_url: latestNewsItem.link,
      keywords: generatedData.keywords,
      status: 'published',
      category: generatedData.category || 'أخبار',
      views: 0,
      published_at: new Date().toISOString()
    });

    console.log(`Successfully generated and saved article to Firestore: ${generatedData.title}`);

    // Post to Telegram if configured
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (botToken && chatId) {
      try {
        const appUrl = process.env.APP_URL || 'https://crypto-blog.com';
        const text = `🚀 *${generatedData.title}*\n\n${generatedData.summary}\n\n🔗 اقرأ المزيد:\n${appUrl}/article/${slug}`;
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
        });
        console.log('Successfully posted to Telegram');
      } catch (e) {
        console.error('Failed to post to Telegram:', e);
      }
    }

  } catch (error) {
    console.error('Error in AI Article Generation:', error);
  }
}
