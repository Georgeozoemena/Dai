import type { Transaction } from "../../../types/transaction";
import {
  transactionRepository,
} from "../../../database/transaction";
import { trackEvent } from "../../../services/analytics/analyticsService";
import { checkLargeExpense } from "../../notifications/services/notificationTriggerService";

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

  // Check for large expense notification (threshold: 50,000)
  if (transaction.type === "expense") {
    checkLargeExpense({
      accountId: transaction.accountId,
      transactionId: transaction.id,
      amount: transaction.amount,
      currencyCode: "₦", // TODO: Use actual currency from account
      category: transaction.category,
      threshold: 50000,
    }).catch((error) => {
      console.error("Failed to check large expense:", error);
    });
  }

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

  trackEvent("transaction_deleted");
}