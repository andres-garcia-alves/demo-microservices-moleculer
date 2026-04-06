/**
 * Migration: 003_add_auth_users_table.js
 * Creates a separate users table with auth credentials for the auth service
 *
 * Note: This creates an auth_users table to avoid conflicts with the users table
 * created in migration 001. The auth service will use its own database anyway.
 */

import bcrypt from 'bcryptjs';
import { run, get } from '../sqlite.js';

export async function up(db) {
  // Skip if this table already exists (safety check)
  try {
    const result = await get(db, `SELECT name FROM sqlite_master WHERE type='table' AND name='auth_users'`);
    if (result) {
      console.log('auth_users table already exists, skipping migration');
      return;
    }
  } catch (e) {
    // Table doesn't exist, continue with creation
  }

  await run(db, `
    CREATE TABLE auth_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert default admin user
  const hashedPassword = await bcrypt.hash('password', 10);
  await run(db, 'INSERT INTO auth_users (username, password) VALUES (?, ?)', ['admin', hashedPassword]);
}

export async function down(db) {
  const { run: runDb } = await import('../sqlite.js');
  await runDb(db, `DROP TABLE IF EXISTS auth_users`);
}