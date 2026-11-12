// Opens the local SQLite database once, creates the tables and adds demo data.
// Every service gets the database through getDb(), so there is only one connection.

import * as SQLite from 'expo-sqlite';
import { SCHEMA_SQL } from './schema';
import { seedDatabase } from './seed';

export const DB_NAME = 'cityestate.db';

let dbPromise = null;

async function openAndPrepare() {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  // Foreign keys are off by default in SQLite; turn them on for this connection.
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync(SCHEMA_SQL);
  await seedDatabase(db);
  return db;
}

/** Returns the shared database connection, opening it on first use. */
export function getDb() {
  if (!dbPromise) {
    dbPromise = openAndPrepare().catch((err) => {
      dbPromise = null; // allow a retry if opening failed
      throw err;
    });
  }
  return dbPromise;
}

/** Used by the start-up screen to show "Connected to database". */
export async function getDatabaseInfo() {
  const db = await getDb();
  const tables = await db.getAllAsync(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );
  const counts = await db.getFirstAsync(
    `SELECT (SELECT COUNT(*) FROM users) AS users,
            (SELECT COUNT(*) FROM properties) AS properties,
            (SELECT COUNT(*) FROM offers) AS offers`
  );
  return { name: DB_NAME, tables: tables.map((t) => t.name), ...counts };
}

/** Test helper: forget the open connection. */
export function resetDbForTests() {
  dbPromise = null;
}
