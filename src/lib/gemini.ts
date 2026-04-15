import { GoogleGenAI } from "@google/genai";

// Use process.env.GEMINI_API_KEY as per instructions
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateDailySummary(marketData: any[], newsData: any[]) {
  const prompt = `
    أنت خبير في العملات الرقمية ومحلل مالي في منصة "كريبتو بالعربي".
    مهمتك هي كتابة ملخص يومي جذاب واحترافي للسوق بناءً على البيانات التالية:
    
    بيانات السوق الحالية:
    ${JSON.stringify(marketData.slice(0, 10).map(c => ({ name: c.name, price: c.current_price, change: c.price_change_percentage_24h })))}
    
    أحدث الأخبار:
    ${JSON.stringify(newsData.slice(0, 5).map(n => ({ title: n.title, summary: n.summary })))}
    
    المطلوب:
    1. عنوان جذاب للملخص اليومي.
    2. مقدمة قصيرة عن حالة السوق العامة (صعود، هبوط، تذبذب).
    3. تحليل سريع لأداء أهم العملات (بيتكوين، إيثيريوم).
    4. ملخص لأهم خبرين وتأثيرهما المتوقع.
    5. نصيحة اليوم للمتداولين (بناءً على حالة السوق).
    
    اجعل الأسلوب احترافياً، مشوقاً، وباللغة العربية الفصحى البسيطة. استخدم الرموز التعبيرية (Emojis) المناسبة.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "عذراً، لم نتمكن من توليد النص حالياً.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "عذراً، حدث خطأ أثناء توليد الملخص اليومي. يرجى المحاولة لاحقاً.";
  }
}
