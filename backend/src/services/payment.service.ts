import Stripe from 'stripe';
import { prisma } from '../config/database';
import creditService from './credit.service';
import logger from '../config/logger';
import { NotFoundError, InternalServerError } from '../utils/errors';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

export class PaymentService {
  // Create checkout session for credit purchase
  async createCheckoutSession(
    userId: string,
    packageId: string
  ): Promise<{ sessionId: string; checkoutUrl: string }> {
    // Get user and package info
    const [user, creditPackage] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.creditPackage.findUnique({ where: { id: packageId } }),
    ]);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!creditPackage || !creditPackage.isActive) {
      throw new NotFoundError('Credit package not found or inactive');
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: creditPackage.currency,
            product_data: {
              name: creditPackage.name,
              description: `${creditPackage.credits} credits`,
            },
            unit_amount: creditPackage.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
      metadata: {
        userId,
        packageId,
        credits: creditPackage.credits.toString(),
      },
    });

    logger.info(`Checkout session created for user ${user.email}: ${session.id}`);

    return {
      sessionId: session.id,
      checkoutUrl: session.url!,
    };
  }

  // Handle Stripe webhook events
  async handleWebhook(
    payload: string | Buffer,
    signature: string
  ): Promise<void> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );
    } catch (err: any) {
      logger.error('Webhook signature verification failed:', err.message);
      throw new InternalServerError('Webhook signature verification failed');
    }

    logger.info(`Webhook received: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        logger.info(`Unhandled webhook event type: ${event.type}`);
    }
  }

  // Handle successful checkout
  private async handleCheckoutComplete(
    session: Stripe.Checkout.Session
  ): Promise<void> {
    const { userId, credits } = session.metadata!;

    try {
      // Add credits to user
      await creditService.addCredits(
        userId,
        parseInt(credits),
        'PURCHASE',
        '购买点数包',
        { sessionId: session.id }
      );

      // Create payment record
      await prisma.payment.create({
        data: {
          userId,
          stripePaymentId: session.payment_intent as string,
          stripeSessionId: session.id,
          amount: session.amount_total!,
          currency: session.currency!,
          status: 'SUCCESS',
          creditsPurchased: parseInt(credits),
          metadata: session.metadata as any,
        },
      });

      logger.info(`Checkout completed for user ${userId}: +${credits} credits`);
    } catch (error) {
      logger.error('Error handling checkout complete:', error);
      throw error;
    }
  }

  // Handle successful payment
  private async handlePaymentSuccess(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    logger.info(`Payment succeeded: ${paymentIntent.id}`);

    await prisma.payment.updateMany({
      where: { stripePaymentId: paymentIntent.id },
      data: { status: 'SUCCESS' },
    });
  }

  // Handle failed payment
  private async handlePaymentFailed(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    logger.error(`Payment failed: ${paymentIntent.id}`);

    await prisma.payment.updateMany({
      where: { stripePaymentId: paymentIntent.id },
      data: { status: 'FAILED' },
    });
  }

  // Get available credit packages
  async getCreditPackages() {
    return prisma.creditPackage.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  // Create or get Stripe customer
  async getOrCreateStripeCustomer(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscriptions: { where: { status: 'ACTIVE' } } },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if user already has a Stripe customer ID
    const activeSubscription = user.subscriptions[0];
    if (activeSubscription?.stripeCustomerId) {
      return activeSubscription.stripeCustomerId;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId },
    });

    return customer.id;
  }

  // Get payment history for user
  async getPaymentHistory(userId: string, limit: number = 50, offset: number = 0) {
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.payment.count({ where: { userId } }),
    ]);

    return {
      payments,
      total,
      limit,
      offset,
    };
  }
}

export default new PaymentService();
