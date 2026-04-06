import { ServiceBroker } from 'moleculer';
import createUserService from '../user.service.js';
import { openDatabase, closeDatabase, run } from '../../shared/sqlite.js';

describe('User Service', () => {
  let broker;

  beforeAll(async () => {
    broker = new ServiceBroker({
      logger: false,
      transporter: 'fake',
    });
    broker.createService(createUserService(broker));
    await broker.start();

    // Clean the user database for this test
    const db = await openDatabase(process.env.USER_DB_PATH || 'services/user/user.db');
    await run(db, 'DELETE FROM users WHERE username != ?', ['testuser']);
    await closeDatabase(db);
  });

  afterAll(async () => {
    await broker.stop();
  });

  test('creates a user successfully', async () => {
    const result = await broker.call('user.createUser', {
      username: 'testuser_mjs',
      email: 'testuser@example.com',
    });

    expect(result).toHaveProperty('id');
    expect(result.username).toBe('testuser_mjs');
    expect(result.email).toBe('testuser@example.com');
  });

  test('returns users list', async () => {
    const users = await broker.call('user.getUsers');
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);
  });
});
