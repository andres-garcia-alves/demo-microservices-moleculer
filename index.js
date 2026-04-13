import dotenv from 'dotenv';
import { ServiceBroker } from 'moleculer';
import createUserService from './services/user/user.service.js';
import createEmailService from './services/email/email.service.js';
import createAuthService from './services/auth/auth.service.js';
import createGatewayService from './services/gateway/gateway.service.js';
import { CircuitBreakerMiddleware } from './services/shared/circuit-breaker-middleware.js';
import { getTransporterConfig } from './services/shared/transporter.js';
import logger from './services/shared/logger.js';
import { setupGracefulShutdown } from './services/shared/graceful-shutdown.js';

dotenv.config();

// Create main broker with circuit breaker middleware
const broker = new ServiceBroker({
  ...getTransporterConfig(),
  middlewares: [
    CircuitBreakerMiddleware({
      failureThreshold: 3,
      recoveryTimeout: 30000,
    })
  ],
  logger: {
    type: 'Console',
    options: {
      level: process.env.LOG_LEVEL || 'info',
      formatter: 'short'
    }
  }
});

/**
 * Returns a promise that resolves after the given number of milliseconds.
 *
 * @param {number} ms - Number of milliseconds to wait.
 * @returns {Promise<void>} A promise that resolves after the delay.
 */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Starts all microservices using the main broker, runs a demo scenario, and stops services.
 *
 * @returns {Promise<void>} Resolves when the application flow is complete.
 */
async function startApp() {
  // Start the main broker
  await broker.start();

  // Register graceful shutdown handlers (SIGTERM / SIGINT)
  setupGracefulShutdown(broker);

  // Create services on the main broker
  broker.createService(createUserService(broker));
  broker.createService(createEmailService(broker));
  broker.createService(createAuthService(broker));
  broker.createService(createGatewayService(broker));

  try {
    const newUser = await broker.call('user.createUser', {
      username: 'john',
      email: 'john@gmail.com',
    });
    logger.info('New User Created:', newUser);
    const users = await broker.call('user.getUsers');
    logger.info('All Users:', users);

    await wait(1000);

    const authResult = await broker.call('auth.login', {
      username: 'admin',
      password: 'password',
    });
    logger.info('Login result:', authResult);

    if (authResult.success) {
      const verification = await broker.call('auth.verifyToken', {
        token: authResult.token,
      });
      logger.info('Token verification:', verification);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await broker.stop();
  }
}

startApp();
