import sqlite3 from 'sqlite3';
import { resolve } from 'path';

/**
 * Opens or creates a SQLite database file located relative to the project root.
 *
 * @param {string} relativePath - The relative path to the SQLite database file.
 * @returns {Promise<sqlite3.Database>} The opened database instance.
 */
export function openDatabase(relativePath) {
  const fullPath = resolve(process.cwd(), relativePath);
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(fullPath, (err) => {
      if (err) return reject(err);
      resolve(db);
    });
  });
}

/**
 * Executes a SQL statement that does not return rows.
 *
 * @param {sqlite3.Database} db - The database instance.
 * @param {string} sql - The SQL statement to execute.
 * @param {Array<unknown>} [params=[]] - Positional parameters for the SQL statement.
 * @returns {Promise<{id:number,changes:number}>} The SQL execution result.
 */
export function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

/**
 * Executes a SQL query and returns a single row.
 *
 * @param {sqlite3.Database} db - The database instance.
 * @param {string} sql - The SQL query to execute.
 * @param {Array<unknown>} [params=[]] - Positional parameters for the SQL query.
 * @returns {Promise<object|null>} The retrieved row or null if none is found.
 */
export function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

/**
 * Executes a SQL query and returns all matching rows.
 *
 * @param {sqlite3.Database} db - The database instance.
 * @param {string} sql - The SQL query to execute.
 * @param {Array<unknown>} [params=[]] - Positional parameters for the SQL query.
 * @returns {Promise<Array<object>>} The retrieved rows.
 */
export function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

/**
 * Closes the database connection.
 *
 * @param {sqlite3.Database} db - The database instance.
 * @returns {Promise<void>} Resolves when the database is closed.
 */
export function closeDatabase(db) {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}
