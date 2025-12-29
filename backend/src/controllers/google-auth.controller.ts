import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../config/database';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';
import logger from '../config/logger';
import https from 'https';
import crypto from 'crypto';
import { URL } from 'url';

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

export class GoogleAuthController {
  // GET /api/auth/config - Check if Google OAuth is configured
  async getConfig(req: Request, res: Response) {
    const googleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    res.json({ success: true, data: { googleEnabled } });
  }

  // GET /api/auth/google - Start Google OAuth flow (redirect mode)
  async startGoogleAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId) {
        const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').trim();
        const redirect = `${frontendUrl.replace(/\/$/, '')}/login?error=google_disabled`;
        return res.redirect(redirect);
      }

      const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        prompt: 'select_account',
        access_type: 'offline',
        include_granted_scopes: 'true'
      });

      const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

      if (process.env.NODE_ENV !== 'production') {
        logger.info('Google OAuth start', {
          host: req.get('host'),
          protocol: req.protocol,
          redirectUri,
          hasClientId: !!clientId
        });
      }

      res.redirect(url);
    } catch (error) {
      const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').trim();
      const redirect = `${frontendUrl.replace(/\/$/, '')}/login?error=google_login_failed`;
      res.redirect(redirect);
    }
  }

  // GET /api/auth/google/callback - Handle Google OAuth callback
  async handleGoogleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('=== Google OAuth Callback Started ===');
      logger.info('Query params:', { code: !!req.query.code, error: req.query.error });

      const code = req.query.code as string;
      if (!code) {
        logger.error('Missing authorization code in callback');
        throw new UnauthorizedError('Missing authorization code');
      }

      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        logger.error('Google OAuth not configured');
        throw new Error('Google OAuth is not configured');
      }

      const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/google/callback`;

      

      logger.info('Exchanging code for tokens:', {
        redirectUri,
        codeLength: code.length,
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret
      });

      // Exchange code for tokens
      const tokenJson: any = await this.postForm('https://oauth2.googleapis.com/token', {
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      });

      logger.info('Token exchange successful:', {
        hasIdToken: !!tokenJson.id_token,
        hasAccessToken: !!tokenJson.access_token
      });

      const idToken = tokenJson.id_token as string | undefined;
      let email: string | undefined;
      let name: string | undefined;
      let picture: string | undefined;
      let googleId: string | undefined;

      // Try decode id_token first
      if (idToken) {
        logger.info('Decoding id_token:', {
          idTokenLength: idToken.length,
          idTokenParts: idToken.split('.')
        });
        try {
          const payloadPart = idToken.split('.')[1];
          // base64url -> base64
          const b64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (payloadPart.length % 4)) % 4);
          const payloadJson = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
          email = payloadJson.email;
          name = payloadJson.name;
          picture = payloadJson.picture;
          googleId = payloadJson.sub;
        } catch (_) {
          // fallback below
          logger.error('Failed to decode id_token:', { error: _ });
        }
      }

      // Fallback to userinfo endpoint if email not found
      if (!email && tokenJson.access_token) {
        logger.info('Fetching userinfo:', {
          accessTokenLength: tokenJson.access_token.length,
          accessTokenParts: tokenJson.access_token.split('.')
        });
        const info: any = await this.getJson('https://www.googleapis.com/oauth2/v3/userinfo', {
          Authorization: `Bearer ${tokenJson.access_token}`
        });
        email = info.email;
        name = info.name || info.given_name || info.email?.split('@')[0];
        picture = info.picture;
        googleId = info.sub;
      }

      if (!email) {
        logger.error('Failed to obtain Google account email');
        throw new UnauthorizedError('Failed to obtain Google account email');
      }

      // Find or create user
      let user = await prisma.user.findUnique({ where: { email } });
      logger.info('User found:', { user });

      if (!user) {
        // Create new user with signup bonus
        logger.info('Creating new user:', { email, name, picture, googleId });
        user = await prisma.user.create({
          data: {
            googleId,
            email,
            name: name || email.split('@')[0],
            avatar: picture,
            credits: parseInt(process.env.DEFAULT_SIGNUP_CREDITS || '100'),
          },
        });

        // Create credit log for signup bonus
        await prisma.creditLog.create({
          data: {
            userId: user.id,
            amount: user.credits,
            balance: user.credits,
            type: 'SIGNUP',
            description: 'Signup bonus',
          },
        });

        logger.info(`New user created via Google: ${email}`);
      } else {
        // Update Google ID if not set
        if (!user.googleId && googleId) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { googleId },
          });
        }
        logger.info(`User logged in: ${email}`);
      }

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

      // Redirect to frontend with token
      logger.info('Redirecting to frontend with token');
      const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').trim();
      const redirect = `${frontendUrl.replace(/\/$/, '')}/auth/callback?accessToken=${encodeURIComponent(accessToken)}&refreshToken=${encodeURIComponent(refreshToken)}`;
      res.redirect(redirect);
    } catch (error: any) {
      logger.error('Google OAuth callback error:', error?.message || error);
      const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').trim();
      const debug = process.env.NODE_ENV !== 'production' && error?.message ? `&debug=${encodeURIComponent(error.message)}` : '';
      const redirect = `${frontendUrl.replace(/\/$/, '')}/login?error=google_login_failed${debug}`;
      res.redirect(redirect);
    }
  }

  // POST /api/auth/google - Login with Google ID Token (popup mode - legacy)
  async loginWithGoogle(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;

      if (!token) {
        throw new UnauthorizedError('Google token is required');
      }

      // Verify Google ID token
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new UnauthorizedError('Invalid Google token');
      }

      const { email, sub: googleId, name, picture } = payload;

      // Find or create user
      let user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Create new user with signup bonus
        user = await prisma.user.create({
          data: {
            googleId,
            email,
            name: name || email.split('@')[0],
            avatar: picture,
            credits: parseInt(process.env.DEFAULT_SIGNUP_CREDITS || '100'),
          },
        });

        // Create credit log for signup bonus
        await prisma.creditLog.create({
          data: {
            userId: user.id,
            amount: user.credits,
            balance: user.credits,
            type: 'SIGNUP',
            description: 'Signup bonus',
          },
        });

        logger.info(`New user created via Google: ${email}`);
      } else {
        // Update Google ID if not set
        if (!user.googleId) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { googleId },
          });
        }
        logger.info(`User logged in: ${email}`);
      }

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

      res.json({
        success: true,
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          credits: user.credits,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  private  getProxyAgent() {
    const proxy = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy
    logger.info(`getProxyAgent proxy: ${proxy}`);
    if (!proxy) return undefined
    try {
      // Lazy require to avoid build-time issues if not installed
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { HttpsProxyAgent } = require('https-proxy-agent')
      logger.info(`getProxyAgent require HttpsProxyAgent: ${HttpsProxyAgent}`);
      return new HttpsProxyAgent(proxy)
    } catch (e) {
      logger.error(`getProxyAgent error: ${e}`);
      console.warn('Proxy agent not available, install https-proxy-agent to enable proxy support')
      return undefined
    }
  }

  // Helper: POST request with form data
  private postForm(urlStr: string, data: Record<string, string>): Promise<any> {
    return new Promise((resolve, reject) => {

      const url = new URL(urlStr);
      const body = new URLSearchParams(data).toString();
      const agent = this.getProxyAgent()
      logger.info(` postForm POST ${urlStr}`);
      logger.info(`postForm Body: ${body}`);
      const req = https.request(
        {
          method: 'POST',
          hostname: url.hostname,
          path: url.pathname + url.search,
          port: url.port || 443,
          agent,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(body)
          }
        },
        res => {
          let chunks: Buffer[] = [];
          res.on('data', d => chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d)));
          res.on('end', () => {
            logger.info(`postForm Response: ${Buffer.concat(chunks).toString('utf8')}`);
            const text = Buffer.concat(chunks).toString('utf8');
            try {
              const json = JSON.parse(text);
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                resolve(json);
              } else {
                reject(new Error(json.error_description || json.error || `HTTP ${res.statusCode}`));
              }
            } catch (e) {
              reject(new Error(`Invalid JSON from ${urlStr}`));
            }
          });
        }
      );
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  // Helper: GET request for JSON
  private getJson(urlStr: string, headers: Record<string, string> = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = new URL(urlStr);
      const req = https.request(
        {
          method: 'GET',
          hostname: url.hostname,
          path: url.pathname + url.search,
          port: url.port || 443,
          headers
        },
        res => {
          let chunks: Buffer[] = [];
          res.on('data', d => chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d)));
          res.on('end', () => {
            const text = Buffer.concat(chunks).toString('utf8');
            try {
              const json = JSON.parse(text);
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                resolve(json);
              } else {
                reject(new Error(json.error_description || json.error || `HTTP ${res.statusCode}`));
              }
            } catch (e) {
              reject(new Error(`Invalid JSON from ${urlStr}`));
            }
          });
        }
      );
      req.on('error', reject);
      req.end();
    });
  }
}

export default new GoogleAuthController();
