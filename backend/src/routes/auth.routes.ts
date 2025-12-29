import { Router } from 'express';
import authController from '../controllers/auth.controller';
import googleAuthController from '../controllers/google-auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Auth configuration
router.get('/config', (req, res) => googleAuthController.getConfig(req, res));

// Google OAuth routes (redirect flow - recommended)
router.get('/google', (req, res, next) => googleAuthController.startGoogleAuth(req, res, next));
router.get('/google/callback', (req, res, next) => googleAuthController.handleGoogleCallback(req, res, next));

// Google OAuth routes (popup mode - legacy)
router.post('/google', (req, res, next) => googleAuthController.loginWithGoogle(req, res, next));

// Token refresh
router.post('/refresh', authController.refreshToken);

// Logout
router.post('/logout', authController.logout);

// Get current user (protected)
router.get('/me', authenticate, authController.getCurrentUser);

export default router;
