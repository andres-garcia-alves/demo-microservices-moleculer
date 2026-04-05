import { ServiceBroker } from 'moleculer';
import { openDatabase, run, closeDatabase } from '../shared/sqlite.js';
import { createHealthCheckAction } from '../shared/healthCheck.js';
import logger from '../shared/logger.js';
import { getTransporterConfig } from '../shared/transporter.js';

const broker = new ServiceBroker(getTransporterConfig());
let db;

/**
 * Ensures the sent_emails table exists in the SQLite database.
 *
 * @returns {Promise<void>} Resolves when the email schema is ready.
 */
async function ensureSchema() {
  await run(
    db,
    `CREATE TABLE IF NOT EXISTS sent_emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient TEXT NOT NULL,
      subject TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`
  );
}

/**
 * Handles a user.created event by persisting a welcome email record.
 *
 * @param {object} payload - The event payload.
 * @param {string} payload.email - The recipient email address.
 * @param {string} payload.username - The recipient username.
 * @returns {Promise<void>} Resolves when the email record is stored.
 */
async function processUserCreated(payload) {
  const { email: recipient, username } = payload;
  const subject = 'Welcome to our platform!';
  const content = `Hi ${username},\n\nThank you for joining our platform.`;
  await run(db, 'INSERT INTO sent_emails (recipient, subject, content) VALUES (?, ?, ?)', [recipient, subject, content]);
  logger.info('Email queued', { recipient });
}

broker.createService({
  name: 'email',
  actions: {
    ...createHealthCheckAction({ serviceName: 'email' }),

    /**
     * Sends an email by storing it in SQLite and logging the action.
     *
     * @param {import('moleculer').Context} ctx - The Moleculer action context.
     * @returns {Promise<string>} A confirmation message.
     */
    async sendEmail(ctx) {
      const { recipient, subject, content } = ctx.params;
      await run(db, 'INSERT INTO sent_emails (recipient, subject, content) VALUES (?, ?, ?)', [recipient, subject, content]);
      logger.info('Sending email', { recipient, subject });
      logger.debug('Email content', { content });
      return `Email sent to ${recipient}`;
    },
  },

  /**
   * Moleculer event listeners.
   */
  events: {
    'user.created': {
      handler(ctx) {
        return processUserCreated(ctx.params);
      },
    },
  },

  /**
   * Starts the email service and opens the database.
   *
   * @returns {Promise<void>}
   */
  async started() {
    db = await openDatabase(process.env.EMAIL_DB_PATH || 'services/email/email.db');
    await ensureSchema();
    logger.info('Email service started and listening to user.created events');
  },

  /**
   * Closes the email SQLite database when stopped.
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
