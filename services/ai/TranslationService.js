const { GoogleGenerativeAI } = require("@google/generative-ai");
const ISO6391 = require('iso-639-1');

class TranslationService {
  constructor(geminiApiKey) {
    this.genAI = new GoogleGenerativeAI(geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Supported languages
    this.supportedLanguages = {
      ar: 'العربية',
      en: 'English',
      fr: 'Français',
      es: 'Español',
      de: 'Deutsch',
      it: 'Italiano',
      tr: 'Türkçe',
      ru: 'Русский',
      zh: '中文',
      ja: '日本語',
      ko: '한국어',
      pt: 'Português',
      nl: 'Nederlands',
      pl: 'Polski',
      sv: 'Svenska',
      hi: 'हिन्दी',
      ur: 'اردو'
    };
  }

  /**
   * Translate text to target language
   * @param {string} text - Text to translate
   * @param {string} targetLanguage - Target language code (ISO 639-1)
   * @param {string} sourceLanguage - Source language code (auto-detect if not provided)
   */
  async translate(text, targetLanguage, sourceLanguage = 'auto') {
    // Get language names
    const targetLangName = this.supportedLanguages[targetLanguage] || 
                           ISO6391.getName(targetLanguage) || 
                           targetLanguage;
    
    const sourceLangName = sourceLanguage === 'auto' 
      ? 'تلقائي' 
      : (this.supportedLanguages[sourceLanguage] || ISO6391.getName(sourceLanguage));

    const prompt = `ترجم النص التالي إلى ${targetLangName} مع الالتزام التام بالقواعد التالية:

النص الأصلي: "${text}"

قواعد الترجمة:
1. احتفظ بنفس النبرة والأسلوب (رسمي/ودي/مرح)
2. احتفظ بجميع الـ emojis في نفس مواقعها
3. احتفظ بالـ hashtags كما هي بدون ترجمة
4. احتفظ بأسماء العلامات التجارية بدون تعديل
5. احتفظ بالأرقام والتواريخ بنفس التنسيق
6. اجعل الترجمة طبيعية وسلسة، ليست حرفية
7. إذا كان النص يحتوي على مصطلحات تقنية، استخدم المصطلح الشائع في اللغة المستهدفة

قدم الترجمة فقط بدون أي شرح أو مقدمات أو علامات اقتباس.`;

    try {
      const result = await this.model.generateContent(prompt);
      const translatedText = result.response.text().trim();
      
      // Remove quotes if present
      const cleanedText = translatedText.replace(/^["']|["']$/g, '');
      
      return {
        translatedText: cleanedText,
        sourceLanguage: sourceLanguage,
        targetLanguage: targetLanguage,
        sourceLangName: sourceLangName,
        targetLangName: targetLangName,
        characterCount: cleanedText.length,
        originalCharacterCount: text.length
      };
    } catch (error) {
      console.error('Translation Error:', error);
      throw new Error(`Translation Error: ${error.message}`);
    }
  }

  /**
   * Translate text to multiple languages at once
   * @param {string} text - Text to translate
   * @param {array} targetLanguages - Array of target language codes
   */
  async translateMultiple(text, targetLanguages = ['en', 'fr', 'es']) {
    const translations = {};
    const errors = {};
    
    // Translate to each language
    for (const lang of targetLanguages) {
      try {
        const result = await this.translate(text, lang);
        translations[lang] = {
          text: result.translatedText,
          language: result.targetLangName,
          success: true
        };
      } catch (error) {
        errors[lang] = error.message;
        translations[lang] = {
          text: null,
          language: this.supportedLanguages[lang] || lang,
          success: false,
          error: error.message
        };
      }
    }
    
    return {
      original: text,
      translations: translations,
      totalLanguages: targetLanguages.length,
      successCount: Object.values(translations).filter(t => t.success).length,
      errors: Object.keys(errors).length > 0 ? errors : null
    };
  }

  /**
   * Detect language of text
   * @param {string} text - Text to analyze
   */
  async detectLanguage(text) {
    const prompt = `حدد لغة هذا النص وقدم الإجابة بتنسيق JSON فقط:

النص: "${text}"

{
  "languageCode": "ISO 639-1 code (ar, en, fr, etc.)",
  "languageName": "اسم اللغة",
  "confidence": "نسبة الثقة من 0 إلى 100"
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        languageCode: 'unknown',
        languageName: 'Unknown',
        confidence: 0
      };
    } catch (error) {
      console.error('Language Detection Error:', error);
      return {
        languageCode: 'unknown',
        languageName: 'Unknown',
        confidence: 0
      };
    }
  }

  /**
   * Get list of supported languages
   */
  getSupportedLanguages() {
    return this.supportedLanguages;
  }
}

module.exports = TranslationService;