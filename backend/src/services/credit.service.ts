import { prisma } from '../config/database';
import { redisClient } from '../config/redis';
import { PaymentRequiredError, TooManyRequestsError, NotFoundError } from '../utils/errors';
import logger from '../config/logger';
import { CreditType } from '@prisma/client';

export class CreditService {
  // Deduct credits with distributed lock
  async deductCredits(
    userId: string,
    amount: number,
    feature: string,
    description?: string
  ): Promise<{ newBalance: number }> {
    const lockKey = `lock:credit:${userId}`;
    const lockValue = `${Date.now()}-${Math.random()}`;
    const lockTimeout = 10; // 10 seconds

    // Try to acquire distributed lock
    const acquired = await redisClient.set(lockKey, lockValue, {
      NX: true,
      EX: lockTimeout,
    });

    if (!acquired) {
      throw new TooManyRequestsError('System busy, please try again');
    }

    try {
      // Use database transaction for atomicity
      const result = await prisma.$transaction(async (tx) => {
        // Get current user credits with row lock
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { credits: true, email: true },
        });

        if (!user) {
          throw new NotFoundError('User not found');
        }

        // Check if user has enough credits
        if (user.credits < amount) {
          throw new PaymentRequiredError(
            `Insufficient credits. Required: ${amount}, Available: ${user.credits}`
          );
        }

        // Deduct credits
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: { credits: { decrement: amount } },
        });

        // Create credit log
        await tx.creditLog.create({
          data: {
            userId,
            amount: -amount,
            balance: updatedUser.credits,
            type: 'USAGE',
            description: description || `Used feature: ${feature}`,
            metadata: { feature },
          },
        });

        logger.info(`Credits deducted for user ${user.email}: -${amount}, new balance: ${updatedUser.credits}`);

        return { newBalance: updatedUser.credits };
      });

      // Invalidate cached credits
      await this.invalidateCreditCache(userId);

      return result;
    } finally {
      // Release lock using Lua script (atomic check and delete)
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      await redisClient.eval(script, {
        keys: [lockKey],
        arguments: [lockValue],
      });
    }
  }

  // Add credits
  async addCredits(
    userId: string,
    amount: number,
    type: CreditType,
    description?: string,
    metadata?: any
  ): Promise<{ newBalance: number }> {
    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { credits: { increment: amount } },
      });

      await tx.creditLog.create({
        data: {
          userId,
          amount,
          balance: updatedUser.credits,
          type,
          description,
          metadata,
        },
      });

      return { newBalance: updatedUser.credits };
    });

    await this.invalidateCreditCache(userId);
    logger.info(`Credits added for user ${userId}: +${amount}, new balance: ${result.newBalance}`);

    return result;
  }

  // Get user credits (with caching)
  async getUserCredits(userId: string): Promise<number> {
    const cacheKey = `credits:${userId}`;

    // Try to get from cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return parseInt(cached);
    }

    // Get from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Cache for 5 minutes
    await redisClient.setEx(cacheKey, 300, user.credits.toString());

    return user.credits;
  }

  // Get credit history
  async getCreditHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ) {
    const [logs, total] = await Promise.all([
      prisma.creditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.creditLog.count({
        where: { userId },
      }),
    ]);

    return {
      logs,
      total,
      limit,
      offset,
    };
  }

  // Invalidate credit cache
  private async invalidateCreditCache(userId: string): Promise<void> {
    await redisClient.del(`credits:${userId}`);
  }

  // Get credit cost for a feature
  getCreditCost(feature: string, model?: string): number {
    const costs: Record<string, number> = {
      'chat-flash': parseInt(process.env.CHAT_COST_FLASH || '1'),
      'chat-pro': parseInt(process.env.CHAT_COST_PRO || '5'),
      'ppt-generate': parseInt(process.env.PPT_GENERATE_COST || '10'),
      'ppt-edit': parseInt(process.env.PPT_EDIT_COST || '5'),
    };

    const key = model ? `${feature}-${model}` : feature;
    return costs[key] || 1;
  }
}

export default new CreditService();
