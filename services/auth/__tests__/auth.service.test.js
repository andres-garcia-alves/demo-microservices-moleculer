import bcrypt from 'bcryptjs';
import { ServiceBroker } from 'moleculer';
import createAuthService from '../auth.service.js';
import { openDatabase, run, closeDatabase } from '../../shared/sqlite.js';

const testUser = {
  username: 'testauthuser',
  password: 'secret123',
};

let authDb;
let broker;

describe('Auth Service', () => {
  beforeAll(async () => {
    broker = new ServiceBroker({
      logger: false,
      transporter: 'fake',
    });
    broker.createService(createAuthService(broker));
    await broker.start();

    authDb = await openDatabase(process.env.AUTH_DB_PATH || 'services/auth/auth.db');
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    await run(authDb, 'INSERT OR REPLACE INTO users (username, password) VALUES (?, ?)', [
      testUser.username,
      hashedPassword,
    ]);
  });

  afterAll(async () => {
    await broker.stop();
    if (authDb) {
      await closeDatabase(authDb);
    }
  });

  test('authUser succeeds for test credentials', async () => {
    const result = await broker.call('auth.authUser', {
      username: testUser.username,
      password: testUser.password,
    });

    expect(result).toEqual({
      success: true,
      message: 'Auth was successful',
    });
  });

  test('login returns a JWT token for valid credentials', async () => {
    const result = await broker.call('auth.login', {
      username: testUser.username,
      password: testUser.password,
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe('Login successful');
    expect(result.token).toEqual(expect.any(String));
    expect(result.expiresIn).toBe('24h');
  });

  test('verifyToken validates a generated token', async () => {
    const loginResult = await broker.call('auth.login', {
      username: testUser.username,
      password: testUser.password,
    });

    const verifyResult = await broker.call('auth.verifyToken', {
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
