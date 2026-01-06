import { Request, Response, NextFunction } from 'express';
import geminiService from '../services/gemini.service';
import logger from '../config/logger';
import { BadRequestError } from '../utils/errors';

export class GeminiController {
  /**
   * POST /api/gemini/chat
   * Create a chat stream
   */
  async createChatStream(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('[GeminiController] Chat stream request received');
      const { history, message, model, searchMode } = req.body;

      if (!message) {
        throw new BadRequestError('Message is required');
      }

      if (!model) {
        throw new BadRequestError('Model is required');
      }

      logger.info(`[GeminiController] Model: ${model}, SearchMode: ${searchMode}, Message length: ${message.length}`);

      const stream = await geminiService.createChatStream(
        history || [],
        message,
        model,
        searchMode || false
      );

      // Set headers for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      logger.info('[GeminiController] Starting to stream response');

      // Stream the response
      for await (const chunk of stream) {
        const chunkData = JSON.stringify(chunk);
        res.write(`data: ${chunkData}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();
      logger.info('[GeminiController] Stream completed');
    } catch (error: any) {
      logger.error('[GeminiController] Chat stream error:', error);
      // If headers not sent yet, send error response
      if (!res.headersSent) {
        next(error);
      } else {
        // If streaming already started, just end the response
        res.end();
      }
    }
  }

  /**
   * POST /api/gemini/generate-html
   * Generate full HTML presentation (non-stream)
   */
  async generateHtmlPresentation(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('[GeminiController] Generate HTML presentation request received');
      const { prompt, model } = req.body || {};

      if (!prompt || typeof prompt !== 'string') {
        throw new BadRequestError('Prompt is required');
      }

      const html = await geminiService.generateHtmlPresentation(prompt, model);
      res.json({ success: true, html });
    } catch (error) {
      logger.error('[GeminiController] Generate HTML error:', error);
      next(error);
    }
  }
  /**
   * POST /api/gemini/generate-slide
   * Generate a slide image
   */
  async generateSlideImage(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('[GeminiController] Generate slide image request received');
      const { topic, stylePrompt, referenceImages } = req.body;

      if (!topic) {
        throw new BadRequestError('Topic is required');
      }

      logger.info(`[GeminiController] Topic: "${topic}", Reference images: ${referenceImages?.length || 0}`);

      const imageData = await geminiService.generateSlideImage(
        topic,
        stylePrompt || '',
        referenceImages || []
      );

      logger.info(`[GeminiController] Slide image generated successfully`);

      res.json({
        success: true,
        imageData,
      });
    } catch (error) {
      logger.error('[GeminiController] Generate slide error:', error);
      next(error);
    }
  }

  /**
   * POST /api/gemini/remove-text
   * Remove text from image using AI
   */
  async removeTextWithAI(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('[GeminiController] Remove text request received');
      const { imageBase64, useProModel } = req.body;

      if (!imageBase64) {
        throw new BadRequestError('Image data is required');
      }

      logger.info(`[GeminiController] Using ${useProModel ? 'Pro' : 'Flash'} model`);

      const textFreeImage = await geminiService.removeTextWithAI(imageBase64, useProModel || false);

      logger.info('[GeminiController] Text removed successfully');

      res.json({
        success: true,
        imageData: textFreeImage,
      });
    } catch (error) {
      logger.error('[GeminiController] Remove text error:', error);
      next(error);
    }
  }

  /**
   * POST /api/gemini/analyze-ppt
   * Analyze PPT image and extract elements
   */
  async analyzePPTImage(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('[GeminiController] Analyze PPT request received');
      const { imageBase64 } = req.body;

      if (!imageBase64) {
        throw new BadRequestError('Image data is required');
      }

      logger.info(`[GeminiController] Image size: ${(imageBase64.length / 1024).toFixed(2)} KB`);

      const analysis = await geminiService.analyzePPTImage(imageBase64);

      logger.info(`[GeminiController] Analysis complete: ${analysis.elements.length} elements`);

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      logger.error('[GeminiController] Analyze PPT error:', error);
      next(error);
    }
  }
}

export default new GeminiController();
