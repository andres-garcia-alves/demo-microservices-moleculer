import ApiService from 'moleculer-web';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Configure rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60 // seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Creates and returns the gateway service.
 *
 * @param {import('moleculer').ServiceBroker} broker - The Moleculer broker instance.
 * @returns {object} The gateway service configuration.
 */
export default function createGatewayService(broker) {
  return {
    ...ApiService,
    settings: {
      port: process.env.GATEWAY_PORT || 3000,
      ip: '0.0.0.0',
      use: [
        helmet({
          contentSecurityPolicy: {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              scriptSrc: ["'self'"],
              imgSrc: ["'self'", "data:", "https:"],
            },
          },
          hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
          },
          noSniff: true,
          xssFilter: true,
          referrerPolicy: { policy: "strict-origin-when-cross-origin" }
        }),
        limiter // Apply general rate limiting to all routes
      ],
      routes: [
        {
          path: '/auth',
          use: [authLimiter], // Apply stricter rate limiting to auth routes
          aliases: {
            'POST /login': {
              action: 'auth.login',
              swagger: {
                summary: 'Authenticate user',
                tags: ['Authentication'],
                body: {
                  username: { type: 'string', required: true },
                  password: { type: 'string', required: true },
                },
              },
            },
            'POST /verify': {
              action: 'auth.verifyToken',
              swagger: {
                summary: 'Verify JWT token',
                tags: ['Authentication'],
                body: {
                  token: { type: 'string', required: true },
                },
              },
            },
          },
        },
        // API Version 1 routes
        {
          path: '/api/v1',
          aliases: {
            'GET /health': {
              action: 'api.health',
              swagger: {
                summary: 'Health check (v1)',
                tags: ['Health'],
              },
            },
            'GET /users': {
              action: 'user.getUsers',
              swagger: {
                summary: 'Get all users (v1)',
                tags: ['Users'],
              },
            },
            'POST /users': {
              action: 'user.createUser',
              swagger: {
                summary: 'Create a new user (v1)',
                tags: ['Users'],
                body: {
                  username: { type: 'string', required: true },
                  email: { type: 'string', required: true },
                },
              },
            },
          },
          // Add version header to responses
          onBeforeCall(ctx, route, req, res) {
            res.setHeader('X-API-Version', 'v1');
          },
        },
      ],
      swagger: {
        ui: true,
        info: {
          title: 'Demo Microservices API',
          version: '1.0.0',
          description: 'API Gateway for Moleculer microservices demo with API versioning support',
        },
      },
      aliases: {
        // Legacy routes (backward compatibility) - treated as v1
        'GET /health': {
          action: 'api.health',
          swagger: {
            summary: 'Health check (legacy)',
            tags: ['Health'],
            deprecated: true,
            description: 'Use /api/v1/health instead',
          },
        },
        'GET /users': {
          action: 'user.getUsers',
          swagger: {
            summary: 'Get all users (legacy)',
            tags: ['Users'],
            deprecated: true,
            description: 'Use /api/v1/users instead',
          },
        },
        'POST /users': {
          action: 'user.createUser',
          swagger: {
            summary: 'Create a new user (legacy)',
            tags: ['Users'],
            deprecated: true,
            description: 'Use /api/v1/users instead',
            body: {
              username: { type: 'string', required: true },
              email: { type: 'string', required: true },
            },
          },
        },
        'GET /health': {
          action: 'gateway.health',
          swagger: {
            summary: 'Health check (legacy)',
            tags: ['Health'],
            deprecated: true,
            description: 'Use /api/v1/health instead',
          },
        },
      },
    },
    actions: {
      health: {
        async handler() {
          return { status: 'ok' };
        },
      },
    },
  };
}