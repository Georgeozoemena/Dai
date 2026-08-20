import type { Transaction } from "../../../types/transaction";

export type TransactionFilter =
  | "all"
  | "income"
  | "expense";

export function filterTransactions(
  transactions: Transaction[],
  filter: TransactionFilter,
) {
  if (filter === "all") {
    return transactions;
  }

  return transactions.filter(
    (transaction) =>
      transaction.type === filter,
  );
}