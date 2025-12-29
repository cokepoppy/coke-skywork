import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { UnauthorizedError, NotFoundError } from '../utils/errors';
import logger from '../config/logger';

export class AuthController {
  // Google OAuth callback handler
  async googleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('[Auth] Google OAuth callback started');
      const user = req.user as any;

      if (!user) {
        logger.error('[Auth] No user object in request');
        throw new UnauthorizedError('Authentication failed');
      }

      logger.info(`[Auth] User authenticated: ${user.email} (ID: ${user.id})`);

      // Generate tokens
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const refreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      logger.info(`[Auth] Tokens generated for user: ${user.email}`);

      // Store refresh token in database
      await prisma.session.create({
        data: {
          userId: user.id,
          refreshToken,
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      logger.info(`[Auth] Session created for user: ${user.email}`);

      // Redirect to frontend auth callback page with tokens
      // FIXED: Changed from /auth-callback.html to /auth/callback to match frontend routes
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`;
      logger.info(`[Auth] Redirecting to: ${redirectUrl}`);
      res.redirect(redirectUrl);
    } catch (error) {
      logger.error('[Auth] Google callback error:', error);
      next(error);
    }
  }

  // Refresh access token
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('[Auth] Refresh token request received');
      const { refreshToken } = req.body;

      if (!refreshToken) {
        logger.error('[Auth] No refresh token provided');
        throw new UnauthorizedError('Refresh token required');
      }

      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken);
      logger.info(`[Auth] Refresh token verified for user ID: ${payload.userId}`);

      // Check if refresh token exists in database
      const session = await prisma.session.findUnique({
        where: { refreshToken },
        include: { user: true },
      });

      if (!session) {
        logger.error('[Auth] Refresh token not found in database');
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Check if token expired
      if (session.expiresAt < new Date()) {
        logger.warn(`[Auth] Refresh token expired for user: ${session.user.email}`);
        await prisma.session.delete({ where: { id: session.id } });
        throw new UnauthorizedError('Refresh token expired');
      }

      // Generate new access token
      const accessToken = generateAccessToken({
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
      });

      logger.info(`[Auth] New access token generated for user: ${session.user.email}`);

      res.json({
        success: true,
        accessToken,
      });
    } catch (error) {
      logger.error('[Auth] Refresh token error:', error);
      next(error);
    }
  }

  // Logout
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        // Delete refresh token from database
        await prisma.session.deleteMany({
          where: { refreshToken },
        });
      }

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Get current user
  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('[Auth] Get current user request');

      if (!req.user) {
        logger.error('[Auth] No user in request object');
        throw new UnauthorizedError('User not authenticated');
      }

      logger.info(`[Auth] Fetching user data for ID: ${req.user.userId}`);

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          credits: true,
          createdAt: true,
        },
      });

      if (!user) {
        logger.error(`[Auth] User not found in database: ${req.user.userId}`);
        throw new NotFoundError('User not found');
      }

      logger.info(`[Auth] User data returned: ${user.email}`);

      res.json({
        success: true,
        user,
      });
    } catch (error) {
      logger.error('[Auth] Get current user error:', error);
      next(error);
    }
  }
}

export default new AuthController();
