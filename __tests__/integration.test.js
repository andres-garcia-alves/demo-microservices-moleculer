import UserService from '../services/user/user.service.js';
import AuthService from '../services/auth/auth.service.js';

jest.setTimeout(20000);

describe('Integration: User + Auth', () => {
  beforeAll(async () => {
    await UserService.start();
    await AuthService.start();
  });

  afterAll(async () => {
    await UserService.stop();
    await AuthService.stop();
  });

  test('creates a user then validates auth', async () => {
    const user = await UserService.call('user.createUser', {
      username: 'integrationtest',
      email: 'integration@test.com',
    });

    expect(user).toHaveProperty('id');
    expect(user.username).toBe('integrationtest');

    const authResult = await AuthService.call('auth.authUser', {
      username: 'admin',
      password: 'password',
    });
    expect(authResult.success).toBe(true);
  });
});
