import { ServiceBroker } from 'moleculer';
import { openDatabase, run, closeDatabase } from '../shared/sqlite.js';
import { consume, closeConnection } from '../shared/rabbitmq.js';

const broker = new ServiceBroker();
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
  console.log(`Email queued for ${recipient}`);
}

broker.createService({
  name: 'email',
  actions: {
    /**
     * Sends an email by storing it in SQLite and logging the action.
     *
     * @param {import('moleculer').Context} ctx - The Moleculer action context.
     * @returns {Promise<string>} A confirmation message.
     */
    async sendEmail(ctx) {
      const { recipient, subject, content } = ctx.params;
      await run(db, 'INSERT INTO sent_emails (recipient, subject, content) VALUES (?, ?, ?)', [recipient, subject, content]);
      console.log(`Sending email to ${recipient} with subject ${subject}`);
      console.log(`Content: ${content}`);
      return `Email sent to ${recipient}`;
    },
  },

  /**
   * Starts the email service and subscribes to RabbitMQ user events.
   *
   * @returns {Promise<void>}
   */
  async started() {
    db = await openDatabase('email/email.db');
    await ensureSchema();
    await consume('user.created', processUserCreated);
  },

  /**
   * Closes the email SQLite database and RabbitMQ connection when stopped.
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
