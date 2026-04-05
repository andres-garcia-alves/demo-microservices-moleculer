import { ServiceBroker } from 'moleculer';
import bcrypt from 'bcryptjs';
import { openDatabase, run, get, closeDatabase } from '../shared/sqlite.js';
import { createHealthCheckAction } from '../shared/healthCheck.js';
import { generateToken, verifyToken } from '../shared/jwt.js';
import logger from '../shared/logger.js';
import { getTransporterConfig } from '../shared/transporter.js';

const broker = new ServiceBroker(getTransporterConfig());
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
    const hashedPassword = await bcrypt.hash('password', 10);
    await run(db, 'INSERT INTO users (username, password) VALUES (?, ?)', ['admin', hashedPassword]);
  }
}

broker.createService({
  name: 'auth',
  actions: {
    ...createHealthCheckAction({ serviceName: 'auth' }),

    /**
     * Authenticates a user by verifying username/password credentials.
     *
     * @param {import('moleculer').Context} ctx - The Moleculer action context.
     * @returns {Promise<{success:boolean, message:string}>} The authentication result.
     */
    async authUser(ctx) {
      const { username, password } = ctx.params;
      const user = await get(db, 'SELECT id, password FROM users WHERE username = ?', [username]);
      if (user && (await bcrypt.compare(password, user.password))) {
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

    /**
     * Logs a user in and returns a JWT token.
     *
     * @param {import('moleculer').Context} ctx - The Moleculer action context.
     * @returns {Promise<object>} The login result with a JWT token.
     */
    async login(ctx) {
      const { username, password } = ctx.params;
      logger.info('Login attempt', { username });
      const user = await get(db, 'SELECT id, username, password FROM users WHERE username = ?', [username]);

      if (!user || !(await bcrypt.compare(password, user.password))) {
        logger.warn('Login failed', { username });
        return {
          success: false,
          message: 'Invalid credentials',
        };
      }

      const token = generateToken({ userId: user.id, username: user.username });
      logger.info('Login successful', { userId: user.id, username });
      return {
        success: true,
        message: 'Login successful',
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      };
    },

    /**
     * Verifies a JWT token and returns the decoded payload.
     *
     * @param {import('moleculer').Context} ctx - The Moleculer action context.
     * @returns {Promise<object>} The verification result.
     */
    async verifyToken(ctx) {
      const { token } = ctx.params;
      try {
        const payload = verifyToken(token);
        logger.info('Token verified', { userId: payload.userId, username: payload.username });
        return {
          success: true,
          payload,
        };
      } catch (error) {
        logger.warn('Token verification failed', { error: error.message });
        return {
          success: false,
          message: error.message,
        };
      }
    },
  },

  /**
   * Starts the auth service and initializes its SQLite database.
   *
   * @returns {Promise<void>}
   */
  async started() {
    db = await openDatabase(process.env.AUTH_DB_PATH || 'services/auth/auth.db');
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
