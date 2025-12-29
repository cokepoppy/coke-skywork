import { ModelType, SearchMode, SlideDeck, PPTPage } from '../types';
import API from './api';

/**
 * Create a chat stream with Gemini (via backend)
 */
export const createChatStream = async (
  history: { role: string; parts: { text: string }[] }[],
  message: string,
  model: ModelType,
  searchMode: SearchMode
) => {
  console.log('[GeminiService] Creating chat stream via backend API');
  console.log('[GeminiService] Model:', model, 'SearchMode:', searchMode);

  try {
    // Call backend API instead of directly calling Gemini
    const response = await API.gemini.createChatStream(
      history,
      message,
      model,
      searchMode === SearchMode.ON
    );

    console.log('[GeminiService] Response received from backend');
    return response;
  } catch (error) {
    console.error("[GeminiService] Chat stream error:", error);
    throw error;
  }
};

/**
 * Generate slide image (via backend)
 */
export const generateSlideImage = async (
  topic: string,
  stylePrompt: string = '',
  referenceImages: string[] = []
): Promise<string> => {
  console.log('[GeminiService] Generating slide image via backend API');
  console.log(`[GeminiService] Topic: "${topic}", Reference images: ${referenceImages.length}`);

  try {
    // Call backend API instead of directly calling Gemini
    const imageData = await API.gemini.generateSlideImage(topic, stylePrompt, referenceImages);

    console.log('[GeminiService] Slide image generated successfully');
    return imageData;
  } catch (error: any) {
    console.error("[GeminiService] Slide image generation error:", error);
    console.error("Error details:", {
      name: error?.name,
      message: error?.message,
      stack: error?.stack?.split('\n').slice(0, 3),
    });

    throw error;
  }
};

/**
 * Generate a text-free version of the PPT image using Gemini AI (via backend)
 * Supports both Nano Banana and Nano Banana Pro models
 */
export const removeTextWithAI = async (imageBase64: string, useProModel = false): Promise<string> => {
  console.log(`[GeminiService] Removing text via backend API, useProModel: ${useProModel}`);

  try {
    // Call backend API instead of directly calling Gemini
    const textFreeImage = await API.gemini.removeTextWithAI(imageBase64, useProModel);

    console.log('[GeminiService] Text removed successfully');
    return textFreeImage;
  } catch (error: any) {
    console.error('[GeminiService] Text removal error:', error);
    console.error('[GeminiService] Error details:', {
      message: error?.message,
      status: error?.status
    });
    // Return original image as fallback
    return imageBase64;
  }
};

/**
 * Analyze PPT image and extract elements (via backend)
 */
export const analyzePPTImage = async (imageBase64: string): Promise<PPTPage> => {
  console.log('[GeminiService] Analyzing PPT image via backend API');

  try {
    // Call backend API instead of directly calling Gemini
    const analysis = await API.gemini.analyzePPTImage(imageBase64);

    console.log(`[GeminiService] PPT analyzed: ${analysis.elements.length} elements found`);
    return analysis;
  } catch (error: any) {
    console.error('[GeminiService] PPT analysis error:', error);
    throw error;
  }
};
