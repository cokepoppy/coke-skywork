import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Agent as HttpsAgent } from 'https';
import { prisma } from './database';
import logger from './logger';

// Create HTTPS agent that bypasses proxy for OAuth
const httpsAgent = new HttpsAgent({
  // Disable proxy for OAuth requests
  rejectUnauthorized: true,
});

// Remove proxy environment variables for OAuth requests
const originalHttpProxy = process.env.http_proxy;
const originalHttpsProxy = process.env.https_proxy;
delete process.env.http_proxy;
delete process.env.https_proxy;

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
      proxy: false, // Disable proxy
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        let user = await prisma.user.findUnique({
          where: { googleId: profile.id },
        });

        // If user doesn't exist, create new user
        if (!user) {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('No email found in Google profile'), undefined);
          }

          // Check if email already exists (user might have signed up differently)
          const existingUser = await prisma.user.findUnique({
            where: { email },
          });

          if (existingUser) {
            // Link Google account to existing user
            user = await prisma.user.update({
              where: { email },
              data: { googleId: profile.id },
            });
            logger.info(`Linked Google account to existing user: ${email}`);
          } else {
            // Create new user with signup bonus
            user = await prisma.user.create({
              data: {
                googleId: profile.id,
                email,
                name: profile.displayName || 'User',
                avatar: profile.photos?.[0]?.value,
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

            logger.info(`New user created via Google OAuth: ${email}`);
          }
        }

        return done(null, user);
      } catch (error) {
        logger.error('Google OAuth error:', error);
        return done(error as Error, undefined);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
