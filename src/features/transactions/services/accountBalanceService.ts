import { getTransactions } from "./transactionService";
import { getAccount } from "../../accounts/services/accountService";

import {
  calculateIncome,
  calculateExpenses,
  calculateBalance,
} from "./transactionCalculationService";

export async function getAccountBalance(accountId: string) {
  const account = await getAccount(accountId);
  const transactions = await getTransactions(accountId);

  const income = calculateIncome(transactions);

  const expenses = calculateExpenses(transactions);

  const balance = calculateBalance(transactions, account?.initialBalance || 0);

  return {
    income,
    expenses,
    balance,
  };
}
