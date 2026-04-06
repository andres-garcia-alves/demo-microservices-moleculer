import dotenv from 'dotenv';
import { openDatabase, closeDatabase } from '../services/shared/sqlite.js';
import { runMigrations } from '../services/shared/migrations.js';

dotenv.config();

async function migrateUp() {
  const db = await openDatabase(process.env.USER_DB_PATH || 'services/user/user.db');

  try {
    console.log('Running migrations for User Service...');
    await runMigrations(db, {
      migrationsPath: 'services/shared/migrations'
    });
    console.log('✅ User Service migrations completed');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await closeDatabase(db);
  }
}

migrateUp();