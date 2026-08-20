import type { Transaction } from "../../../types/transaction";
import {
  transactionRepository,
} from "../../../database/transaction";

export async function getTransactions(
  accountId: string,
) {
  return transactionRepository.getTransactions(
    accountId,
  );
}

export async function getTransaction(
  id: string,
) {
  return transactionRepository.getTransaction(id);
}

export async function createTransaction(
  transaction: Transaction,
) {
  await transactionRepository.createTransaction(
    transaction,
  );

  return transaction;
}

export async function updateTransaction(
  transaction: Transaction,
) {
  await transactionRepository.updateTransaction(
    transaction,
  );

  return transaction;
}

export async function deleteTransaction(
  id: string,
) {
  await transactionRepository.deleteTransaction(id);
}