import UserService from './services/user/user.service.js';
import EmailService from './services/email/email.service.js';
import AuthService from './services/auth/auth.service.js';

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

  try {
    const newUser = await UserService.call('user.createUser', {
      username: 'john',
      email: 'john@gmail.com',
    });
    console.log('New User Created:', newUser);
    const users = await UserService.call('user.getUsers');
    console.log('All Users:', users);

    await wait(1000);

    const authResult = await AuthService.call('auth.authUser', {
      username: 'admin',
      password: 'password',
    });
    console.log('Auth result:', authResult);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await UserService.stop();
    await EmailService.stop();
    await AuthService.stop();
  }
}

startApp();
