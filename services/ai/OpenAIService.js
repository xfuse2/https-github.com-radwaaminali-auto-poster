const OpenAI = require('openai');

class OpenAIService {
  constructor(apiKey) {
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      throw new Error('OpenAI API Key is required. Please set OPENAI_API_KEY in .env file');
    }
    this.client = new OpenAI({ apiKey });
  }

  /**
   * Generate image using DALL-E 3
   * @param {string} prompt - Image description
   * @param {object} options - Generation options
   */
  async generateImage(prompt, options = {}) {
    const {
      size = '1024x1024',    // Options: '1024x1024', '1792x1024', '1024x1792'
      quality = 'standard',   // Options: 'standard', 'hd'
      style = 'vivid',        // Options: 'vivid', 'natural'
      n = 1                   // Number of images (1-10 for DALL-E 2, only 1 for DALL-E 3)
    } = options;

    // Validate inputs
    const validSizes = ['1024x1024', '1792x1024', '1024x1792'];
    if (!validSizes.includes(size)) {
      throw new Error(`Invalid size. Must be one of: ${validSizes.join(', ')}`);
    }

    try {
      const response = await this.client.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1, // DALL-E 3 only supports 1 image at a time
        size: size,
        quality: quality,
        style: style,
        response_format: 'url' // or 'b64_json'
      });

      return {
        images: response.data.map(img => ({
          url: img.url,
          revised_prompt: img.revised_prompt || prompt
        })),
        metadata: { 
          size, 
          quality, 
          style, 
          model: 'dall-e-3',
          originalPrompt: prompt
        },
        cost: quality === 'hd' ? 0.08 : 0.04 // Approximate cost in USD
      };
    } catch (error) {
      console.error('DALL-E Generation Error:', error);
      
      if (error.status === 400) {
        throw new Error('Invalid prompt or parameters. Please check your input.');
      } else if (error.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your credentials.');
      } else if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      throw new Error(`DALL-E Error: ${error.message}`);
    }
  }

  /**
   * Enhance user prompt for better image generation
   * @param {string} userPrompt - Basic user description
   */
  async enhancePrompt(userPrompt) {
    try {
      const completion = await this.client.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert at writing detailed DALL-E prompts. Enhance the user's simple prompt into a detailed, specific description that will produce stunning images. Include:
- Specific art style or technique
- Lighting and atmosphere
- Color palette
- Composition details
- Quality markers (highly detailed, 4K, professional, etc.)

Keep it under 400 characters. Return only the enhanced prompt without explanations.`
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      });

      return completion.choices[0].message.content.trim();
    } catch (error) {
      console.error('Prompt Enhancement Error:', error);
      // Return original prompt if enhancement fails
      return userPrompt;
    }
  }

  /**
   * Generate variations of an existing image
   * @param {string} imageUrl - URL of the base image
   * @param {number} n - Number of variations
   */
  async createVariation(imageUrl, n = 1) {
    try {
      // Note: This requires downloading the image first and converting to proper format
      // Implementation depends on your use case
      throw new Error('Image variation feature requires additional implementation');
    } catch (error) {
      throw new Error(`Variation Error: ${error.message}`);
    }
  }
}

module.exports = OpenAIService;