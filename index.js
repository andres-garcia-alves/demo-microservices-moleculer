import dotenv from 'dotenv';
import UserService from './services/user/user.service.js';
import EmailService from './services/email/email.service.js';
import AuthService from './services/auth/auth.service.js';
import GatewayService from './services/gateway/gateway.service.js';
import logger from './services/shared/logger.js';

dotenv.config();

/**
 * Returns a promise that resolves after the given number of milliseconds.
 *
 * @param {number} ms - Number of milliseconds to wait.
 * @returns {Promise<void>} A promise that resolves after the delay.
 */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Starts all microservices sequentially, runs a demo scenario, and stops services.
 *
 * @returns {Promise<void>} Resolves when the application flow is complete.
 */
async function startApp() {
  await UserService.start();
  await EmailService.start();
  await AuthService.start();
  await GatewayService.start();

  try {
    const newUser = await UserService.call('user.createUser', {
      username: 'john',
      email: 'john@gmail.com',
    });
    logger.info('New User Created:', newUser);
    const users = await UserService.call('user.getUsers');
    logger.info('All Users:', users);

    await wait(1000);

    const authResult = await AuthService.call('auth.login', {
      username: 'admin',
      password: 'password',
    });
    logger.info('Login result:', authResult);

    if (authResult.success) {
      const verification = await AuthService.call('auth.verifyToken', {
        token: authResult.token,
      });
      logger.info('Token verification:', verification);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await UserService.stop();
    await EmailService.stop();
    await AuthService.stop();
  }
}

startApp();
