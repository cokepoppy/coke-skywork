import { Request, Response, NextFunction } from 'express';
import paymentService from '../services/payment.service';
import { UnauthorizedError } from '../utils/errors';
import { body, validationResult } from 'express-validator';

export class PaymentController {
  // Get available credit packages
  async getPackages(req: Request, res: Response, next: NextFunction) {
    try {
      const packages = await paymentService.getCreditPackages();

      res.json({
        success: true,
        packages,
      });
    } catch (error) {
      next(error);
    }
  }

  // Create checkout session
  async createCheckout(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { packageId } = req.body;

      const session = await paymentService.createCheckoutSession(
        req.user.userId,
        packageId
      );

      res.json({
        success: true,
        ...session,
      });
    } catch (error) {
      next(error);
    }
  }

  // Webhook handler (Stripe events)
  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers['stripe-signature'] as string;

      if (!signature) {
        return res.status(400).json({ success: false, message: 'Missing signature' });
      }

      // req.body should be raw buffer for webhook
      await paymentService.handleWebhook(req.body, signature);

      res.json({ success: true, received: true });
    } catch (error) {
      next(error);
    }
  }

  // Get payment history
  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const history = await paymentService.getPaymentHistory(
        req.user.userId,
        limit,
        offset
      );

      res.json({
        success: true,
        ...history,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PaymentController();
