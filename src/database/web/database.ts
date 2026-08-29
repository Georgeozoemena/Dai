import { openDB, type IDBPDatabase } from "idb";

const DATABASE_NAME = "denari";
const DATABASE_VERSION = 3;

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
  budgets: {
    key: string;
    value: Record<string, unknown>;
  };
  budgetCategories: {
    key: string;
    value: Record<string, unknown>;
  };
  savingsGoals: {
    key: string;
    value: Record<string, unknown>;
  };
}

let databasePromise: Promise<IDBPDatabase<DenariDatabase>> | null = null;
let recoveryAttempted = false;

export function getDatabase() {
  if (!databasePromise) {
    databasePromise = openDB<DenariDatabase>(DATABASE_NAME, DATABASE_VERSION, {
      upgrade(db, oldVersion) {
        console.log(`Upgrading database from v${oldVersion} to v${DATABASE_VERSION}`);
        
        // Create profiles store
        if (!db.objectStoreNames.contains("profiles")) {
          console.log("Creating profiles store");
          db.createObjectStore("profiles", {
            keyPath: "id",
          });
        }

        // Create accounts store
        if (!db.objectStoreNames.contains("accounts")) {
          console.log("Creating accounts store");
          const store = db.createObjectStore("accounts", {
            keyPath: "id",
          });

          store.createIndex("profileId", "profileId");
        }

        // Create transactions store
        if (!db.objectStoreNames.contains("transactions")) {
          console.log("Creating transactions store");
          const store = db.createObjectStore("transactions", {
            keyPath: "id",
          });

          store.createIndex("accountId", "accountId");
        }

        // Add budget stores in version 2
        if (oldVersion < 2) {
          console.log("Adding budget stores for v2");
          
          if (!db.objectStoreNames.contains("budgets")) {
            console.log("Creating budgets store");
            const budgetStore = db.createObjectStore("budgets", {
              keyPath: "id",
            });

            budgetStore.createIndex("accountId", "accountId");
            budgetStore.createIndex("month", "month");
          }

          if (!db.objectStoreNames.contains("budgetCategories")) {
            console.log("Creating budgetCategories store");
            const categoryStore = db.createObjectStore("budgetCategories", {
              keyPath: "id",
            });

            categoryStore.createIndex("budgetId", "budgetId");
          }
        }

        // Add savings goals store in version 3
        if (oldVersion < 3) {
          console.log("Adding savings goals store for v3");
          
          if (!db.objectStoreNames.contains("savingsGoals")) {
            console.log("Creating savingsGoals store");
            const savingsGoalStore = db.createObjectStore("savingsGoals", {
              keyPath: "id",
            });

            savingsGoalStore.createIndex("accountId", "accountId");
          }
        }
        
        console.log("Database upgrade complete");
      },
      blocked() {
        console.warn("Database upgrade blocked - another tab has the database open");
      },
      blocking() {
        console.warn("Database upgrade blocking - close other tabs");
      },
      terminated() {
        console.error("Database connection terminated unexpectedly");
        databasePromise = null;
      },
    }).catch(async (error) => {
      console.error("Failed to open database:", error);
      databasePromise = null;
      
      // Check if this is a corruption error and we haven't already tried recovery
      const isCorruptionError = 
        error.message?.includes("Internal error") ||
        error.message?.includes("backing store") ||
        error.name === "UnknownError";
      
      if (isCorruptionError && !recoveryAttempted) {
        console.warn("⚠️ Database corruption detected. Attempting automatic recovery...");
        recoveryAttempted = true;
        
        try {
          await forceDeleteDatabase();
          console.log("✅ Database deleted. Retrying initialization...");
          
          // Retry database initialization
          return getDatabase();
        } catch (recoveryError) {
          console.error("❌ Recovery failed:", recoveryError);
          throw new Error("Database corrupted and recovery failed. Please clear your browser data.");
        }
      }
      
      throw error;
    });
  }

  return databasePromise;
}

// Force delete database - used for corruption recovery
async function forceDeleteDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`Deleting database: ${DATABASE_NAME}`);
    const request = indexedDB.deleteDatabase(DATABASE_NAME);
    
    request.onsuccess = () => {
      console.log("Database deleted successfully");
      resolve();
    };
    
    request.onerror = () => {
      console.error("Delete request error:", request.error);
      reject(request.error);
    };
    
    request.onblocked = () => {
      console.warn("Delete blocked - attempting to proceed anyway");
      // Don't reject, let it continue
      setTimeout(() => resolve(), 100);
    };
  });
}

// Helper to reset database if needed (manual reset)
export async function resetDatabase() {
  try {
    // Close existing connection
    if (databasePromise) {
      const db = await databasePromise;
      db.close();
      databasePromise = null;
    }

    // Reset recovery flag
    recoveryAttempted = false;

    // Delete the database
    await forceDeleteDatabase();

    console.log("✅ Database reset complete");
    
    // Reconnect to create fresh database
    return getDatabase();
  } catch (error) {
    console.error("Failed to reset database:", error);
    throw error;
  }
}
