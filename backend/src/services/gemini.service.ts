import { GoogleGenAI } from '@google/genai';
import { ProxyAgent } from 'undici';
import logger from '../config/logger';

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.error('[Gemini] GEMINI_API_KEY not configured in environment');
      throw new Error('GEMINI_API_KEY not configured');
    }

    // Debug: Log all proxy-related environment variables
    logger.info('[Gemini] Proxy env vars:', {
      HTTP_PROXY: process.env.HTTP_PROXY,
      HTTPS_PROXY: process.env.HTTPS_PROXY,
      http_proxy: process.env.http_proxy,
      https_proxy: process.env.https_proxy,
    });

    // Configure proxy if available
    const proxyUrl = process.env.https_proxy || process.env.http_proxy || process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
    if (proxyUrl) {
      logger.info(`[Gemini] Using proxy: ${proxyUrl}`);
      const dispatcher = new ProxyAgent(proxyUrl);

      // Set global dispatcher for undici (used by @google/genai)
      const { setGlobalDispatcher } = require('undici');
      setGlobalDispatcher(dispatcher);
    } else {
      logger.warn('[Gemini] No proxy configured (http_proxy/https_proxy not set)');
    }

    this.ai = new GoogleGenAI({ apiKey });
    logger.info('[Gemini] Service initialized');
  }

  /**
   * Create a chat stream with Gemini
   */
  async createChatStream(
    history: { role: string; parts: { text: string }[] }[],
    message: string,
    model: string,
    searchMode: boolean
  ) {
    logger.info(`[Gemini] Creating chat stream - model: ${model}, searchMode: ${searchMode}`);
    logger.info(`[Gemini] History length: ${history.length}, message length: ${message.length}`);
    logger.info(`[Gemini] Message preview: ${message.substring(0, 200)}...`);
    logger.info(`[Gemini] Proxy: ${process.env.https_proxy || process.env.http_proxy || 'None'}`);

    const tools = searchMode ? [{ googleSearch: {} }] : [];

    try {
      logger.info(`[Gemini] Creating chat with config:`, {
        model,
        historyLength: history.length,
        tools: tools.length > 0 ? 'googleSearch' : 'none'
      });

      const chat = this.ai.chats.create({
        model: model,
        history: history.map((h) => ({
          role: h.role,
          parts: h.parts,
        })),
        config: {
          tools: tools,
          systemInstruction:
            'You are Coke Agent, a helpful, intelligent, and precise AI assistant. If search tools are enabled, use them to provide up-to-date information. Format your response in clean Markdown. If you use search, the system will handle citation rendering, but you should reference facts clearly.',
        },
      });

      logger.info('[Gemini] Sending message to chat...');
      const resultStream = await chat.sendMessageStream({ message });
      logger.info('[Gemini] Chat stream created successfully');
      return resultStream;
    } catch (error: any) {
      logger.error('[Gemini] Chat stream error:', {
        message: error?.message,
        status: error?.status,
        code: error?.code,
        cause: error?.cause?.message,
        stack: error?.stack?.split('\n').slice(0, 5),
      });
      throw error;
    }
  }

  /**
   * Generate slide image with Gemini
   */
  async generateSlideImage(
    topic: string,
    stylePrompt: string = '',
    referenceImages: string[] = []
  ): Promise<string> {
    logger.info(`[Gemini] Generating slide image for topic: "${topic}"`);
    logger.info(`[Gemini] Reference images count: ${referenceImages.length}`);

    const fullPrompt = `Create a professional presentation slide image about: "${topic}".

${stylePrompt}

The output must be a single, high-quality, professional PPT slide image.`;

    try {
      const parts: any[] = [{ text: fullPrompt }];

      // Add reference images
      if (referenceImages && referenceImages.length > 0) {
        logger.info(`[Gemini] Adding ${referenceImages.length} reference images`);
        let totalSize = 0;
        for (const base64Data of referenceImages) {
          totalSize += base64Data.length;
          parts.push({
            inlineData: {
              mimeType: 'image/png',
              data: base64Data,
            },
          });
        }
        logger.info(`[Gemini] Total reference images size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
      }

      const requestPayload = {
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: parts,
        },
        config: {
          imageConfig: {
            aspectRatio: '16:9',
            imageSize: '1K',
          },
        },
      };

      logger.info(`[Gemini] Calling API with ${parts.length} parts`);
      const response = await this.ai.models.generateContent(requestPayload);
      logger.info('[Gemini] API response received successfully');

      // Extract image from response
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const imageData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          logger.info(`[Gemini] Image generated successfully, size: ${(imageData.length / 1024).toFixed(2)} KB`);
          return imageData;
        }
      }

      logger.error('[Gemini] No image in response');
      throw new Error('No image generated by the model');
    } catch (error: any) {
      logger.error('[Gemini] Slide image generation error:', {
        message: error?.message,
        status: error?.status,
        response: error?.response,
        stack: error?.stack?.split('\n').slice(0, 3),
      });

      if (error?.message?.includes('fetch')) {
        logger.error('[Gemini] Network error - possible causes: payload too large, API unreachable, CORS issue');
      }

      throw error;
    }
  }

  /**
   * Remove text from image using AI
   */
  async removeTextWithAI(imageBase64: string, useProModel = false): Promise<string> {
    const modelName = useProModel ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
    logger.info(`[Gemini] Removing text with ${modelName} ${useProModel ? '(Pro)' : '(Flash)'}`);

    const prompt = `Based on this PPT image, generate an exact copy with the following requirements:
1. Keep ALL icons, charts, decorative elements, and background exactly as they are
2. Remove ALL text content completely
3. Naturally fill the text areas with surrounding colors or textures
4. Ensure the result looks natural and professional, as if the text was never there
5. Maintain the exact same layout, colors, and style
6. Output size: 1920x1080 pixels

Generate a clean, text-free version of this presentation slide.`;

    try {
      const response = await this.ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/png',
                data: imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, ''),
              },
            },
          ],
        },
        config: {
          responseModalities: ['IMAGE'],
          temperature: 0.4,
        },
      });

      const imagePart = response.candidates?.[0]?.content?.parts?.find((part: any) => part.inlineData);

      if (imagePart?.inlineData?.data) {
        const textFreeBase64 = `data:image/png;base64,${imagePart.inlineData.data}`;
        logger.info('[Gemini] Text removed successfully');
        return textFreeBase64;
      }

      logger.warn('[Gemini] No image in response, using fallback');
      return imageBase64;
    } catch (error: any) {
      logger.error('[Gemini] Text removal error:', {
        message: error?.message,
        status: error?.status,
      });
      return imageBase64;
    }
  }

  /**
   * Analyze PPT image and extract elements
   */
  async analyzePPTImage(imageBase64: string): Promise<any> {
    logger.info('[Gemini] Analyzing PPT image');

    const prompt = `你是一位专业的PPT设计分析专家。请仔细分析这张PPT图片（分辨率假定为1920x1080），提取所有视觉元素的详细信息，并以JSON格式输出。

要求：
1. 识别所有文本、形状、图片、图标、图表元素
2. 精确测量每个元素的位置(x,y)和尺寸(width,height)，单位为像素，基于1920x1080画布
3. 对于文本元素：
   - 提取完整的文本内容、字号、字体粗细、颜色、对齐方式
   - **重要**：文本框的height必须足够大，能完整显示所有文字内容
   - 计算高度时考虑：字号 × 行数 × 1.4（行高系数），并至少增加10%的余量
4. 对于图片/图标元素：
   - **重要**：不要尝试提取图片的base64数据或URL
   - 只需标记为type: "image"，并提供准确的位置(x,y)和尺寸(width,height)
   - 将src字段设置为空字符串 ""
5. 识别形状的类型、背景色、边框色、圆角
6. 从底层到顶层标注z-index（背景元素z-index=0，最上层元素最大）
7. 颜色使用十六进制格式(如 #FF0000)
8. 为每个元素生成唯一的id（如 elem_1, elem_2...）

输出格式（必须是有效的JSON）：
{
  "id": "page_1",
  "width": 1920,
  "height": 1080,
  "backgroundColor": "#FFFFFF",
  "elements": [
    {
      "id": "elem_1",
      "type": "text",
      "x": 100,
      "y": 200,
      "width": 500,
      "height": 60,
      "zIndex": 5,
      "content": "标题文字",
      "fontSize": 48,
      "fontFamily": "Microsoft YaHei",
      "fontWeight": "bold",
      "color": "#333333",
      "textAlign": "center"
    },
    {
      "id": "elem_2",
      "type": "shape",
      "x": 50,
      "y": 50,
      "width": 1820,
      "height": 980,
      "zIndex": 0,
      "shapeType": "rectangle",
      "backgroundColor": "#F0F0F0",
      "borderRadius": 10
    },
    {
      "id": "elem_3",
      "type": "image",
      "x": 800,
      "y": 400,
      "width": 120,
      "height": 120,
      "zIndex": 3,
      "src": ""
    }
  ]
}

重要提示：
- 只输出JSON数据，不要添加任何其他文字说明
- 确保JSON格式正确，可以被解析
- 识别所有可见的元素，包括背景、装饰性元素、小图标
- 对于图片/图标元素，src字段必须设置为空字符串 ""（不要尝试提取图片数据）
- 文本框高度要留有余量，确保文字完整显示
- 坐标和尺寸要尽可能精确`;

    try {
      const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/png',
                data: base64Data,
              },
            },
          ],
        },
      });

      logger.info('[Gemini] Analysis response received');

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('No text response from API');
      }

      logger.info(`[Gemini] Response length: ${text.length} characters`);

      // Extract JSON
      let jsonText = text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const pptData = JSON.parse(jsonText);

      if (!pptData.elements || !Array.isArray(pptData.elements)) {
        throw new Error('Invalid PPT data: missing elements array');
      }

      const result = {
        id: pptData.id || 'page_1',
        width: 1920,
        height: 1080,
        backgroundColor: pptData.backgroundColor || '#FFFFFF',
        backgroundImage: pptData.backgroundImage,
        originalImage: imageBase64,
        elements: pptData.elements,
      };

      logger.info(`[Gemini] Analysis complete: ${result.elements.length} elements found`);
      result.elements.forEach((el: any, idx: number) => {
        logger.info(`  [${idx}] ${el.type} - ${el.id}, pos:(${el.x},${el.y}), size:${el.width}x${el.height}`);
      });

      return result;
    } catch (error: any) {
      logger.error('[Gemini] PPT analysis error:', {
        message: error?.message,
        stack: error?.stack?.split('\n').slice(0, 3),
      });
      throw error;
    }
  }
}

export default new GeminiService();
