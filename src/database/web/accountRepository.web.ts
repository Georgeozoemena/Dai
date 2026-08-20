import type { Account } from "../../types/account";
import type { AccountRepository } from "../repositories/accountRepository";
import { getDatabase } from "./database";

export const accountRepository: AccountRepository = {
  async getAccounts(profileId) {
    const db = await getDatabase();

    const accounts = await db.getAllFromIndex(
      "accounts",
      "profileId",
      profileId,
    );

    return accounts as Account[];
  },

  async getAccount(id) {
    const db = await getDatabase();

    const account = await db.get("accounts", id);

    return (account as Account | undefined) ?? null;
  },

  async createAccount(account) {
    const db = await getDatabase();

    await db.put("accounts", account);
  },

  async updateAccount(account) {
    const db = await getDatabase();

    await db.put("accounts", account);
  },

  async deleteAccount(id) {
    const db = await getDatabase();

    await db.delete("accounts", id);
  },
};