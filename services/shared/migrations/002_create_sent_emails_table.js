/**
 * Migration: 002_create_sent_emails_table.js
 * Creates the sent_emails table for the email service
 */

import { run, all } from '../sqlite.js';

export async function up(db) {
  await run(db, `
    CREATE TABLE sent_emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient TEXT NOT NULL,
      subject TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create index on recipient for faster queries
  await run(db, `CREATE INDEX idx_sent_emails_recipient ON sent_emails(recipient)`);
  // Create index on created_at for time-based queries
  await run(db, `CREATE INDEX idx_sent_emails_created_at ON sent_emails(created_at)`);
}

export async function down(db) {
  const { run: runDb } = await import('../sqlite.js');
  await runDb(db, `DROP INDEX IF EXISTS idx_sent_emails_created_at`);
  await runDb(db, `DROP INDEX IF EXISTS idx_sent_emails_recipient`);
  await runDb(db, `DROP TABLE IF EXISTS sent_emails`);
}