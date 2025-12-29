# Skywork AI Backend

Express + TypeScript backend for Skywork AI platform with Google OAuth authentication, credit system, and Stripe payment integration.

## Tech Stack

- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MySQL with Prisma ORM
- **Cache**: Redis
- **Authentication**: Google OAuth 2.0 + JWT
- **Payment**: Stripe
- **Logging**: Winston

## Features

✅ Google OAuth authentication
✅ JWT-based access tokens + refresh tokens
✅ Credit system with distributed locking (Redis)
✅ Stripe payment integration
✅ Rate limiting
✅ Comprehensive error handling
✅ API validation
✅ Security best practices (Helmet, CORS)

## Prerequisites

- Node.js >= 18
- MySQL database
- Redis server
- Google OAuth credentials
- Stripe account

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL`: MySQL connection string
- `REDIS_HOST`, `REDIS_PORT`: Redis configuration
- `JWT_SECRET`, `REFRESH_TOKEN_SECRET`: JWT secrets
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: Google OAuth credentials
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`: Stripe credentials
- `FRONTEND_URL`: Frontend URL for CORS and redirects

### 3. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view database
npm run prisma:studio
```

### 4. Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:5000`

### 5. Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.ts   # Prisma client
│   │   ├── redis.ts      # Redis client
│   │   ├── passport.ts   # Google OAuth config
│   │   └── logger.ts     # Winston logger
│   ├── controllers/      # Route controllers
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   └── payment.controller.ts
│   ├── services/         # Business logic
│   │   ├── credit.service.ts    # Credit management
│   │   └── payment.service.ts   # Stripe integration
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts       # Authentication middleware
│   │   └── errorHandler.ts
│   ├── routes/           # API routes
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   └── payment.routes.ts
│   ├── utils/            # Utility functions
│   │   ├── errors.ts     # Custom error classes
│   │   └── jwt.ts        # JWT utilities
│   ├── app.ts            # Express app configuration
│   └── server.ts         # Server entry point
├── prisma/
│   └── schema.prisma     # Database schema
├── .env.example          # Environment variables template
├── tsconfig.json         # TypeScript configuration
└── package.json
```

## API Endpoints

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user (protected)

### User
- `GET /api/user/credits` - Get user credits (protected)
- `GET /api/user/credits/history` - Get credit transaction history (protected)

### Payment
- `GET /api/payment/packages` - Get available credit packages
- `POST /api/payment/checkout` - Create Stripe checkout session (protected)
- `POST /api/payment/webhook` - Stripe webhook handler
- `GET /api/payment/history` - Get payment history (protected)

### Health Check
- `GET /health` - Server health check

## Database Schema

Key models:
- **User**: User accounts with credits
- **Session**: Refresh token storage
- **CreditLog**: Credit transaction history
- **Payment**: Payment records
- **Subscription**: Subscription management
- **CreditPackage**: Available credit packages
- **UsageLog**: API usage tracking

See `prisma/schema.prisma` for complete schema.

## Credit System

The credit system uses distributed locking (Redis) to prevent race conditions:

1. User makes API request
2. Backend acquires distributed lock for user
3. Checks if user has enough credits
4. Deducts credits in database transaction
5. Logs transaction
6. Releases lock
7. Invalidates credit cache

Credit costs (configurable via environment variables):
- Chat (Flash): 1 credit
- Chat (Pro): 5 credits
- PPT Generation: 10 credits
- PPT Edit: 5 credits

## Payment Flow

1. User selects credit package
2. Backend creates Stripe checkout session
3. User completes payment on Stripe
4. Stripe sends webhook event
5. Backend verifies webhook signature
6. Credits added to user account
7. Payment record created

## Security

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: 100 requests per 15 minutes
- **JWT**: Stateless authentication
- **Input Validation**: express-validator
- **SQL Injection Prevention**: Prisma ORM
- **Webhook Verification**: Stripe signature validation

## Development

### Running Migrations

```bash
npm run prisma:migrate
```

### Viewing Database

```bash
npm run prisma:studio
```

### Code Structure Guidelines

- Controllers: Handle HTTP requests/responses
- Services: Business logic and database operations
- Middleware: Request processing pipeline
- Utils: Reusable helper functions
- Config: Application configuration

## Troubleshooting

### Database Connection Issues

Check `DATABASE_URL` format:
```
mysql://username:password@localhost:3306/database_name
```

### Redis Connection Issues

Ensure Redis server is running:
```bash
redis-cli ping
# Should return: PONG
```

### Stripe Webhook Testing

Use Stripe CLI for local webhook testing:
```bash
stripe listen --forward-to localhost:5000/api/payment/webhook
```

## License

MIT
