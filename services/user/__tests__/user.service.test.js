import { ServiceBroker } from 'moleculer';
import createUserService from '../user.service.js';
import { openDatabase, run, closeDatabase } from '../../shared/sqlite.js';

describe('User Service', () => {
  let broker;

  beforeAll(async () => {
    broker = new ServiceBroker({
      logger: false,
      transporter: 'fake',
    });
    broker.createService(createUserService(broker));
    await broker.start();

    // Clean up test data from previous runs
    try {
      const db = await openDatabase('services/user/user.db');
      await run(db, 'DELETE FROM users WHERE username = ?', ['testuser_cjs']);
      closeDatabase(db);
    } catch (e) {
      // Table might not exist yet, that's fine
    }
  });

  afterAll(async () => {
    await broker.stop();
  });

  test('creates a user successfully', async () => {
    const result = await broker.call('user.createUser', {
      username: 'testuser_cjs',
      email: 'testuser@example.com',
    });

    expect(result).toHaveProperty('id');
    expect(result.username).toBe('testuser_cjs');
    expect(result.email).toBe('testuser@example.com');
  });

  test('returns users list', async () => {
    const users = await broker.call('user.getUsers');
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);
  });
});
