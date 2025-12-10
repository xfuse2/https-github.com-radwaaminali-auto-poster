const { GoogleGenerativeAI } = require("@google/generative-ai");

class HashtagService {
  constructor(geminiApiKey) {
    this.genAI = new GoogleGenerativeAI(geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
  }

  /**
   * Generate relevant hashtags for content
   * @param {string} content - Post content
   * @param {string} platform - Social platform
   * @param {number} count - Number of hashtags
   */
  async generateHashtags(content, platform = 'instagram', count = 10) {
    const platformGuidelines = {
      instagram: `استخدم 20-30 hashtag متنوع:
- 30% hashtags شائعة جداً (1M+ منشور)
- 40% hashtags متوسطة الشيوع (100K-1M)
- 30% hashtags niche محددة (10K-100K)`,
      facebook: 'استخدم 1-3 hashtags فقط، مركزة جداً وذات صلة مباشرة',
      twitter: 'استخدم 1-2 hashtags قصيرة وواضحة، تجنب الإكثار',
      tiktok: 'استخدم 3-5 hashtags (ترندينج + niche)، مزيج من الشائع والمتخصص'
    };

    const prompt = `بناءً على هذا المحتوى، اقترح ${count} hashtags احترافية مناسبة للنشر على ${platform}:

المحتوى: "${content}"

إرشادات المنصة: ${platformGuidelines[platform]}

متطلبات الـ Hashtags:
- يجب أن تكون ذات صلة مباشرة بالمحتوى
- مزيج من الإنجليزية والعربية (إن كان المحتوى عربي)
- تجنب الهاشتاجات العامة جداً مثل #love أو #photo
- استخدم كلمات بدون مسافات
- قدم هاشتاجات فعلية مستخدمة حالياً

قدم الـ hashtags فقط بتنسيق: #hashtag1 #hashtag2 #hashtag3 (بدون ترقيم أو شرح أو أسطر منفصلة)`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      
      // Extract hashtags using regex (supports Arabic, English, numbers, underscore)
      const hashtags = text.match(/#[\u0621-\u064Aa-zA-Z0-9_]+/g) || [];
      
      // Remove duplicates and limit to requested count
      const uniqueHashtags = [...new Set(hashtags)].slice(0, count);
      
      if (uniqueHashtags.length === 0) {
        // Fallback generic hashtags
        return this.getFallbackHashtags(platform, count);
      }

      return uniqueHashtags;
    } catch (error) {
      console.error('Hashtag Generation Error:', error);
      // Return fallback hashtags on error
      return this.getFallbackHashtags(platform, count);
    }
  }

  /**
   * Get trending hashtags for a platform and category
   * @param {string} platform - Social platform
   * @param {string} category - Content category
   */
  async getTrendingHashtags(platform = 'instagram', category = 'general') {
    const prompt = `اقترح 15 hashtag ترندينج حالياً (ديسمبر 2025) على ${platform} في مجال "${category}".

المتطلبات:
- يجب أن تكون هاشتاجات شائعة ومستخدمة بكثرة حالياً
- مزيج من الإنجليزية والعربية
- ذات صلة بالمجال المطلوب
- قابلة للاستخدام في أي محتوى بهذا المجال

قدم الـ hashtags فقط بتنسيق: #hashtag1 #hashtag2 (بدون شرح)`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const hashtags = text.match(/#[\u0621-\u064Aa-zA-Z0-9_]+/g) || [];
      return [...new Set(hashtags)].slice(0, 15);
    } catch (error) {
      console.error('Trending Hashtags Error:', error);
      return [];
    }
  }

  /**
   * Analyze hashtag performance potential
   * @param {array} hashtags - Array of hashtags to analyze
   */
  async analyzeHashtags(hashtags) {
    const hashtagList = hashtags.join(' ');
    
    const prompt = `حلل هذه الـ Hashtags وقيّم فعاليتها:

${hashtagList}

قدم التحليل بتنسيق JSON:
{
  "overallScore": number (0-100),
  "strengths": ["array of strengths"],
  "weaknesses": ["array of weaknesses"],
  "suggestions": ["array of improvement suggestions"],
  "estimated_reach": "low/medium/high",
  "competition_level": "low/medium/high"
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        overallScore: 70,
        strengths: ['مجموعة متنوعة'],
        weaknesses: [],
        suggestions: ['جيد بشكل عام'],
        estimated_reach: 'medium',
        competition_level: 'medium'
      };
    } catch (error) {
      console.error('Hashtag Analysis Error:', error);
      return null;
    }
  }

  /**
   * Fallback hashtags when generation fails
   */
  getFallbackHashtags(platform, count) {
    const fallbacks = {
      instagram: ['#instagood', '#photooftheday', '#instagram', '#love', '#like', '#follow', '#instalike', '#instadaily', '#picoftheday', '#likeforlikes'],
      facebook: ['#facebook', '#socialmedia', '#trending'],
      twitter: ['#twitter', '#trending'],
      tiktok: ['#fyp', '#foryou', '#viral', '#trending', '#tiktok']
    };
    
    return (fallbacks[platform] || fallbacks.instagram).slice(0, count);
  }
}

module.exports = HashtagService;