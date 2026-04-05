import bcrypt from 'bcryptjs';
import AuthService from '../auth.service.js';
import { openDatabase, run, closeDatabase } from '../../shared/sqlite.js';

const testUser = {
  username: 'testauthuser',
  password: 'secret123',
};

let authDb;

describe('Auth Service', () => {
  beforeAll(async () => {
    await AuthService.start();
    authDb = await openDatabase(process.env.AUTH_DB_PATH || 'services/auth/auth.db');
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    await run(authDb, 'INSERT OR REPLACE INTO users (username, password) VALUES (?, ?)', [
      testUser.username,
      hashedPassword,
    ]);
  });

  afterAll(async () => {
    await AuthService.stop();
    if (authDb) {
      await closeDatabase(authDb);
    }
  });

  test('authUser succeeds for test credentials', async () => {
    const result = await AuthService.call('auth.authUser', {
      username: testUser.username,
      password: testUser.password,
    });

    expect(result).toEqual({
      success: true,
      message: 'Auth was successful',
    });
  });

  test('login returns a JWT token for valid credentials', async () => {
    const result = await AuthService.call('auth.login', {
      username: testUser.username,
      password: testUser.password,
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe('Login successful');
    expect(result.token).toEqual(expect.any(String));
    expect(result.expiresIn).toBe('24h');
  });

  test('verifyToken validates a generated token', async () => {
    const loginResult = await AuthService.call('auth.login', {
      username: testUser.username,
      password: testUser.password,
    });

    const verifyResult = await AuthService.call('auth.verifyToken', {
      token: loginResult.token,
    });

    expect(verifyResult.success).toBe(true);
    expect(verifyResult.payload).toEqual(
      expect.objectContaining({
        username: testUser.username,
      })
    );
  });
});
