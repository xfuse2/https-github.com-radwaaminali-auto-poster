const express = require('express');
const router = express.Router();
const GeminiService = require('../services/ai/GeminiService');
const OpenAIService = require('../services/ai/OpenAIService');
const HashtagService = require('../services/hashtag/HashtagService');
const TranslationService = require('../services/ai/TranslationService');

// Initialize services with API keys from environment
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Create service instances
let geminiService, openaiService, hashtagService, translationService;

try {
  geminiService = new GeminiService(GEMINI_API_KEY);
  hashtagService = new HashtagService(GEMINI_API_KEY);
  translationService = new TranslationService(GEMINI_API_KEY);
  
  // OpenAI is optional (for image generation)
  if (OPENAI_API_KEY && OPENAI_API_KEY !== 'your_openai_api_key_here') {
    openaiService = new OpenAIService(OPENAI_API_KEY);
  }
} catch (error) {
  console.error('❌ AI Services Initialization Error:', error.message);
}

// ============================================
// 1. AI WRITER - Generate Content
// ============================================
router.post('/generate-content', async (req, res) => {
  const { topic, style, language, platform } = req.body;
  
  // Validation
  if (!topic || topic.trim().length === 0) {
    return res.status(400).json({ 
      success: false,
      error: 'الموضوع مطلوب (Topic is required)' 
    });
  }
  
  try {
    const result = await geminiService.generatePost(
      topic.trim(), 
      style || 'general', 
      language || 'ar', 
      platform || 'facebook'
    );
    
    res.json({ 
      success: true, 
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Generate Content Error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ============================================
// 2. CAPTION VARIANTS - Generate Multiple Versions
// ============================================
router.post('/generate-variants', async (req, res) => {
  const { text, count, platform } = req.body;
  
  if (!text || text.trim().length === 0) {
    return res.status(400).json({ 
      success: false,
      error: 'النص مطلوب (Text is required)' 
    });
  }
  
  const variantCount = Math.min(parseInt(count) || 3, 5);
  
  try {
    const variants = await geminiService.generateVariants(
      text.trim(), 
      variantCount, 
      platform || 'facebook'
    );
    
    res.json({ 
      success: true, 
      variants,
      count: variants.length,
      original: text,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Generate Variants Error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ============================================
// 3. TONE ANALYZER - Analyze Content Tone
// ============================================
router.post('/analyze-tone', async (req, res) => {
  const { text } = req.body;
  
  if (!text || text.trim().length === 0) {
    return res.status(400).json({ 
      success: false,
      error: 'النص مطلوب (Text is required)' 
    });
  }
  
  try {
    const analysis = await geminiService.analyzeTone(text.trim());
    
    res.json({ 
      success: true, 
      analysis,
      textLength: text.length,
      wordCount: text.split(/\s+/).length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Tone Analysis Error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ============================================
// 4. IMAGE GENERATOR - Generate AI Images
// ============================================
router.post('/generate-image', async (req, res) => {
  // Check if OpenAI service is available
  if (!openaiService) {
    return res.status(503).json({ 
      success: false,
      error: 'Image generation is not available. Please set OPENAI_API_KEY in .env file.',
      hint: 'Get your API key from https://platform.openai.com/api-keys'
    });
  }
  
  const { prompt, size, quality, style, enhancePrompt } = req.body;
  
  if (!prompt || prompt.trim().length === 0) {
    return res.status(400).json({ 
      success: false,
      error: 'وصف الصورة مطلوب (Image prompt is required)' 
    });
  }
  
  try {
    // Optionally enhance the prompt
    let finalPrompt = prompt.trim();
    if (enhancePrompt === true) {
      try {
        finalPrompt = await openaiService.enhancePrompt(finalPrompt);
      } catch (enhanceError) {
        console.warn('Prompt enhancement failed, using original:', enhanceError.message);
      }
    }
    
    const result = await openaiService.generateImage(finalPrompt, { 
      size: size || '1024x1024',
      quality: quality || 'standard',
      style: style || 'vivid',
      n: 1
    });
    
    res.json({ 
      success: true, 
      ...result,
      originalPrompt: prompt,
      enhancedPrompt: finalPrompt !== prompt ? finalPrompt : null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Image Generation Error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ============================================
// 5. HASHTAG GENERATOR - Generate Hashtags
// ============================================
router.post('/generate-hashtags', async (req, res) => {
  const { content, platform, count } = req.body;
  
  if (!content || content.trim().length === 0) {
    return res.status(400).json({ 
      success: false,
      error: 'المحتوى مطلوب (Content is required)' 
    });
  }
  
  const hashtagCount = Math.min(parseInt(count) || 10, 30);
  
  try {
    const hashtags = await hashtagService.generateHashtags(
      content.trim(), 
      platform || 'instagram', 
      hashtagCount
    );
    
    res.json({ 
      success: true, 
      hashtags,
      count: hashtags.length,
      platform: platform || 'instagram',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Hashtag Generation Error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get trending hashtags
router.get('/trending-hashtags/:platform', async (req, res) => {
  const { platform } = req.params;
  const { category } = req.query;
  
  try {
    const hashtags = await hashtagService.getTrendingHashtags(
      platform, 
      category || 'general'
    );
    
    res.json({ 
      success: true, 
      hashtags,
      platform,
      category: category || 'general',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Trending Hashtags Error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Analyze hashtags
router.post('/analyze-hashtags', async (req, res) => {
  const { hashtags } = req.body;
  
  if (!hashtags || !Array.isArray(hashtags) || hashtags.length === 0) {
    return res.status(400).json({ 
      success: false,
      error: 'مصفوفة الهاشتاجات مطلوبة (Hashtags array is required)' 
    });
  }
  
  try {
    const analysis = await hashtagService.analyzeHashtags(hashtags);
    
    res.json({ 
      success: true, 
      analysis,
      hashtags,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Hashtag Analysis Error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ============================================
// 6. TRANSLATION - Translate Content
// ============================================
router.post('/translate', async (req, res) => {
  const { text, targetLanguage, sourceLanguage } = req.body;
  
  if (!text || text.trim().length === 0) {
    return res.status(400).json({ 
      success: false,
      error: 'النص مطلوب (Text is required)' 
    });
  }
  
  if (!targetLanguage) {
    return res.status(400).json({ 
      success: false,
      error: 'اللغة المستهدفة مطلوبة (Target language is required)' 
    });
  }
  
  try {
    const result = await translationService.translate(
      text.trim(), 
      targetLanguage, 
      sourceLanguage || 'auto'
    );
    
    res.json({ 
      success: true, 
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Translation Error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Translate to multiple languages
router.post('/translate-multiple', async (req, res) => {
  const { text, targetLanguages } = req.body;
  
  if (!text || text.trim().length === 0) {
    return res.status(400).json({ 
      success: false,
      error: 'النص مطلوب (Text is required)' 
    });
  }
  
  if (!targetLanguages || !Array.isArray(targetLanguages) || targetLanguages.length === 0) {
    return res.status(400).json({ 
      success: false,
      error: 'مصفوفة اللغات المستهدفة مطلوبة (Target languages array is required)' 
    });
  }
  
  try {
    const result = await translationService.translateMultiple(
      text.trim(), 
      targetLanguages
    );
    
    res.json({ 
      success: true, 
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Multiple Translation Error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Detect language
router.post('/detect-language', async (req, res) => {
  const { text } = req.body;
  
  if (!text || text.trim().length === 0) {
    return res.status(400).json({ 
      success: false,
      error: 'النص مطلوب (Text is required)' 
    });
  }
  
  try {
    const detection = await translationService.detectLanguage(text.trim());
    
    res.json({ 
      success: true, 
      ...detection,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Language Detection Error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get supported languages
router.get('/supported-languages', (req, res) => {
  const languages = translationService.getSupportedLanguages();
  
  res.json({ 
    success: true, 
    languages,
    count: Object.keys(languages).length,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// HEALTH CHECK
// ============================================
router.get('/health', (req, res) => {
  res.json({
    success: true,
    services: {
      gemini: !!geminiService,
      openai: !!openaiService,
      hashtag: !!hashtagService,
      translation: !!translationService
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;