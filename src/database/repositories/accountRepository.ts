import type { Account } from "../../types/account";

export interface AccountRepository {
  getAccounts(profileId: string): Promise<Account[]>;

  getAccount(id: string): Promise<Account | null>;

  createAccount(account: Account): Promise<void>;

  updateAccount(account: Account): Promise<void>;

  deleteAccount(id: string): Promise<void>;
}