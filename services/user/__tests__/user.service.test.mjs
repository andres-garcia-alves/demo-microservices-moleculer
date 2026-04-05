import UserService from '../user.service.js';

describe('User Service', () => {
  beforeAll(async () => {
    await UserService.start();
  });

  afterAll(async () => {
    await UserService.stop();
  });

  test('creates a user successfully', async () => {
    const result = await UserService.call('user.createUser', {
      username: 'testuser',
      email: 'testuser@example.com',
    });

    expect(result).toHaveProperty('id');
    expect(result.username).toBe('testuser');
    expect(result.email).toBe('testuser@example.com');
  });

  test('returns users list', async () => {
    const users = await UserService.call('user.getUsers');
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);
  });
});
