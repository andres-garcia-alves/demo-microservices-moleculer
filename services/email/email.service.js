import { ServiceBroker } from 'moleculer';
import { openDatabase, run, closeDatabase } from '../shared/sqlite.js';
import { consume } from '../shared/rabbitmq.js';

const broker = new ServiceBroker();
let db;

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
    async sendEmail(ctx) {
      const { recipient, subject, content } = ctx.params;
      await run(db, 'INSERT INTO sent_emails (recipient, subject, content) VALUES (?, ?, ?)', [recipient, subject, content]);
      console.log(`Sending email to ${recipient} with subject ${subject}`);
      console.log(`Content: ${content}`);
      return `Email sent to ${recipient}`;
    },
  },

  async started() {
    db = await openDatabase('email/email.db');
    await ensureSchema();
    await consume('user.created', processUserCreated);
  },

  async stopped() {
    if (db) {
      await closeDatabase(db);
    }
  },
});

export default broker;
