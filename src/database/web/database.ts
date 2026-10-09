import { openDB, type IDBPDatabase } from "idb";

const DATABASE_NAME = "denari-v2";
const DATABASE_VERSION = 8;

interface DenariDatabase {
  profiles: {
    key: string;
    value: Record<string, unknown>;
    indexes: { "by-user-id": string };
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
  savingsContributions: {
    key: string;
    value: Record<string, unknown>;
  };
  notifications: {
    key: string;
    value: Record<string, unknown>;
  };
}

let databasePromise: Promise<IDBPDatabase<DenariDatabase>> | null = null;
let recoveryAttempted = false;

export function getDatabase() {
  if (!databasePromise) {
    databasePromise = openDB<DenariDatabase>(DATABASE_NAME, DATABASE_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`Upgrading database from v${oldVersion} to v${DATABASE_VERSION}`);
        
        // Create profiles store
        if (!db.objectStoreNames.contains("profiles")) {
          console.log("Creating profiles store");
          const profilesStore = db.createObjectStore("profiles", {
            keyPath: "id",
          });
          profilesStore.createIndex("by-user-id", "userId", { unique: true });
        } else if (oldVersion < 4) {
          // Add userId index to existing profiles store in v4
          console.log("Adding userId index to profiles store for v4");
          const profilesStore = transaction.objectStore("profiles");
          if (!profilesStore.indexNames.contains("by-user-id")) {
            profilesStore.createIndex("by-user-id", "userId", { unique: true });
          }
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

        // Add initialBalance field to existing accounts in version 5
        if (oldVersion < 5 && oldVersion > 0) {
          console.log("Migrating accounts to add initialBalance for v5");
          
          if (db.objectStoreNames.contains("accounts")) {
            const accountsStore = transaction.objectStore("accounts");
            const request = accountsStore.getAll();
            
            request.onsuccess = () => {
              const allAccounts = request.result;
              
              for (const account of allAccounts) {
                if (!('initialBalance' in account)) {
                  account.initialBalance = 0;
                  accountsStore.put(account);
                }
              }
              
              console.log(`Migrated ${allAccounts.length} accounts with initialBalance field`);
            };
          }
        }

        // Add name and period fields to existing budgets in version 6
        if (oldVersion < 6 && oldVersion > 0) {
          console.log("Migrating budgets to add name and period for v6");
          
          if (db.objectStoreNames.contains("budgets")) {
            const budgetsStore = transaction.objectStore("budgets");
            const request = budgetsStore.getAll();
            
            request.onsuccess = () => {
              const allBudgets = request.result;
              
              for (const budget of allBudgets) {
                if (!('name' in budget)) {
                  budget.name = 'My Budget';
                }
                if (!('period' in budget)) {
                  budget.period = 'monthly';
                }
                budgetsStore.put(budget);
              }
              
              console.log(`Migrated ${allBudgets.length} budgets with name and period fields`);
            };
          }
        }

        // Add notifications store in version 7
        if (oldVersion < 7) {
          console.log("Adding notifications store for v7");
          
          if (!db.objectStoreNames.contains("notifications")) {
            console.log("Creating notifications store");
            const notificationsStore = db.createObjectStore("notifications", {
              keyPath: "id",
            });

            notificationsStore.createIndex("accountId", "accountId");
            notificationsStore.createIndex("isRead", "isRead");
          }
        }

        // Add savings contributions store in version 8
        if (oldVersion < 8) {
          console.log("Adding savings contributions store for v8");
          
          if (!db.objectStoreNames.contains("savingsContributions")) {
            console.log("Creating savingsContributions store");
            const contributionsStore = db.createObjectStore("savingsContributions", {
              keyPath: "id",
            });

            contributionsStore.createIndex("goalId", "goalId");
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
