import type { SQLiteDatabase } from "expo-sqlite";

// Full DDL for the on-device database. Kept free of any
// runtime imports so it can be consumed by the database client
// without creating a circular dependency.
const SCHEMA_SQL = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    avatar TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY NOT NULL,
    profile_id TEXT NOT NULL,
    name TEXT NOT NULL,
    initial_balance REAL NOT NULL DEFAULT 0,
    currency_code TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    FOREIGN KEY (profile_id)
      REFERENCES profiles(id)
      ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_accounts_profile_id ON accounts(profile_id);

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY NOT NULL,
    account_id TEXT NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    note TEXT,
    date TEXT NOT NULL,
    savings_goal_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    FOREIGN KEY (account_id)
      REFERENCES accounts(id)
      ON DELETE CASCADE,
    FOREIGN KEY (savings_goal_id)
      REFERENCES savings_goals(id)
      ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_savings_goal_id ON transactions(savings_goal_id);

  CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY NOT NULL,
    transaction_id TEXT NOT NULL,
    name TEXT NOT NULL,
    mime_type TEXT,
    size INTEGER,
    uri TEXT NOT NULL,
    created_at TEXT NOT NULL,

    FOREIGN KEY (transaction_id)
      REFERENCES transactions(id)
      ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_attachments_transaction_id ON attachments(transaction_id);

  CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY NOT NULL,
    account_id TEXT NOT NULL,
    name TEXT NOT NULL,
    period TEXT NOT NULL,
    month TEXT NOT NULL,
    total_income REAL NOT NULL,
    total_budget REAL NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    FOREIGN KEY (account_id)
      REFERENCES accounts(id)
      ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_budgets_account_month ON budgets(account_id, month);

  CREATE TABLE IF NOT EXISTS budget_categories (
    id TEXT PRIMARY KEY NOT NULL,
    budget_id TEXT NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    FOREIGN KEY (budget_id)
      REFERENCES budgets(id)
      ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_budget_categories_budget_id ON budget_categories(budget_id);

  CREATE TABLE IF NOT EXISTS savings_goals (
    id TEXT PRIMARY KEY NOT NULL,
    account_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    target_amount REAL NOT NULL,
    current_amount REAL NOT NULL,
    target_date TEXT,
    frequency TEXT NOT NULL,
    suggested_amount REAL NOT NULL,
    start_date TEXT NOT NULL,
    next_due_date TEXT NOT NULL,
    missed_payments INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    FOREIGN KEY (account_id)
      REFERENCES accounts(id)
      ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_savings_goals_account_id ON savings_goals(account_id);
  CREATE INDEX IF NOT EXISTS idx_savings_goals_next_due ON savings_goals(next_due_date);

  CREATE TABLE IF NOT EXISTS savings_contributions (
    id TEXT PRIMARY KEY NOT NULL,
    goal_id TEXT NOT NULL,
    transaction_id TEXT,
    amount REAL NOT NULL,
    note TEXT,
    date TEXT NOT NULL,
    is_scheduled_payment INTEGER DEFAULT 0,
    payment_number INTEGER,
    created_at TEXT NOT NULL,

    FOREIGN KEY (goal_id)
      REFERENCES savings_goals(id)
      ON DELETE CASCADE,
    FOREIGN KEY (transaction_id)
      REFERENCES transactions(id)
      ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_savings_contributions_goal_id ON savings_contributions(goal_id);
  CREATE INDEX IF NOT EXISTS idx_savings_contributions_transaction_id ON savings_contributions(transaction_id);

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY NOT NULL,
    account_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    action_type TEXT,
    action_id TEXT,
    created_at TEXT NOT NULL,

    FOREIGN KEY (account_id)
      REFERENCES accounts(id)
      ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_notifications_account_id ON notifications(account_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
`;

export function initializeDatabase(db: SQLiteDatabase) {
  db.execSync(SCHEMA_SQL);
  
  // Migration: Add initial_balance column to existing accounts table
  try {
    // Check if column exists by querying table info
    const tableInfo = db.getAllSync<{ name: string }>(
      "PRAGMA table_info(accounts)"
    );
    
    const hasInitialBalance = tableInfo.some(
      (col) => col.name === "initial_balance"
    );
    
    if (!hasInitialBalance) {
      console.log("Migrating accounts table: adding initial_balance column");
      db.execSync(`
        ALTER TABLE accounts ADD COLUMN initial_balance REAL NOT NULL DEFAULT 0;
      `);
    }
  } catch (error) {
    // If table doesn't exist yet, that's fine - it will be created with the column
    console.log("No migration needed for accounts table");
  }
  
  // Migration: Add name and period columns to existing budgets table
  try {
    const budgetTableInfo = db.getAllSync<{ name: string }>(
      "PRAGMA table_info(budgets)"
    );
    
    const hasName = budgetTableInfo.some((col) => col.name === "name");
    const hasPeriod = budgetTableInfo.some((col) => col.name === "period");
    
    if (!hasName) {
      console.log("Migrating budgets table: adding name column");
      db.execSync(`
        ALTER TABLE budgets ADD COLUMN name TEXT NOT NULL DEFAULT 'My Budget';
      `);
    }
    
    if (!hasPeriod) {
      console.log("Migrating budgets table: adding period column");
      db.execSync(`
        ALTER TABLE budgets ADD COLUMN period TEXT NOT NULL DEFAULT 'monthly';
      `);
    }
  } catch (error) {
    console.log("No migration needed for budgets table");
  }
  
  // Migration: Add notifications table
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY NOT NULL,
        account_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER NOT NULL DEFAULT 0,
        action_type TEXT,
        action_id TEXT,
        created_at TEXT NOT NULL,

        FOREIGN KEY (account_id)
          REFERENCES accounts(id)
          ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_notifications_account_id ON notifications(account_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
    `);
    console.log("Notifications table created successfully");
  } catch (error) {
    console.log("Notifications table already exists or migration not needed");
  }
  
  // Migration: Add new savings_goals columns (Ajo concept for all goals)
  try {
    const goalsTableInfo = db.getAllSync<{ name: string }>(
      "PRAGMA table_info(savings_goals)"
    );
    
    const hasDescription = goalsTableInfo.some((col) => col.name === "description");
    const hasTargetDate = goalsTableInfo.some((col) => col.name === "target_date");
    const hasFrequency = goalsTableInfo.some((col) => col.name === "frequency");
    
    if (!hasDescription) {
      console.log("Migrating savings_goals table: adding description column");
      db.execSync("ALTER TABLE savings_goals ADD COLUMN description TEXT;");
    }
    
    if (!hasTargetDate) {
      console.log("Migrating savings_goals table: adding target_date column");
      db.execSync("ALTER TABLE savings_goals ADD COLUMN target_date TEXT;");
    }
    
    // New Ajo-concept fields (required for all goals)
    if (!hasFrequency) {
      console.log("Migrating savings_goals: adding Ajo-concept fields");
      db.execSync("ALTER TABLE savings_goals ADD COLUMN frequency TEXT NOT NULL DEFAULT 'monthly';");
      db.execSync("ALTER TABLE savings_goals ADD COLUMN suggested_amount REAL NOT NULL DEFAULT 0;");
      db.execSync("ALTER TABLE savings_goals ADD COLUMN start_date TEXT NOT NULL DEFAULT (datetime('now'));");
      db.execSync("ALTER TABLE savings_goals ADD COLUMN next_due_date TEXT NOT NULL DEFAULT (datetime('now'));");
      db.execSync("ALTER TABLE savings_goals ADD COLUMN missed_payments INTEGER DEFAULT 0;");
      db.execSync("ALTER TABLE savings_goals ADD COLUMN streak INTEGER DEFAULT 0;");
      
      // Create new index
      db.execSync("CREATE INDEX IF NOT EXISTS idx_savings_goals_next_due ON savings_goals(next_due_date);");
    }
  } catch (error) {
    console.log("No migration needed for savings_goals table");
  }
  
  // Migration: Update contributions table
  try {
    const contributionsTableInfo = db.getAllSync<{ name: string }>(
      "PRAGMA table_info(savings_contributions)"
    );
    
    if (!contributionsTableInfo.some((col) => col.name === "is_scheduled_payment")) {
      console.log("Migrating savings_contributions: adding is_scheduled_payment");
      db.execSync("ALTER TABLE savings_contributions ADD COLUMN is_scheduled_payment INTEGER DEFAULT 0;");
    }
    
    if (!contributionsTableInfo.some((col) => col.name === "payment_number")) {
      console.log("Migrating savings_contributions: adding payment_number");
      db.execSync("ALTER TABLE savings_contributions ADD COLUMN payment_number INTEGER;");
    }
  } catch (error) {
    console.log("No migration needed for contribution fields");
  }
}
