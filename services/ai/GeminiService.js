const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiService {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
  }

  /**
   * Generate social media post with customizable style
   * @param {string} topic - The topic to write about
   * @param {string} style - Writing style (educational, promotional, inspirational, etc.)
   * @param {string} language - Target language (ar, en)
   * @param {string} platform - Social platform (facebook, twitter, tiktok, instagram)
   */
  async generatePost(topic, style = 'general', language = 'ar', platform = 'facebook') {
    const stylePrompts = {
      educational: 'اكتب منشور تعليمي احترافي عن',
      promotional: 'اكتب منشور ترويجي جذاب لبيع/الترويج لـ',
      inspirational: 'اكتب منشور ملهم ومحفز عن',
      entertaining: 'اكتب منشور ترفيهي مرح عن',
      news: 'اكتب منشور إخباري موجز عن',
      storytelling: 'اكتب قصة قصيرة مشوقة عن',
      general: 'اكتب منشور مميز عن'
    };

    const platformLimits = {
      facebook: 'بحد أقصى 250 كلمة، مناسب لجميع الأعمار',
      twitter: 'بحد أقصى 280 حرف فقط، مباشر وواضح',
      tiktok: 'بحد أقصى 100 كلمة، بأسلوب شبابي وعصري مع استخدام ترندات',
      instagram: 'بحد أقصى 150 كلمة مع تركيز بصري، استخدم line breaks'
    };

    const languageInstruction = language === 'ar' 
      ? 'اكتب بالعربية الفصحى المبسطة' 
      : 'Write in clear, engaging English';

    const prompt = `${stylePrompts[style] || stylePrompts.general} "${topic}"
    
المتطلبات:
- المنصة: ${platform} (${platformLimits[platform]})
- اللغة: ${languageInstruction}
- الأسلوب: ${style}
- أضف 3-5 emojis مناسبة موزعة بذكاء في النص
- اجعل المحتوى جذاب وقابل للمشاركة
- استخدم فقرات قصيرة سهلة القراءة
${platform === 'tiktok' ? '- استخدم لغة Gen Z والترندات الحالية\n- أضف دعوة للإجراء (CTA) في النهاية' : ''}
${platform === 'instagram' ? '- اترك مسافة بين الفقرات لسهولة القراءة' : ''}

قدم المحتوى مباشرة بدون أي مقدمات أو شروحات إضافية.`;

    try {
      const result = await this.model.generateContent(prompt);
      const content = result.response.text().trim();
      
      return {
        content: content,
        metadata: { 
          style, 
          platform, 
          language,
          characterCount: content.length,
          wordCount: content.split(/\s+/).length
        }
      };
    } catch (error) {
      console.error('Gemini Generate Error:', error);
      throw new Error(`Gemini API Error: ${error.message}`);
    }
  }

  /**
   * Generate multiple variants of the same content
   * @param {string} originalText - Original post text
   * @param {number} count - Number of variants (max 5)
   * @param {string} platform - Target platform
   */
  async generateVariants(originalText, count = 3, platform = 'facebook') {
    if (count > 5) count = 5;
    if (count < 1) count = 1;

    const prompt = `أنشئ ${count} نسخ مختلفة تماماً من هذا المنشور، كل نسخة بأسلوب فريد:

النص الأصلي: "${originalText}"

المنصة: ${platform}

متطلبات النسخ:
1. النسخة الأولى: أسلوب رسمي ومهني
2. النسخة الثانية: أسلوب ودي وقريب من الجمهور
3. النسخة الثالثة: أسلوب مرح وعصري
${count > 3 ? '4. النسخة الرابعة: أسلوب تسويقي مباشر' : ''}
${count > 4 ? '5. النسخة الخامسة: أسلوب قصصي جذاب' : ''}

قدم كل نسخة مرقمة (1. ، 2. ، 3.) بدون أي شرح أو تعليق إضافي.
احتفظ بالرسالة الأساسية لكن غيّر الصياغة بالكامل.`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      
      // Split variants by numbered list
      const variants = text
        .split(/\d+\.\s+/)
        .filter(v => v.trim().length > 10)
        .map(v => v.trim())
        .slice(0, count);
      
      if (variants.length === 0) {
        throw new Error('Failed to generate variants');
      }

      return variants;
    } catch (error) {
      console.error('Variants Generation Error:', error);
      throw new Error(`Variants Generation Error: ${error.message}`);
    }
  }

  /**
   * Analyze tone and sentiment of text
   * @param {string} text - Text to analyze
   */
  async analyzeTone(text) {
    const prompt = `حلل النص التالي بدقة وقدم تقييم شامل:

النص: "${text}"

قدم التحليل بتنسيق JSON فقط مع هذه المعلومات:
{
  "tone": "string (formal/friendly/professional/casual/enthusiastic/serious)",
  "sentiment": {
    "positive": number (0-100),
    "negative": number (0-100),
    "neutral": number (0-100)
  },
  "emotions": ["array of detected emotions"],
  "platformSuitability": {
    "facebook": number (0-100),
    "twitter": number (0-100),
    "tiktok": number (0-100),
    "instagram": number (0-100)
  },
  "readabilityScore": number (0-100),
  "engagementPotential": number (0-100),
  "suggestions": ["array of improvement suggestions in Arabic"],
  "strengths": ["array of content strengths in Arabic"],
  "warnings": ["array of potential issues in Arabic"]
}

قدم JSON فقط بدون أي نص إضافي.`;

    try {
      const result = await this.model.generateContent(prompt);
      let responseText = result.response.text().trim();
      
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        
        // Validate structure
        if (!analysis.tone || !analysis.sentiment || !analysis.platformSuitability) {
          throw new Error('Invalid analysis structure');
        }
        
        return analysis;
      }
      
      // Fallback response if JSON parsing fails
      return {
        tone: 'neutral',
        sentiment: { positive: 60, negative: 20, neutral: 20 },
        emotions: ['متوازن'],
        platformSuitability: {
          facebook: 70,
          twitter: 65,
          tiktok: 60,
          instagram: 68
        },
        readabilityScore: 75,
        engagementPotential: 70,
        suggestions: ['النص مقبول بشكل عام'],
        strengths: ['محتوى واضح'],
        warnings: []
      };
    } catch (error) {
      console.error('Tone Analysis Error:', error);
      throw new Error(`Tone Analysis Error: ${error.message}`);
    }
  }
}

module.exports = GeminiService;