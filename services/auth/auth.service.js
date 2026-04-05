import { ServiceBroker } from 'moleculer';
import { openDatabase, run, get, closeDatabase } from '../shared/sqlite.js';

const broker = new ServiceBroker();
let db;

/**
 * Ensures the authentication table exists and inserts a default admin user.
 *
 * @returns {Promise<void>} Resolves when the auth schema is ready.
 */
async function ensureSchema() {
  await run(
    db,
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )`
  );

  const admin = await get(db, 'SELECT id FROM users WHERE username = ?', ['admin']);
  if (!admin) {
    await run(db, 'INSERT INTO users (username, password) VALUES (?, ?)', ['admin', 'password']);
  }
}

broker.createService({
  name: 'auth',
  actions: {
    /**
     * Authenticates a user against the auth SQLite database.
     *
     * @param {import('moleculer').Context} ctx - The Moleculer action context.
     * @returns {Promise<{success:boolean, message:string}>} The authentication result.
     */
    async authUser(ctx) {
      const { username, password } = ctx.params;
      const user = await get(db, 'SELECT id FROM users WHERE username = ? AND password = ?', [username, password]);
      if (user) {
        return {
          success: true,
          message: 'Auth was successful',
        };
      }

      return {
        success: false,
        message: 'Auth failed',
      };
    },
  },

  /**
   * Starts the auth service and initializes its SQLite database.
   *
   * @returns {Promise<void>}
   */
  async started() {
    db = await openDatabase('auth/auth.db');
    await ensureSchema();
  },

  /**
   * Closes the auth database when the service stops.
   *
   * @returns {Promise<void>}
   */
  async stopped() {
    if (db) {
      await closeDatabase(db);
    }
  },
});

export default broker;
