import { Router } from 'express';
import { body } from 'express-validator';
import paymentController from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get credit packages (public)
router.get('/packages', paymentController.getPackages);

// Create checkout session (protected)
router.post(
  '/checkout',
  authenticate,
  [body('packageId').isString().notEmpty()],
  paymentController.createCheckout
);

// Stripe webhook (public, but verified by Stripe signature)
router.post('/webhook', paymentController.handleWebhook);

// Get payment history (protected)
router.get('/history', authenticate, paymentController.getHistory);

export default router;
