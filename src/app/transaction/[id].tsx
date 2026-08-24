import { useLocalSearchParams } from "expo-router";

import { TransactionDetailScreen } from "../../features/transactions/screens/TransactionDetailScreen";

export default function TransactionRoute() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  return <TransactionDetailScreen transactionId={id} />;
}
