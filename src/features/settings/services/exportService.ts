import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import type { Transaction } from "../../../types/transaction";

function escapeCsvValue(value: string | number | undefined) {
  const stringValue = String(value ?? "");

  return `"${stringValue.replace(/"/g, '""')}"`;
}

function downloadCsvWeb(csvContent: string, fileName: string) {
  // Create a Blob from the CSV content
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  // Create a download link
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = "hidden";

  // Append to body, click, and cleanup
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  URL.revokeObjectURL(url);
}

export async function exportTransactionsToCsv(
  transactions: Transaction[],
) {
  const headers = [
    "Date",
    "Type",
    "Category",
    "Description",
    "Amount",
  ];

  const rows = transactions.map((transaction) => [
    new Date(transaction.date).toLocaleDateString(),
    transaction.type,
    transaction.category,
    transaction.description ?? "",
    transaction.amount,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map(escapeCsvValue).join(","),
    ),
  ].join("\n");

  const fileName = `dai-transactions-${Date.now()}.csv`;

  // Web platform: use browser download
  if (Platform.OS === "web") {
    downloadCsvWeb(csvContent, fileName);
    return;
  }

  // Native platforms: use FileSystem and Sharing
  const fileUri =
    `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(
    fileUri,
    csvContent,
    {
      encoding: FileSystem.EncodingType.UTF8,
    },
  );

  const canShare =
    await Sharing.isAvailableAsync();

  if (!canShare) {
    throw new Error(
      "Sharing is not available on this device.",
    );
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: "text/csv",
    dialogTitle: "Export Dai Transactions",
    UTI: "public.comma-separated-values-text",
  });
}
