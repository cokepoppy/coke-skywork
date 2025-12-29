import { Router } from 'express';
import userController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get user credits
router.get('/credits', userController.getCredits);

// Get credit history
router.get('/credits/history', userController.getCreditHistory);

export default router;
