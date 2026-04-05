import { ServiceBroker } from 'moleculer';
import { openDatabase, run, all, closeDatabase } from '../shared/sqlite.js';
import { publish, closeConnection } from '../shared/rabbitmq.js';

const broker = new ServiceBroker();
let db;

/**
 * Ensures the users table exists in the SQLite database.
 *
 * @returns {Promise<void>} Resolves when the schema is ready.
 */
async function ensureSchema() {
  await run(
    db,
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      email TEXT NOT NULL
    )`
  );
}

broker.createService({
  name: 'user',
  actions: {
    /**
     * Creates a new user and publishes a RabbitMQ event.
     *
     * @param {import('moleculer').Context} ctx - The Moleculer action context.
     * @returns {Promise<object>} The created user.
     */
    async createUser(ctx) {
      const { username, email } = ctx.params;
      const result = await run(db, 'INSERT INTO users (username, email) VALUES (?, ?)', [username, email]);
      const newUser = { id: result.id, username, email };
      await publish('user.created', newUser);
      return newUser;
    },

    /**
     * Retrieves all stored users.
     *
     * @returns {Promise<Array<object>>} Array of user records.
     */
    async getUsers() {
      return all(db, 'SELECT id, username, email FROM users');
    },
  },

  /**
   * Starts the user service and prepares its SQLite database.
   *
   * @returns {Promise<void>}
   */
  async started() {
    db = await openDatabase('user/user.db');
    await ensureSchema();
  },

  /**
   * Cleans up the database and RabbitMQ connection when the service stops.
   *
   * @returns {Promise<void>}
   */
  async stopped() {
    if (db) {
      await closeDatabase(db);
    }
    await closeConnection();
  },
});

export default broker;
