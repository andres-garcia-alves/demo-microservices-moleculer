import dotenv from 'dotenv';
import { openDatabase, closeDatabase } from '../services/shared/sqlite.js';
import { showMigrationStatus } from '../services/shared/migrations.js';

dotenv.config();

async function migrateStatus() {
  const db = await openDatabase(process.env.USER_DB_PATH || 'services/user/user.db');

  try {
    await showMigrationStatus(db, {
      migrationsPath: 'services/shared/migrations'
    });
  } catch (error) {
    console.error('❌ Error checking status:', error.message);
    process.exit(1);
  } finally {
    await closeDatabase(db);
  }
}

migrateStatus();