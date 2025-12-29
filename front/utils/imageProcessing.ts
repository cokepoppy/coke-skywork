import { PPTPage, TextElement } from '../types';
import { removeTextWithAI } from '../services/geminiService';

/**
 * Remove text regions from an image and generate a text-free background
 * Uses Canvas API to inpaint text areas with surrounding colors (fallback method)
 */
export async function removeTextFromImageWithCanvas(
  imageBase64: string,
  textElements: TextElement[]
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Draw original image
      ctx.drawImage(img, 0, 0, 1920, 1080);

      // Remove each text region
      textElements.forEach(textEl => {
        // Sample surrounding colors
        const sampleSize = 5;
        const samplePoints = [
          { x: textEl.x - sampleSize, y: textEl.y },
          { x: textEl.x + textEl.width + sampleSize, y: textEl.y },
          { x: textEl.x, y: textEl.y - sampleSize },
          { x: textEl.x, y: textEl.y + textEl.height + sampleSize }
        ];

        // Get average color from surrounding pixels
        const colors: number[][] = [];
        samplePoints.forEach(point => {
          if (point.x >= 0 && point.x < 1920 && point.y >= 0 && point.y < 1080) {
            const imageData = ctx.getImageData(point.x, point.y, 1, 1);
            colors.push(Array.from(imageData.data));
          }
        });

        // Calculate average color
        const avgColor = colors.reduce(
          (acc, color) => {
            acc[0] += color[0];
            acc[1] += color[1];
            acc[2] += color[2];
            acc[3] += color[3];
            return acc;
          },
          [0, 0, 0, 0]
        ).map(v => Math.round(v / colors.length));

        // Fill text region with average color
        ctx.fillStyle = `rgba(${avgColor[0]}, ${avgColor[1]}, ${avgColor[2]}, ${avgColor[3] / 255})`;

        // Add some padding to ensure complete coverage
        const padding = 5;
        ctx.fillRect(
          textEl.x - padding,
          textEl.y - padding,
          textEl.width + padding * 2,
          textEl.height + padding * 2
        );

        // Optional: Apply slight blur to blend better
        // This is a simple approach - for better results, use more sophisticated inpainting
      });

      // Convert canvas to base64
      const resultBase64 = canvas.toDataURL('image/png');
      resolve(resultBase64);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageBase64;
  });
}

/**
 * Process PPT analysis result to generate text-free background using AI
 * Uses Gemini's image generation model for professional text removal
 */
export async function generateTextFreeBackground(pptData: PPTPage): Promise<PPTPage> {
  if (!pptData.originalImage) {
    console.warn('[Image Processing] No original image found, skipping text removal');
    return pptData;
  }

  console.log('[Image Processing] Removing text from image using AI...');

  // Extract text elements
  const textElements = pptData.elements.filter(el => el.type === 'text') as TextElement[];

  if (textElements.length === 0) {
    console.log('[Image Processing] No text elements found, keeping original as background');
    return {
      ...pptData,
      backgroundImage: pptData.originalImage
    };
  }

  console.log(`[Image Processing] Found ${textElements.length} text elements to remove`);

  try {
    // Try Pro model first for best quality, fallback to Flash if not available
    console.log('[Image Processing] Using Gemini AI for text removal...');
    let textFreeBackground: string;

    try {
      // Try Nano Banana Pro first (better quality)
      textFreeBackground = await removeTextWithAI(pptData.originalImage, true);
    } catch (proError) {
      console.warn('[Image Processing] Pro model failed, falling back to Flash model');
      // Fallback to Nano Banana (faster, cheaper)
      textFreeBackground = await removeTextWithAI(pptData.originalImage, false);
    }

    console.log('[Image Processing] AI text removal complete');
    console.log('[Image Processing] Original image size:', pptData.originalImage.length);
    console.log('[Image Processing] Text-free image size:', textFreeBackground.length);

    // Return updated PPT data with both versions saved
    return {
      ...pptData,
      backgroundImage: textFreeBackground,   // AI-generated text-free background
      originalImage: pptData.originalImage   // Keep original for reference
    };
  } catch (error) {
    console.error('[Image Processing] AI text removal failed, trying fallback method:', error);

    try {
      // Fallback to canvas-based method
      const textFreeBackground = await removeTextFromImageWithCanvas(pptData.originalImage, textElements);
      console.log('[Image Processing] Fallback method succeeded');

      return {
        ...pptData,
        backgroundImage: textFreeBackground,
        originalImage: pptData.originalImage
      };
    } catch (fallbackError) {
      console.error('[Image Processing] Fallback also failed:', fallbackError);
      // Use original image as background if all methods fail
      return {
        ...pptData,
        backgroundImage: pptData.originalImage
      };
    }
  }
}
