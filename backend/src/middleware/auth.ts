import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { prisma } from '../config/database';
import logger from '../config/logger';

// Define custom user type
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// Middleware to verify JWT token
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    logger.info(`[Auth] Authenticating request: ${req.method} ${req.path}`);
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      logger.warn(`[Auth] No authorization header for ${req.method} ${req.path}`);
      throw new UnauthorizedError('No authorization header');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      logger.warn(`[Auth] Invalid authorization header format for ${req.method} ${req.path}`);
      throw new UnauthorizedError('Invalid authorization header format');
    }

    const token = parts[1];
    logger.info(`[Auth] Verifying token (first 20 chars): ${token.substring(0, 20)}...`);
    const payload = verifyAccessToken(token);

    // Attach user to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    logger.info(`[Auth] User authenticated: ${payload.email}`);
    next();
  } catch (error) {
    logger.error(`[Auth] Authentication failed:`, error);
    next(error);
  }
}

// Middleware to check if user has specific role
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      if (!roles.includes(req.user.role)) {
        throw new ForbiddenError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

// Middleware to check if user has enough credits
export function requireCredits(minCredits: number) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { credits: true },
      });

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      if (user.credits < minCredits) {
        throw new ForbiddenError(`Insufficient credits. Required: ${minCredits}, Available: ${user.credits}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

// Optional authentication (doesn't fail if no token)
export async function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      const token = parts[1];
      try {
        const payload = verifyAccessToken(token);
        req.user = {
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
        };
      } catch (error) {
        logger.warn('Optional authentication failed:', error);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}
