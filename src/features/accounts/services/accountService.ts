import type { Account } from "../../../types/account";
import { accountRepository } from "../../../database/account";

export async function getAccounts(profileId: string) {
  return accountRepository.getAccounts(profileId);
}

export async function getAccount(id: string) {
  return accountRepository.getAccount(id);
}

export async function createAccount(account: Account) {
  await accountRepository.createAccount(account);

  return account;
}

export async function updateAccount(account: Account) {
  await accountRepository.updateAccount(account);

  return account;
}

export async function deleteAccount(id: string) {
  await accountRepository.deleteAccount(id);
}