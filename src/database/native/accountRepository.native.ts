import type { Account } from "../../types/account";
import type { AccountRepository } from "../repositories/accountRepository";
import { getDatabase } from "../client/database";

type AccountRow = {
  id: string;
  profile_id: string;
  name: string;
  currency_code: string;
  created_at: string;
  updated_at: string;
};

function toAccount(row: AccountRow): Account {
  return {
    id: row.id,
    profileId: row.profile_id,
    name: row.name,
    currencyCode: row.currency_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const accountRepository: AccountRepository = {
  async getAccounts(profileId) {
    const db = getDatabase();

    const rows = db.getAllSync<AccountRow>(
      "SELECT * FROM accounts WHERE profile_id = ? ORDER BY created_at ASC, id ASC",
      profileId,
    );

    return rows.map(toAccount);
  },

  async getAccount(id) {
    const db = getDatabase();

    const row = db.getFirstSync<AccountRow>(
      "SELECT * FROM accounts WHERE id = ?",
      id,
    );

    return row ? toAccount(row) : null;
  },

  async createAccount(account) {
    const db = getDatabase();

    db.runSync(
      `INSERT INTO accounts
        (id, profile_id, name, currency_code, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         profile_id = excluded.profile_id,
         name = excluded.name,
         currency_code = excluded.currency_code,
         created_at = excluded.created_at,
         updated_at = excluded.updated_at`,
      account.id,
      account.profileId,
      account.name,
      account.currencyCode,
      account.createdAt,
      account.updatedAt,
    );
  },

  async updateAccount(account) {
    const db = getDatabase();

    db.runSync(
      `INSERT INTO accounts
        (id, profile_id, name, currency_code, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         profile_id = excluded.profile_id,
         name = excluded.name,
         currency_code = excluded.currency_code,
         created_at = excluded.created_at,
         updated_at = excluded.updated_at`,
      account.id,
      account.profileId,
      account.name,
      account.currencyCode,
      account.createdAt,
      account.updatedAt,
    );
  },

  async deleteAccount(id) {
    const db = getDatabase();

    db.runSync("DELETE FROM accounts WHERE id = ?", id);
  },
};
