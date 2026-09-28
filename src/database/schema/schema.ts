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
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    FOREIGN KEY (account_id)
      REFERENCES accounts(id)
      ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);

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
    target_amount REAL NOT NULL,
    current_amount REAL NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    FOREIGN KEY (account_id)
      REFERENCES accounts(id)
      ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_savings_goals_account_id ON savings_goals(account_id);
`;

export function initializeDatabase(db: SQLiteDatabase) {
  db.execSync(SCHEMA_SQL);
}
