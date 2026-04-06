import dotenv from 'dotenv';
import { openDatabase, closeDatabase } from '../services/shared/sqlite.js';
import { rollbackMigration } from '../services/shared/migrations.js';

dotenv.config();

async function migrateDown() {
  const db = await openDatabase(process.env.USER_DB_PATH || 'services/user/user.db');

  try {
    console.log('Rolling back last migration for User Service...');
    await rollbackMigration(db, {
      migrationsPath: 'services/shared/migrations'
    });
    console.log('✅ Rollback completed');
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    process.exit(1);
  } finally {
    await closeDatabase(db);
  }
}

migrateDown();