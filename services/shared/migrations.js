import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { run, all } from './sqlite.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Database Migration Framework
 * Provides systematic database schema management with up/down migrations
 */
export class MigrationManager {
  constructor(db, migrationsPath = 'services/shared/migrations') {
    this.db = db;
    this.migrationsPath = path.resolve(migrationsPath);
    this.migrationsTable = '_migrations';
  }

  /**
   * Initialize the migrations system by creating the migrations table
   */
  async initialize() {
    await run(this.db, `
      CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        executed_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  /**
   * Get list of executed migrations
   */
  async getExecutedMigrations() {
    const result = await all(this.db, `SELECT name FROM ${this.migrationsTable} ORDER BY id`);
    return result.map(row => row.name);
  }

  /**
   * Get list of available migration files
   */
  getAvailableMigrations() {
    if (!fs.existsSync(this.migrationsPath)) {
      return [];
    }

    return fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.js'))
      .sort(); // Sort by filename for consistent ordering
  }

  /**
   * Load a migration file
   */
  async loadMigration(filename) {
    const filePath = path.join(this.migrationsPath, filename);
    // Convert to file URL format for Windows compatibility
    const fileUrl = `file://${filePath.replace(/\\/g, '/')}`;
    const migration = await import(fileUrl);

    if (!migration.up || typeof migration.up !== 'function') {
      throw new Error(`Migration ${filename} must export an 'up' function`);
    }

    return {
      name: filename,
      up: migration.up,
      down: migration.down || null
    };
  }

  /**
   * Execute a migration up
   */
  async executeMigration(migration) {
    console.log(`Executing migration: ${migration.name}`);
    await migration.up(this.db);
    await run(this.db, `INSERT INTO ${this.migrationsTable} (name) VALUES (?)`, [migration.name]);
  }

  /**
   * Rollback a migration down
   */
  async rollbackMigration(migration) {
    if (!migration.down) {
      throw new Error(`Migration ${migration.name} does not have a down function`);
    }

    console.log(`Rolling back migration: ${migration.name}`);
    await migration.down(this.db);
    await run(this.db, `DELETE FROM ${this.migrationsTable} WHERE name = ?`, [migration.name]);
  }

  /**
   * Run pending migrations up
   */
  async migrateUp() {
    await this.initialize();

    const executed = await this.getExecutedMigrations();
    const available = this.getAvailableMigrations();

    const pending = available.filter(migration => !executed.includes(migration));

    if (pending.length === 0) {
      console.log('No pending migrations');
      return;
    }

    console.log(`Found ${pending.length} pending migration(s)`);

    for (const migrationFile of pending) {
      const migration = await this.loadMigration(migrationFile);
      await this.executeMigration(migration);
    }

    console.log('All migrations executed successfully');
  }

  /**
   * Rollback the last migration
   */
  async migrateDown() {
    await this.initialize();

    const executed = await this.getExecutedMigrations();

    if (executed.length === 0) {
      console.log('No migrations to rollback');
      return;
    }

    const lastMigration = executed[executed.length - 1];
    const migration = await this.loadMigration(lastMigration);

    await this.rollbackMigration(migration);
    console.log('Migration rolled back successfully');
  }

  /**
   * Show migration status
   */
  async showStatus() {
    await this.initialize();

    const executed = await this.getExecutedMigrations();
    const available = this.getAvailableMigrations();

    console.log('\nMigration Status:');
    console.log('================');

    for (const migration of available) {
      const status = executed.includes(migration) ? '✅' : '⏳';
      console.log(`${status} ${migration}`);
    }

    console.log(`\nTotal: ${executed.length}/${available.length} migrations executed`);
  }
}

/**
 * Create and run migrations for a database
 */
export async function runMigrations(db, options = {}) {
  const manager = new MigrationManager(db, options.migrationsPath);
  await manager.migrateUp();
}

/**
 * Rollback last migration
 */
export async function rollbackMigration(db, options = {}) {
  const manager = new MigrationManager(db, options.migrationsPath);
  await manager.migrateDown();
}

/**
 * Show migration status
 */
export async function showMigrationStatus(db, options = {}) {
  const manager = new MigrationManager(db, options.migrationsPath);
  await manager.showStatus();
}