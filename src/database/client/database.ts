import * as SQLite from "expo-sqlite";

import { initializeDatabase } from "../schema/schema";

const DATABASE_NAME = "denari.db";

let database: SQLite.SQLiteDatabase | null = null;

// Lazily opens the database and creates the schema on first use
// so startup never touches storage before it is needed.
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!database) {
    database = SQLite.openDatabaseSync(DATABASE_NAME);
    initializeDatabase(database);
  }

  return database;
}

// Closes the open connection and deletes the database file.
// Used by the in-app reset screen.
export async function deleteDatabase(): Promise<void> {
  if (database) {
    database.closeSync();
    database = null;
  }

  try {
    await SQLite.deleteDatabaseAsync(DATABASE_NAME);
  } catch (error) {
    // Deleting a file that never existed is a no-op for the
    // reset flow, not a failure.
    if (isDatabaseNotFoundError(error)) {
      return;
    }

    throw error;
  }
}

function isDatabaseNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "ERR_DATABASE_NOT_FOUND"
  );
}
