import { ServiceBroker } from 'moleculer';
import { openDatabase, run, all, closeDatabase } from '../shared/sqlite.js';
import { publish } from '../shared/rabbitmq.js';

const broker = new ServiceBroker();
let db;

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
    async createUser(ctx) {
      const { username, email } = ctx.params;
      const result = await run(db, 'INSERT INTO users (username, email) VALUES (?, ?)', [username, email]);
      const newUser = { id: result.id, username, email };
      await publish('user.created', newUser);
      return newUser;
    },

    async getUsers() {
      return all(db, 'SELECT id, username, email FROM users');
    },
  },

  async started() {
    db = await openDatabase('user/user.db');
    await ensureSchema();
  },

  async stopped() {
    if (db) {
      await closeDatabase(db);
    }
  },
});

export default broker;
