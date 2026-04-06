/**
 * Migration: 001_create_users_table.js
 * Creates the users table for the user service
 */

import { run } from '../sqlite.js';

export async function up(db) {
  await run(db, `
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      email TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create unique index on username
  await run(db, `CREATE UNIQUE INDEX idx_users_username ON users(username)`);
}

export async function down(db) {
  const { run: runDb } = await import('../sqlite.js');
  await runDb(db, `DROP INDEX IF EXISTS idx_users_username`);
  await runDb(db, `DROP TABLE IF EXISTS users`);
}