import { openDB, type IDBPDatabase } from "idb";

const DATABASE_NAME = "denari";
const DATABASE_VERSION = 1;

interface DenariDatabase {
  profiles: {
    key: string;
    value: Record<string, unknown>;
  };
  accounts: {
    key: string;
    value: Record<string, unknown>;
  };
  transactions: {
    key: string;
    value: Record<string, unknown>;
  };
}

let databasePromise: Promise<IDBPDatabase<DenariDatabase>> | null = null;

export function getDatabase() {
  if (!databasePromise) {
    databasePromise = openDB<DenariDatabase>(
      DATABASE_NAME,
      DATABASE_VERSION,
      {
        upgrade(db) {
          if (!db.objectStoreNames.contains("profiles")) {
            db.createObjectStore("profiles", {
              keyPath: "id",
            });
          }

          if (!db.objectStoreNames.contains("accounts")) {
            const store = db.createObjectStore("accounts", {
              keyPath: "id",
            });

            store.createIndex("profileId", "profileId");
          }

          if (!db.objectStoreNames.contains("transactions")) {
            const store = db.createObjectStore("transactions", {
              keyPath: "id",
            });

            store.createIndex("accountId", "accountId");
          }
        },
      },
    );
  }

  return databasePromise;
}