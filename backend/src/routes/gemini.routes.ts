import { Router } from 'express';
import geminiController from '../controllers/gemini.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All Gemini endpoints require authentication
router.use(authenticate);

// Chat stream
router.post('/chat', geminiController.createChatStream.bind(geminiController));

// Generate slide image
router.post('/generate-slide', geminiController.generateSlideImage.bind(geminiController));

// Remove text from image
router.post('/remove-text', geminiController.removeTextWithAI.bind(geminiController));

// Analyze PPT image
router.post('/analyze-ppt', geminiController.analyzePPTImage.bind(geminiController));

export default router;
